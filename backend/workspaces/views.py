from datetime import timedelta

from django.utils import timezone
from rest_framework import viewsets, permissions, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, ValidationError
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from accounts.models import User

from accounts.models import User
from accounts.serializers import UserSerializer
from .models import Workspace, WorkspaceMembership, WorkspaceInvitation
from .serializers import (
    WorkspaceSerializer,
    WorkspaceCreateSerializer,
    WorkspaceInvitationSerializer,
    WorkspaceMemberAddSerializer,
    WorkspaceSettingsSerializer,
)
from .permissions import IsWorkspaceOwner, IsWorkspaceAdmin, CanManageWorkspace
from .pagination import WorkspacePagination
import logging
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action

from django.db.models import Q, Count
from .models import Company, Department
from .serializers import (
    CompanySerializer,
    DepartmentSerializer,
    WorkspaceMembershipSerializer,
    UserBasicSerializer,
)

logger = logging.getLogger(__name__)


class WorkspaceViewSet(viewsets.ModelViewSet):
    serializer_class = WorkspaceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [
        DjangoFilterBackend,
        filters.SearchFilter,
        filters.OrderingFilter,
    ]
    filterset_fields = ["plan", "is_active", "is_archived"]
    search_fields = ["name", "description"]
    ordering_fields = ["created_at", "name", "plan"]
    ordering = ["-created_at"]
    pagination_class = WorkspacePagination

    def get_queryset(self):
        user = self.request.user

        # Cache queryset for performance
        cache_key = f"user_workspaces_{user.id}"
        queryset = cache.get(cache_key)

        if queryset is None:
            queryset = (
                Workspace.objects.filter(
                    Q(members=user) | Q(owner=user), is_archived=False
                )
                .select_related("owner")
                .prefetch_related("members")
                .distinct()
            )

            # Add annotations
            queryset = queryset.annotate(member_count=Count("members", distinct=True))

            # cache.set(cache_key, queryset, 300)  # Cache for 5 minutes

        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return WorkspaceCreateSerializer
        elif self.action in ["update_settings", "partial_update_settings"]:
            return WorkspaceSettingsSerializer
        return WorkspaceSerializer

    def get_permissions(self):
        if self.action in ["update", "partial_update", "destroy", "archive", "restore"]:
            self.permission_classes = [permissions.IsAuthenticated, IsWorkspaceOwner]
        elif self.action in ["add_member", "remove_member", "update_member_role"]:
            self.permission_classes = [permissions.IsAuthenticated, IsWorkspaceAdmin]
        elif self.action in ["invite_member", "resend_invitation"]:
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
            logger.info(
                f"Workspace {workspace.id} plan changed from {old_plan} to {workspace.plan}"
            )
            # Trigger any plan change webhooks or notifications

        cache.delete(f"user_workspaces_{self.request.user.id}")

    def perform_destroy(self, instance):
        instance.archive()
        logger.info(f"Workspace {instance.id} archived by user {self.request.user.id}")
        cache.delete(f"user_workspaces_{self.request.user.id}")

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """Add existing user to workspace"""
        workspace = self.get_object()
        serializer = WorkspaceMemberAddSerializer(
            data=request.data, context={"workspace": workspace}
        )
        serializer.is_valid(raise_exception=True)

        from django.conf import settings

        user = User.objects.get(id=serializer.validated_data["user_id"])
        role = serializer.validated_data["role"]

        membership = workspace.add_member(user, role, invited_by=request.user)

        logger.info(
            f"User {user.id} added to workspace {workspace.id} by {request.user.id}"
        )

        return Response(
            {
                "message": f"User {user.email} added successfully",
                "membership": WorkspaceMembershipSerializer(membership).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["delete"])
    def remove_member(self, request, pk=None):
        """Remove member from workspace"""
        workspace = self.get_object()
        user_id = request.query_params.get("user_id")

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

        logger.info(
            f"User {user.id} removed from workspace {workspace.id} by {request.user.id}"
        )

        return Response({"message": f"User {user.email} removed successfully"})

    @action(detail=True, methods=["post"])
    def update_member_role(self, request, pk=None):
        """Update member's role in workspace"""
        workspace = self.get_object()
        user_id = request.data.get("user_id")
        new_role = request.data.get("role")

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
            WorkspaceMembership, workspace=workspace, user=user
        )

        if user == workspace.owner and new_role != "owner":
            raise PermissionDenied("Cannot change owner's role")

        old_role = membership.role
        membership.role = new_role
        membership.save()

        logger.info(
            f"User {user.id} role changed from {old_role} to {new_role} in workspace {workspace.id}"
        )

        return Response(
            {
                "message": f"Role updated to {new_role}",
                "membership": WorkspaceMembershipSerializer(membership).data,
            }
        )

    @action(detail=True, methods=["post"])
    def invite_member(self, request, pk=None):
        """Invite a user to workspace via email"""
        workspace = self.get_object()
        serializer = WorkspaceInvitationSerializer(
            data=request.data, context={"workspace": workspace, "request": request}
        )
        serializer.is_valid(raise_exception=True)

        invitation = serializer.save()

        # Send email invitation (implement with Celery)
        # send_workspace_invitation_email.delay(invitation.id)

        logger.info(
            f"Invitation sent to {invitation.email} for workspace {workspace.id}"
        )

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["get"])
    def invitations(self, request, pk=None):
        """Get all pending invitations for workspace"""
        workspace = self.get_object()
        invitations = WorkspaceInvitation.objects.filter(
            workspace=workspace, status="pending"
        ).select_related("invited_by")

        serializer = WorkspaceInvitationSerializer(invitations, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def resend_invitation(self, request, pk=None):
        """Resend a pending invitation"""
        workspace = self.get_object()
        invitation_id = request.data.get("invitation_id")

        invitation = get_object_or_404(
            WorkspaceInvitation, id=invitation_id, workspace=workspace, status="pending"
        )

        # Reset expiry date
        from django.utils import timezone

        invitation.expires_at = timezone.now() + timezone.timedelta(days=7)
        invitation.save()

        # Resend email
        # resend_workspace_invitation_email.delay(invitation.id)

        return Response({"message": "Invitation resent successfully"})

    @action(detail=True, methods=["post"])
    def archive(self, request, pk=None):
        """Archive workspace"""
        workspace = self.get_object()
        workspace.archive()
        return Response({"message": "Workspace archived successfully"})

    @action(detail=True, methods=["post"])
    def restore(self, request, pk=None):
        """Restore archived workspace"""
        workspace = self.get_object()
        if not workspace.is_archived:
            return Response({"error": "Workspace is not archived"}, status=400)

        workspace.restore()
        return Response({"message": "Workspace restored successfully"})

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get all workspace members with their roles"""
        workspace = self.get_object()
        memberships = WorkspaceMembership.objects.filter(
            workspace=workspace
        ).select_related("user", "invited_by")

        serializer = WorkspaceMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get all workspace members with their roles"""
        workspace = self.get_object()
        memberships = WorkspaceMembership.objects.filter(
            workspace=workspace
        ).select_related("user", "invited_by")

        serializer = WorkspaceMembershipSerializer(memberships, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """Get workspace statistics - Role based access"""

        workspace = self.get_object()
        user = request.user  # noqa: F811

        # Check if user has access to this workspace
        if not workspace.members.filter(id=user.id).exists():
            raise PermissionDenied("You don't have access to this workspace")

        # Get user's role in the workspace
        membership = WorkspaceMembership.objects.filter(
            workspace=workspace, user=user
        ).first()

        is_admin_or_owner = (user == workspace.owner) or (
            membership and membership.role in ["admin", "owner"]
        )

        # Base stats for all users
        base_stats = {
            "total_members": workspace.member_count,
            "total_tasks": workspace.tasks.count(),
            "completed_tasks": workspace.tasks.filter(status="done").count(),
            "overdue_tasks": workspace.tasks.filter(due_date__lt=timezone.now())
            .exclude(status="done")
            .count(),
        }

        # Admin / Owner sees full stats
        if is_admin_or_owner:
            stats = {
                **base_stats,
                "tasks_by_status": workspace.tasks.values("status").annotate(
                    count=Count("id")
                ),
                "tasks_by_priority": workspace.tasks.values("priority").annotate(
                    count=Count("id")
                ),
                "storage_used_mb": 0,
                "subscription": {
                    "plan": workspace.plan,
                    "is_active": workspace.is_subscription_active,
                    "days_until_expiry": workspace.days_until_expiry,
                    "limits": {
                        "max_members": workspace.get_max_members(),
                        "max_projects": workspace.get_max_projects(),
                        "max_storage_mb": workspace.get_max_storage(),
                    },
                },
            }

        # Member / viewer sees limited stats
        else:
            user_tasks = workspace.tasks.filter(assigned_to=user)

            stats = {
                **base_stats,
                "my_tasks": {
                    "total": user_tasks.count(),
                    "completed": user_tasks.filter(status="done").count(),
                    "overdue": user_tasks.filter(due_date__lt=timezone.now())
                    .exclude(status="done")
                    .count(),
                },
                "message": "Showing limited stats. Contact workspace admin for full statistics.",
            }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def my_stats(self, request):
        """Get global stats across all user's workspaces"""
        user = request.user  # noqa: F811

        # Get all workspaces user has access to
        workspaces = Workspace.objects.filter(
            Q(members=user) | Q(owner=user), is_archived=False
        ).distinct()

        # Check if user is admin/owner in any workspace
        is_admin_anywhere = (
            WorkspaceMembership.objects.filter(
                user=user, workspace__in=workspaces, role__in=["admin", "owner"]
            ).exists()
            or workspaces.filter(owner=user).exists()
        )

        # Get unique members across all workspaces
        total_members = (
            User.objects.filter(
                Q(workspace_memberships__workspace__in=workspaces)
                | Q(owned_workspaces__in=workspaces)
            )
            .distinct()
            .count()
        )

        from tasks.models import Task

        if is_admin_anywhere:
            total_tasks = Task.objects.filter(workspace__in=workspaces).count()
            completed_tasks = Task.objects.filter(
                workspace__in=workspaces, status="done"
            ).count()
        else:
            total_tasks = Task.objects.filter(
                workspace__in=workspaces, assigned_to=user
            ).count()

            completed_tasks = Task.objects.filter(
                workspace__in=workspaces, assigned_to=user, status="done"
            ).count()

        stats = {
            "total_workspaces": workspaces.count(),
            "total_members": total_members,
            "total_tasks": total_tasks,
            "completed_tasks": completed_tasks,
            "workspaces": [
                {
                    "id": ws.id,
                    "name": ws.name,
                    "role": (
                        "owner"
                        if ws.owner == user
                        else WorkspaceMembership.objects.filter(workspace=ws, user=user)
                        .values_list("role", flat=True)
                        .first()
                    ),
                }
                for ws in workspaces
            ],
        }

        return Response(stats)

    @action(detail=False, methods=["get"])
    def distribution(self, request):
        """Get workspace distribution by status"""
        user = request.user

        workspaces = Workspace.objects.filter(Q(members=user) | Q(owner=user))

        distribution = [
            {
                "name": "Active",
                "value": workspaces.filter(is_active=True, is_archived=False).count(),
                "color": "#3B82F6",
            },
            {
                "name": "Archived",
                "value": workspaces.filter(is_archived=True).count(),
                "color": "#9CA3AF",
            },
            {
                "name": "Pending",
                "value": workspaces.filter(is_active=False, is_archived=False).count(),
                "color": "#F59E0B",
            },
        ]

        return Response(distribution)

    @action(detail=False, methods=["get"])
    def task_trends(self, request):
        """Get task trends for the last 6 months across user's workspaces"""
        user = request.user

        # Get user's workspaces
        workspaces = Workspace.objects.filter(
            Q(members=user) | Q(owner=user), is_archived=False
        ).distinct()

        # Get last 6 months
        months = []
        current_date = timezone.now()
        for i in range(5, -1, -1):
            month_date = current_date - timedelta(days=30 * i)
            months.append(
                {"month": month_date.strftime("%b"), "date": month_date.replace(day=1)}
            )

        from tasks.models import Task

        trends = []
        for month_data in months:
            month_start = month_data["date"].replace(
                day=1, hour=0, minute=0, second=0, microsecond=0
            )
            if month_data["month"] == "Dec":
                month_end = month_start.replace(year=month_start.year + 1, month=1)
            else:
                month_end = month_start.replace(month=month_start.month + 1)

            tasks = Task.objects.filter(
                workspace__in=workspaces,
                created_at__gte=month_start,
                created_at__lt=month_end,
            )

            trends.append(
                {
                    "month": month_data["month"],
                    "completed": tasks.filter(status="done").count(),
                    "pending": tasks.filter(status="pending").count(),
                    "inProgress": tasks.filter(status="in_progress").count(),
                }
            )

        return Response(trends)

    @action(detail=False, methods=["get"])
    def workspace_distribution(self, request):
        """Get workspace distribution by status"""
        user = request.user

        workspaces = Workspace.objects.filter(
            Q(members=user) | Q(owner=user)
        ).distinct()

        distribution = [
            {
                "name": "Active",
                "value": workspaces.filter(is_active=True, is_archived=False).count(),
                "color": "#3B82F6",
            },
            {
                "name": "Archived",
                "value": workspaces.filter(is_archived=True).count(),
                "color": "#9CA3AF",
            },
            {
                "name": "Pending",
                "value": workspaces.filter(is_active=False, is_archived=False).count(),
                "color": "#F59E0B",
            },
        ]

        return Response(distribution)

    @action(detail=False, methods=["get"])
    def weekly_activity(self, request):
        """Get weekly activity data"""
        user = request.user

        # Get last 7 days
        days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        today = timezone.now().date()
        start_of_week = today - timedelta(days=today.weekday())

        # Get user's workspaces
        workspaces = Workspace.objects.filter(
            Q(members=user) | Q(owner=user)
        ).distinct()

        from tasks.models import Task

        activity = []
        for i, day in enumerate(days):
            day_date = start_of_week + timedelta(days=i)
            day_start = timezone.make_aware(
                timezone.datetime.combine(day_date, timezone.datetime.min.time())
            )
            day_end = day_start + timedelta(days=1)

            tasks = Task.objects.filter(
                workspace__in=workspaces,
                created_at__gte=day_start,
                created_at__lt=day_end,
            )

            activity.append(
                {
                    "day": day,
                    "tasks": tasks.count(),
                    "meetings": 0,  # You can add meetings model if you have one
                    "completed": tasks.filter(
                        status="done", updated_at__gte=day_start, updated_at__lt=day_end
                    ).count(),
                }
            )

        return Response(activity)

    @action(detail=True, methods=["patch"])
    def update_settings(self, request, pk=None):
        """Update workspace settings"""
        workspace = self.get_object()
        serializer = WorkspaceSettingsSerializer(
            workspace, data=request.data, partial=True
        )
        serializer.is_valid(raise_exception=True)
        workspace = serializer.save()

        return Response(
            WorkspaceSerializer(workspace, context={"request": request}).data
        )

    @action(detail=False, methods=["get"])
    def my_workspaces(self, request):
        """Get workspaces where user is owner"""
        workspaces = Workspace.objects.filter(owner=request.user, is_active=True)
        page = self.paginate_queryset(workspaces)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(workspaces, many=True)
        return Response(serializer.data)

    # workspaces/views.py - Add this to WorkspaceViewSet

    # @action(detail=True, methods=['get'])
    # def members(self, request, pk=None):
    #     """Get all workspace members with their details"""
    #     workspace = self.get_object()
    #     members = workspace.members.all()
    #     serializer = UserBasicSerializer(members, many=True)
    #     return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def switch_workspace(self, request):
        """Switch active workspace (update session)"""
        workspace_id = request.query_params.get("workspace_id")

        if not workspace_id:
            raise ValidationError({"workspace_id": "This parameter is required"})

        workspace = get_object_or_404(Workspace, id=workspace_id, members=request.user)

        # Update last accessed
        WorkspaceMembership.objects.filter(
            workspace=workspace, user=request.user
        ).update(last_accessed=timezone.now())

        # Store in session or JWT
        request.session["active_workspace_id"] = workspace.id

        return Response(
            {
                "message": f"Active workspace set to {workspace.name}",
                "workspace_id": workspace.id,
            }
        )


# views.py - Update CompanyViewSet


class CompanyViewSet(viewsets.ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        workspace_id = self.request.query_params.get("workspace_id")

        queryset = (
            Company.objects.filter(Q(owner=user) | Q(departments__members=user))
            .distinct()
            .annotate(
                department_count=Count("departments", distinct=True),
                member_count=Count("departments__members", distinct=True),
            )
        )

        # Filter by workspace if provided
        if workspace_id:
            queryset = queryset.filter(workspace_id=workspace_id)

        return queryset

    def perform_create(self, serializer):
        workspace_id = self.request.data.get("workspace")
        if workspace_id:
            workspace = get_object_or_404(
                Workspace, id=workspace_id, members=self.request.user
            )
            company = serializer.save(owner=self.request.user, workspace=workspace)
        else:
            company = serializer.save(owner=self.request.user)

        logger.info(f"Company {company.id} created by user {self.request.user.id}")

    @action(detail=True, methods=["get"])
    def departments(self, request, pk=None):
        """Get all departments for a company"""
        company = self.get_object()
        departments = company.departments.all()
        serializer = DepartmentSerializer(
            departments, many=True, context={"request": request}
        )
        return Response(serializer.data)

    @action(detail=True, methods=["post"])
    def add_department(self, request, pk=None):
        """Add a department to company"""
        company = self.get_object()

        # Log the incoming data for debugging
        logger.info(f"Add department request data: {request.data}")

        # Validate required fields
        name = request.data.get("name")
        if not name:
            return Response(
                {"error": "Department name is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Prepare data for serializer
        department_data = {
            "name": name,
            "description": request.data.get("description", ""),
            "company": company.id,
        }

        # Add manager if provided
        manager_id = request.data.get("manager")
        if manager_id and manager_id != "":
            try:
                department_data["manager"] = int(manager_id)
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid manager ID"}, status=status.HTTP_400_BAD_REQUEST
                )

        # Add parent department if provided
        parent_id = request.data.get("parent_department")
        if parent_id and parent_id != "":
            try:
                parent_id_int = int(parent_id)
                # Verify parent department exists and belongs to this company
                parent_exists = Department.objects.filter(
                    id=parent_id_int, company=company
                ).exists()
                if not parent_exists:
                    return Response(
                        {"error": "Parent department not found in this company"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                department_data["parent_department"] = parent_id_int
            except (ValueError, TypeError):
                return Response(
                    {"error": "Invalid parent department ID"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create the department
        serializer = DepartmentSerializer(
            data=department_data, context={"request": request}
        )

        if serializer.is_valid():
            department = serializer.save()
            logger.info(f"Department {department.id} created in company {company.id}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        # Log validation errors
        logger.error(f"Department validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["get"])
    def stats(self, request, pk=None):
        """Get company statistics"""
        company = self.get_object()
        stats = {
            "total_departments": company.departments.count(),
            "total_members": company.departments.aggregate(
                total=Count("members", distinct=True)
            )["total"]
            or 0,
            "departments": list(
                company.departments.values("id", "name", "member_count")
            ),
            "created_at": company.created_at,
            "is_verified": company.is_verified,
            "workspace": {
                "id": company.workspace.id if company.workspace else None,
                "name": company.workspace.name if company.workspace else None,
            },
        }
        return Response(stats)

    @action(detail=True, methods=["post"])
    def assign_to_workspace(self, request, pk=None):
        """Assign company to a workspace"""
        company = self.get_object()
        workspace_id = request.data.get("workspace_id")

        if not workspace_id:
            return Response(
                {"error": "workspace_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            workspace = Workspace.objects.get(id=workspace_id, members=request.user)
            company.workspace = workspace
            company.save()
            return Response(
                {
                    "message": f"Company {company.name} assigned to workspace {workspace.name}",
                    "workspace": {"id": workspace.id, "name": workspace.name},
                }
            )
        except Workspace.DoesNotExist:
            return Response(
                {"error": "Workspace not found or you don't have access"},
                status=status.HTTP_404_NOT_FOUND,
            )


# views.py - Update DepartmentViewSet


class DepartmentViewSet(viewsets.ModelViewSet):
    serializer_class = DepartmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        workspace_id = self.request.query_params.get("workspace_id")

        queryset = Department.objects.filter(
            Q(company__owner=user) | Q(members=user)
        ).distinct()

        # Filter by workspace through company
        if workspace_id:
            queryset = queryset.filter(company__workspace_id=workspace_id)

        return queryset

    def get_permissions(self):
        # Add workspace permission checks
        if self.action in ["create", "update", "partial_update", "destroy"]:
            self.permission_classes = [permissions.IsAuthenticated]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def add_member(self, request, pk=None):
        """Add member to department"""
        department = self.get_object()
        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from django.contrib.auth import get_user_model

            User = get_user_model()
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"}, status=status.HTTP_404_NOT_FOUND
            )

        # Check if user is in the workspace
        workspace = department.company.workspace
        if workspace and not workspace.members.filter(id=user_id).exists():
            return Response(
                {"error": "User must be a member of the workspace first"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        department.members.add(user)
        return Response(
            {
                "message": f"Member {user.username} added",
                "member_count": department.members.count(),
            }
        )

    @action(detail=True, methods=["delete"])
    def remove_member(self, request, pk=None):
        """Remove member from department"""
        department = self.get_object()
        user_id = request.query_params.get("user_id")

        if not user_id:
            return Response(
                {"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST
            )

        department.members.remove(user_id)
        return Response(
            {"message": "Member removed", "member_count": department.members.count()}
        )

    @action(detail=True, methods=["get"])
    def members(self, request, pk=None):
        """Get all department members"""
        department = self.get_object()
        users = department.members.all()
        serializer = UserSerializer(users, many=True)
        return Response(serializer.data)
