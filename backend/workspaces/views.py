from pytz import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from .models import Workspace, WorkspaceMembership, WorkspaceInvitation
from .serializers import (
    WorkspaceSerializer, WorkspaceCreateSerializer, WorkspaceInvitationSerializer,
    WorkspaceMemberAddSerializer, WorkspaceSettingsSerializer
)
from .permissions import IsWorkspaceOwner, IsWorkspaceAdmin, CanManageWorkspace
from .pagination import WorkspacePagination
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action

from django.db.models import Q, Count
from .models import Company, Department
from .serializers import CompanySerializer, DepartmentSerializer



logger = logging.getLogger(__name__)

class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['plan', 'is_active', 'is_archived']
    search_fields = ['name', 'description']
    ordering_fields = ['created_at', 'name', 'plan']
    ordering = ['-created_at']
    pagination_class = WorkspacePagination
    
    def get_queryset(self):
        user = self.request.user
        
        # Cache queryset for performance
        cache_key = f"user_workspaces_{user.id}"
        queryset = cache.get(cache_key)
        
        if queryset is None:
            queryset = Workspace.objects.filter(
                Q(members=user) | Q(owner=user),
                is_archived=False
            ).select_related('owner').prefetch_related('members').distinct()
            
            # Add annotations
            queryset = queryset.annotate(
                member_count=Count('members', distinct=True)
            )
            
            # cache.set(cache_key, queryset, 300)  # Cache for 5 minutes
        
        return queryset

    def get_serializer_class(self):
        if self.action == 'create':
            return WorkspaceCreateSerializer
        elif self.action in ['update_settings', 'partial_update_settings']:
            return WorkspaceSettingsSerializer
        return WorkspaceSerializer
    
    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy', 'archive', 'restore']:
            self.permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
        elif self.action in ['add_member', 'remove_member', 'update_member_role']:
            self.permission_classes = [permissions.IsAuthenticated, IsWorkspaceAdmin]
        elif self.action in ['invite_member', 'resend_invitation']:
            self.permission_classes = [permissions.IsAuthenticated, CanManageWorkspace]
        return super().get_permissions()
    
    def perform_create(self, serializer):
        workspace = serializer.save()
        logger.info(f"Workspace {workspace.id} created by user {self.request.user.id}")
        
        # Clear user's workspace cache
        cache.delete(f"user_workspaces_{self.request.user.id}")
    
    def perform_update(self, serializer):
        old_plan = self.get_object().plan
        workspace = serializer.save()
        
        if old_plan != workspace.plan:
            logger.info(f"Workspace {workspace.id} plan changed from {old_plan} to {workspace.plan}")
            # Trigger any plan change webhooks or notifications
        
        cache.delete(f"user_workspaces_{self.request.user.id}")
    
    def perform_destroy(self, instance):
        instance.archive()
        logger.info(f"Workspace {instance.id} archived by user {self.request.user.id}")
        cache.delete(f"user_workspaces_{self.request.user.id}")
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add existing user to workspace"""
        workspace = self.get_object()
        serializer = WorkspaceMemberAddSerializer(
            data=request.data,
            context={'workspace': workspace}
        )
        serializer.is_valid(raise_exception=True)
        
        from django.conf import settings
        user = User.objects.get(id=serializer.validated_data['user_id'])
        role = serializer.validated_data['role']
        
        membership = workspace.add_member(user, role, invited_by=request.user)
        
        logger.info(f"User {user.id} added to workspace {workspace.id} by {request.user.id}")
        
        return Response({
            'message': f'User {user.email} added successfully',
            'membership': WorkspaceMembershipSerializer(membership).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove member from workspace"""
        workspace = self.get_object()
        user_id = request.query_params.get('user_id')
        
        if not user_id:
            raise ValidationError({"user_id": "This parameter is required"})
        
        from django.conf import settings
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({"user_id": "User not found"})
        
        if user == workspace.owner:
            raise PermissionDenied("Cannot remove workspace owner")
        
        workspace.remove_member(user)
        
        logger.info(f"User {user.id} removed from workspace {workspace.id} by {request.user.id}")
        
        return Response({'message': f'User {user.email} removed successfully'})
    
    @action(detail=True, methods=['post'])
    def update_member_role(self, request, pk=None):
        """Update member's role in workspace"""
        workspace = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        
        if not user_id or not new_role:
            raise ValidationError({"message": "user_id and role are required"})
        
        if new_role not in dict(WorkspaceMembership.ROLE_CHOICES):
            raise ValidationError({"role": "Invalid role"})
        
        from django.conf import settings
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            raise ValidationError({"user_id": "User not found"})
        
        membership = get_object_or_404(
            WorkspaceMembership,
            workspace=workspace,
            user=user
        )
        
        if user == workspace.owner and new_role != 'owner':
            raise PermissionDenied("Cannot change owner's role")
        
        old_role = membership.role
        membership.role = new_role
        membership.save()
        
        logger.info(f"User {user.id} role changed from {old_role} to {new_role} in workspace {workspace.id}")
        
        return Response({
            'message': f'Role updated to {new_role}',
            'membership': WorkspaceMembershipSerializer(membership).data
        })
    
    @action(detail=True, methods=['post'])
    def invite_member(self, request, pk=None):
        """Invite a user to workspace via email"""
        workspace = self.get_object()
        serializer = WorkspaceInvitationSerializer(
            data=request.data,
            context={'workspace': workspace, 'request': request}
        )
        serializer.is_valid(raise_exception=True)
        
        invitation = serializer.save()
        
        # Send email invitation (implement with Celery)
        # send_workspace_invitation_email.delay(invitation.id)
        
        logger.info(f"Invitation sent to {invitation.email} for workspace {workspace.id}")
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def invitations(self, request, pk=None):
        """Get all pending invitations for workspace"""
        workspace = self.get_object()
        invitations = WorkspaceInvitation.objects.filter(
            workspace=workspace,
            status='pending'
        ).select_related('invited_by')
        
        serializer = WorkspaceInvitationSerializer(invitations, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def resend_invitation(self, request, pk=None):
        """Resend a pending invitation"""
        workspace = self.get_object()
        invitation_id = request.data.get('invitation_id')
        
        invitation = get_object_or_404(
            WorkspaceInvitation,
            id=invitation_id,
            workspace=workspace,
            status='pending'
        )
        
        # Reset expiry date
        from django.utils import timezone
        invitation.expires_at = timezone.now() + timezone.timedelta(days=7)
        invitation.save()
        
        # Resend email
        # resend_workspace_invitation_email.delay(invitation.id)
        
        return Response({'message': 'Invitation resent successfully'})
    
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        """Archive workspace"""
        workspace = self.get_object()
        workspace.archive()
        return Response({'message': 'Workspace archived successfully'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        """Restore archived workspace"""
        workspace = self.get_object()
        if not workspace.is_archived:
            return Response({"error": "Workspace is not archived"}, status=400)
        
        workspace.restore()
        return Response({'message': 'Workspace restored successfully'})
    
    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        """Get all workspace members with their roles"""
        workspace = self.get_object()
        memberships = WorkspaceMembership.objects.filter(
            workspace=workspace
        ).select_related('user', 'invited_by')
        
        serializer = WorkspaceMembershipSerializer(memberships, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get workspace statistics"""
        workspace = self.get_object()
        stats = {
            'total_members': workspace.member_count,
            'total_tasks': workspace.tasks.count(),
            'completed_tasks': workspace.tasks.filter(status='done').count(),
            'overdue_tasks': workspace.tasks.filter(
                due_date__lt=timezone.now()
            ).exclude(status='done').count(),
            'tasks_by_status': workspace.tasks.values('status').annotate(
                count=Count('id')
            ),
            'tasks_by_priority': workspace.tasks.values('priority').annotate(
                count=Count('id')
            ),
            'storage_used_mb': 0,  # Implement storage calculation
            'subscription': {
                'plan': workspace.plan,
                'is_active': workspace.is_subscription_active,
                'days_until_expiry': workspace.days_until_expiry,
                'limits': {
                    'max_members': workspace.get_max_members(),
                    'max_projects': workspace.get_max_projects(),
                    'max_storage_mb': workspace.get_max_storage()
                }
            }
        }
        
        return Response(stats)
    
    @action(detail=True, methods=['patch'])
    def update_settings(self, request, pk=None):
        """Update workspace settings"""
        workspace = self.get_object()
        serializer = WorkspaceSettingsSerializer(
            workspace,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        workspace = serializer.save()
        
        return Response(WorkspaceSerializer(workspace, context={'request': request}).data)
    
    @action(detail=False, methods=['get'])
    def my_workspaces(self, request):
        """Get workspaces where user is owner"""
        workspaces = Workspace.objects.filter(owner=request.user, is_active=True)
        page = self.paginate_queryset(workspaces)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(workspaces, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def switch_workspace(self, request):
        """Switch active workspace (update session)"""
        workspace_id = request.query_params.get('workspace_id')
        
        if not workspace_id:
            raise ValidationError({"workspace_id": "This parameter is required"})
        
        workspace = get_object_or_404(
            Workspace,
            id=workspace_id,
            members=request.user
        )
        
        # Update last accessed
        WorkspaceMembership.objects.filter(
            workspace=workspace,
            user=request.user
        ).update(last_accessed=timezone.now())
        
        # Store in session or JWT
        request.session['active_workspace_id'] = workspace.id
        
        return Response({
            'message': f'Active workspace set to {workspace.name}',
            'workspace_id': workspace.id
        })

class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Company.objects.filter(
            Q(owner=user) | Q(departments__members=user)
        ).distinct().annotate(
            department_count=Count('departments', distinct=True),
            member_count=Count('departments__members', distinct=True)
        )
    
    def perform_create(self, serializer):
        company = serializer.save()
        logger.info(f"Company {company.id} created by user {self.request.user.id}")
    
    @action(detail=True, methods=['get'])
    def departments(self, request, pk=None):
        """Get all departments for a company"""
        company = self.get_object()
        departments = company.departments.all()
        serializer = DepartmentSerializer(departments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_department(self, request, pk=None):
        """Add a department to company"""
        company = self.get_object()
        serializer = DepartmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(company=company)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get company statistics"""
        company = self.get_object()
        stats = {
            'total_departments': company.departments.count(),
            'total_members': company.departments.aggregate(
                total=Count('members', distinct=True)
            )['total'] or 0,
            'departments': list(company.departments.values('id', 'name', 'member_count')),
            'created_at': company.created_at,
            'is_verified': company.is_verified
        }
        return Response(stats)

class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        return Department.objects.filter(
            Q(company__owner=user) | Q(members=user)
        ).distinct()
    
    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        """Add member to department"""
        department = self.get_object()
        user_id = request.data.get('user_id')
        
        from django.conf import settings
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        department.members.add(user)
        return Response({'message': f'Member {user.username} added'})
    
    @action(detail=True, methods=['delete'])
    def remove_member(self, request, pk=None):
        """Remove member from department"""
        department = self.get_object()
        user_id = request.query_params.get('user_id')
        
        department.members.remove(user_id)
        return Response({'message': 'Member removed'})