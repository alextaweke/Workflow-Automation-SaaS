from rest_framework import permissions
from .models import WorkspaceMembership

class IsWorkspaceOwner(permissions.BasePermission):
    """Check if user is workspace owner"""
    
    def has_object_permission(self, request, view, obj):
        return obj.owner == request.user

class IsWorkspaceAdmin(permissions.BasePermission):
    """Check if user is workspace admin or owner"""
    
    def has_object_permission(self, request, view, obj):
        try:
            membership = WorkspaceMembership.objects.get(
                workspace=obj,
                user=request.user
            )
            return membership.role in ['owner', 'admin']
        except WorkspaceMembership.DoesNotExist:
            return False
    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return True

class CanManageWorkspace(permissions.BasePermission):
    """Check if user can manage workspace (owner or admin with manage permission)"""
    
    def has_object_permission(self, request, view, obj):
        try:
            membership = WorkspaceMembership.objects.get(
                workspace=obj,
                user=request.user
            )
            return membership.has_permission('manage')
        except WorkspaceMembership.DoesNotExist:
            return False

class IsWorkspaceMember(permissions.BasePermission):
    """Check if user is a workspace member"""
    
    def has_permission(self, request, view):
        if view.action == 'create':
            return True
        return True
    
    def has_object_permission(self, request, view, obj):
        return obj.members.filter(id=request.user.id).exists()