from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Count, Avg, F
from django.utils import timezone
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from .models import Task
from .serializers import (
    TaskSerializer, TaskDetailSerializer, TaskCreateSerializer,
    TaskBulkUpdateSerializer, TaskFilterSerializer
)
from .permissions import IsWorkspaceMember, CanAssignTasks, IsTaskOwnerOrAssignee
from .pagination import StandardResultsSetPagination
import logging
from django.conf import settings
logger = logging.getLogger(__name__)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'assigned_to', 'workspace']
    search_fields = ['title', 'description', 'tags']
    ordering_fields = ['created_at', 'due_date', 'priority', 'updated_at']
    ordering = ['-priority', 'due_date', '-created_at']
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """Optimized queryset with select_related and prefetch_related"""
        user = self.request.user
        
        # Check cache first (optional)
        cache_key = f"user_{user.id}_tasks_queryset"
        queryset = cache.get(cache_key)
        
        if queryset is None:
            base_queryset = Task.all_objects.filter(
                workspace__members=user,
                is_deleted=False
            ).select_related(
                'assigned_to',
                'created_by',
                'workspace',
                'parent_task'
            ).prefetch_related(
                'collaborators',
                'subtasks'
            )
            
            # Apply additional filters if provided
            queryset = self.filter_queryset_by_params(base_queryset)
            
            # Cache for 30 seconds (adjust based on needs)
            cache.set(cache_key, queryset, 30)
        
        return queryset.order_by('-priority', 'due_date', '-created_at')
    
    def filter_queryset_by_params(self, queryset):
        """Apply custom filters from query parameters"""
        params = self.request.query_params
        
        # Filter by multiple statuses
        if 'status' in params:
            statuses = params.getlist('status')
            queryset = queryset.filter(status__in=statuses)
        
        # Filter by multiple priorities
        if 'priority' in params:
            priorities = params.getlist('priority')
            queryset = queryset.filter(priority__in=priorities)
        
        # Filter by tags (any match)
        if 'tags' in params:
            tags = params.getlist('tags')
            queryset = queryset.filter(tags__overlap=tags)
        
        # Overdue filter
        if params.get('is_overdue') == 'true':
            queryset = queryset.filter(
                due_date__lt=timezone.now()
            ).exclude(status='done')
        
        # Date range filters
        if 'due_before' in params:
            queryset = queryset.filter(due_date__lte=params['due_before'])
        
        if 'due_after' in params:
            queryset = queryset.filter(due_date__gte=params['due_after'])
        
        # Exclude archived
        if params.get('exclude_archived') == 'true':
            queryset = queryset.exclude(status='archived')
        
        return queryset
    
    def get_serializer_class(self):
        """Return different serializers based on action"""
        if self.action == 'create':
            return TaskCreateSerializer
        elif self.action == 'retrieve':
            return TaskDetailSerializer
        elif self.action == 'bulk_update':
            return TaskBulkUpdateSerializer
        return TaskSerializer
    
    def get_permissions(self):
        """Custom permission logic for different actions"""
        if self.action in ['assign_task', 'bulk_assign']:
            self.permission_classes = [permissions.IsAuthenticated, CanAssignTasks]
        elif self.action in ['update', 'partial_update', 'destroy']:
            self.permission_classes = [permissions.IsAuthenticated, IsTaskOwnerOrAssignee]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        """Create task with logging"""
        task = serializer.save(created_by=self.request.user)
        logger.info(f"Task {task.id} created by user {self.request.user.id}")
        
        # Clear cache for this user
        cache.delete(f"user_{self.request.user.id}_tasks_queryset")
        
        # Trigger async notification (implement with Celery)
        # notify_task_assigned.delay(task.id)
    
    def perform_update(self, serializer):
        """Update task with tracking"""
        old_status = self.get_object().status
        task = serializer.save(last_modified_by=self.request.user)
        
        if old_status != task.status:
            logger.info(f"Task {task.id} status changed from {old_status} to {task.status}")
            
            # Trigger status change webhook
            # webhook_task_status_changed.delay(task.id, old_status, task.status)
        
        # Clear cache
        cache.delete(f"user_{self.request.user.id}_tasks_queryset")
    
    def perform_destroy(self, instance):
        """Soft delete instead of hard delete"""
        instance.soft_delete(self.request.user)
        logger.info(f"Task {instance.id} soft deleted by user {self.request.user.id}")
        
        # Clear cache
        cache.delete(f"user_{self.request.user.id}_tasks_queryset")
    
    @action(detail=False, methods=['get'])
    def my_tasks(self, request):
        """Get tasks assigned to current user"""
        tasks = self.get_queryset().filter(assigned_to=request.user)
        
        # Add statistics
        stats = tasks.aggregate(
            total=Count('id'),
            completed=Count('id', filter=Q(status='done')),
            overdue=Count('id', filter=Q(due_date__lt=timezone.now()) & ~Q(status='done')),
            avg_completion_time=Avg('completed_at', filter=Q(completed_at__isnull=False))
        )
        
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response({
                'tasks': serializer.data,
                'statistics': stats
            })
        
        serializer = self.get_serializer(tasks, many=True)
        return Response({
            'tasks': serializer.data,
            'statistics': stats
        })
    
    @action(detail=False, methods=['get'])
    def todo(self, request):
        """Get todo tasks for current user"""
        tasks = self.get_queryset().filter(status='todo')
        page = self.paginate_queryset(tasks)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(tasks, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """Get dashboard statistics"""
        user = request.user
        tasks = self.get_queryset()
        
        # Calculate statistics
        statistics = {
            'total_tasks': tasks.count(),
            'completed_tasks': tasks.filter(status='done').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'todo': tasks.filter(status='todo').count(),
            'overdue': tasks.filter(due_date__lt=timezone.now()).exclude(status='done').count(),
            'high_priority': tasks.filter(priority__in=['high', 'urgent', 'critical']).count(),
            'tasks_by_priority': tasks.values('priority').annotate(count=Count('id')),
            'tasks_by_status': tasks.values('status').annotate(count=Count('id')),
            'recent_tasks': TaskSerializer(tasks[:10], many=True, context={'request': request}).data
        }
        
        return Response(statistics)
    
    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        """Bulk update multiple tasks"""
        serializer = TaskBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        task_ids = serializer.validated_data['task_ids']
        updates = serializer.validated_data['updates']
        
        # Verify user has permission for all tasks
        tasks = Task.objects.filter(id__in=task_ids, workspace__members=request.user)
        
        if tasks.count() != len(task_ids):
            raise PermissionDenied("Some tasks not found or you don't have permission")
        
        # Perform bulk update
        updated_count = tasks.update(**updates, last_modified_by=request.user)
        
        logger.info(f"Bulk updated {updated_count} tasks by user {request.user.id}")
        
        # Clear cache
        cache.delete(f"user_{request.user.id}_tasks_queryset")
        
        return Response({
            'message': f'Successfully updated {updated_count} tasks',
            'updated_count': updated_count
        })
    
    @action(detail=True, methods=['post'])
    def assign_task(self, request, pk=None):
        """Assign task to a user"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            raise ValidationError({"user_id": "This field is required"})
        
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({"user_id": "User not found"})
        
        # Check if user is in workspace
        if not task.workspace.members.filter(id=user_id).exists():
            raise PermissionDenied("User is not a member of this workspace")
        
        task.assigned_to = user
        task.save()
        
        logger.info(f"Task {task.id} assigned to user {user.id} by {request.user.id}")
        
        return Response({'message': f'Task assigned to {user.username}'})
    
    @action(detail=True, methods=['post'])
    def add_collaborator(self, request, pk=None):
        """Add a collaborator to the task"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            raise ValidationError({"user_id": "This field is required"})
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({"user_id": "User not found"})
        
        task.collaborators.add(user)
        task.save()
        
        return Response({'message': f'Collaborator {user.username} added'})
    
    @action(detail=True, methods=['post'])
    def remove_collaborator(self, request, pk=None):
        """Remove a collaborator from the task"""
        task = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            raise ValidationError({"user_id": "This field is required"})
        
        task.collaborators.remove(user_id)
        task.save()
        
        return Response({'message': 'Collaborator removed'})
    
    @action(detail=True, methods=['post'])
    def add_subtask(self, request, pk=None):
        """Add a subtask to this task"""
        parent_task = self.get_object()
        
        serializer = TaskCreateSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        subtask = serializer.save(
            parent_task=parent_task,
            workspace=parent_task.workspace
        )
        
        return Response(
            TaskSerializer(subtask, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['get'])
    def subtasks(self, request):
        """Get all subtasks for tasks"""
        task_id = request.query_params.get('task_id')
        if not task_id:
            return Response({"error": "task_id is required"}, status=400)
        
        try:
            task = Task.objects.get(id=task_id)
            subtasks = task.subtasks.all()
            serializer = self.get_serializer(subtasks, many=True)
            return Response(serializer.data)
        except Task.DoesNotExist:
            return Response({"error": "Task not found"}, status=404)
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive the task"""
        task = self.get_object()
        task.archive(request.user)
        return Response({'message': 'Task archived successfully'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore an archived task"""
        task = self.get_object()
        if task.status != 'archived':
            return Response({"error": "Task is not archived"}, status=400)
        
        task.restore()
        return Response({'message': 'Task restored successfully'})
    
    @action(detail=False, methods=['get'])
    def timeline(self, request):
        """Get tasks timeline for Gantt chart view"""
        workspace_id = request.query_params.get('workspace_id')
        if not workspace_id:
            return Response({"error": "workspace_id is required"}, status=400)
        
        tasks = self.get_queryset().filter(
            workspace_id=workspace_id,
            start_date__isnull=False
        ).exclude(status='archived')
        
        timeline_data = []
        for task in tasks:
            timeline_data.append({
                'id': task.id,
                'title': task.title,
                'start': task.start_date,
                'end': task.due_date,
                'status': task.status,
                'priority': task.priority,
                'assignee': task.assigned_to.username if task.assigned_to else None,
                'completion': task.completion_percentage
            })
        
        return Response(timeline_data)