# # import email
# # from rest_framework import generics
# # from rest_framework import viewsets, status, permissions
# # from rest_framework.decorators import action
# # from rest_framework.response import Response
# # from rest_framework_simplejwt.views import TokenObtainPairView
# # from django.contrib.auth import authenticate
# # from django.shortcuts import get_object_or_404
# # from .models import Workspace, Task, User
# # from .serializers import (
# #     RegisterSerializer, WorkspaceSerializer, TaskSerializer, UserSerializer
# # )
# # from .permissions import IsOwnerOrReadOnly, IsWorkspaceMember
# # from .services import create_workspace
# # # Custom Token View (for email login)
# # class CustomTokenObtainPairView(TokenObtainPairView):
# #     def post(self, request, *args, **kwargs):

# #         username_field = request.data.get('email')  # Expecting 'email' instead of 'username'
# #         password = request.data.get('password')

# #         if username_field and password:
# #             user = authenticate(email=username_field, password=password)
# #             if user:
# #                 return super().post(request, *args, **kwargs)

# #         return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

# # # User ViewSet (profile + me)
# # class UserViewSet(viewsets.ReadOnlyModelViewSet):
# #     queryset = User.objects.all()   # ✅ ADD THIS
# #     serializer_class = UserSerializer
# #     permission_classes = [permissions.IsAuthenticated]

# #     def get_queryset(self):
# #         return User.objects.filter(id=self.request.user.id)
# # # Workspace ViewSet
# # class WorkspaceViewSet(viewsets.ModelViewSet):
# #     serializer_class = WorkspaceSerializer
# #     permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

# #     def get_queryset(self):
# #         return Workspace.objects.filter(members=self.request.user)


# #     def perform_create(self, serializer):
# #        create_workspace(self.request.user, serializer.validated_data)

# # # Task ViewSet (Your MVP core!)
# # class TaskViewSet(viewsets.ModelViewSet):
# #     serializer_class = TaskSerializer
# #     permission_classes = [permissions.IsAuthenticated, IsWorkspaceMember]

# #     def get_queryset(self):
# #         workspace_id = self.request.query_params.get('workspace')
# #         if workspace_id:
# #             return Task.objects.filter(workspace_id=workspace_id, workspace__members=self.request.user)

# #         # Default: user's tasks across all workspaces
# #         return Task.objects.filter(
# #             workspace__members=self.request.user
# #         ).order_by('-created_at')

# #     def perform_create(self, serializer):
# #         serializer.save(created_by=self.request.user)

# #     @action(detail=False, methods=['get'])
# #     def my_tasks(self, request):
# #         """Filter tasks assigned to current user"""
# #         tasks = self.get_queryset().filter(assignee=request.user)
# #         serializer = self.get_serializer(tasks, many=True)
# #         return Response(serializer.data)

# #     @action(detail=False, methods=['get'])
# #     def todo(self, request):
# #         """Todo tasks only"""
# #         tasks = self.get_queryset().filter(status='todo')
# #         serializer = self.get_serializer(tasks, many=True)
# #         return Response(serializer.data)
# # # Register view (non-ViewSet)
# # class RegisterView(generics.CreateAPIView):
# #     serializer_class = RegisterSerializer
# #     permission_classes = [permissions.AllowAny]

# #     def create(self, request, *args, **kwargs):
# #         response = super().create(request, *args, **kwargs)
# #         return Response({
# #             "message": "User created successfully",
# #             "user": response.data
# #         }, status=201)
# # analytics/views.py - Create a new analytics app or add to existing
# from os import path

# from rest_framework.decorators import api_view, permission_classes
# from rest_framework.permissions import IsAuthenticated
# from rest_framework.response import Response
# from django.db.models import Count, Q
# from django.utils import timezone
# from datetime import timedelta

# from tasks.models import Task
# from workspaces.models import Workspace


# @api_view(["GET"])
# @permission_classes([IsAuthenticated])
# def weekly_activity(request):
#     """Get weekly activity data"""
#     user = request.user

#     # Get last 7 days
#     days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
#     today = timezone.now().date()
#     start_of_week = today - timedelta(days=today.weekday())

#     # Get user's workspaces
#     workspaces = Workspace.objects.filter(Q(members=user) | Q(owner=user))

#     activity = []
#     for i, day in enumerate(days):
#         day_date = start_of_week + timedelta(days=i)
#         day_start = timezone.make_aware(
#             timezone.datetime.combine(day_date, timezone.datetime.min.time())
#         )
#         day_end = day_start + timedelta(days=1)

#         tasks = Task.objects.filter(
#             workspace__in=workspaces, created_at__gte=day_start, created_at__lt=day_end
#         )

#         activity.append(
#             {
#                 "day": day,
#                 "tasks": tasks.count(),
#                 "meetings": 0,  # You can add meetings model if you have one
#                 "completed": tasks.filter(
#                     status="done", updated_at__gte=day_start, updated_at__lt=day_end
#                 ).count(),
#             }
#         )

#     return Response(activity)
