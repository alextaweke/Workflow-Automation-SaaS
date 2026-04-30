from rest_framework import permissions

class IsWorkspaceMember(permissions.BasePermission):
    """Check if user is a member of the task's workspace"""
    
    def has_permission(self, request, view):
        if view.action in ['create']:
            # For creation, check workspace from request data
            workspace_id = request.data.get('workspace')
            if workspace_id:
                from workspaces.models import Workspace
                try:
                    workspace = Workspace.objects.get(id=workspace_id)
                    return workspace.members.filter(id=request.user.id).exists()
                except Workspace.DoesNotExist:
                    return False
            return False
        return True
    
    def has_object_permission(self, request, view, obj):
        # Check if user is a member of the workspace
        return obj.workspace.members.filter(id=request.user.id).exists()

class IsTaskOwnerOrAssignee(permissions.BasePermission):
    """Check if user is owner, assignee, or collaborator"""
    
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Creator can do anything
        if obj.created_by == request.user:
            return True
        
        # Assignee can update but not delete
        if request.method != 'DELETE' and obj.assigned_to == request.user:
            return True
        
        # Collaborators can update but not delete
        if request.method != 'DELETE' and obj.collaborators.filter(id=request.user.id).exists():
            return True
        
        return False

class CanAssignTasks(permissions.BasePermission):
    """Check if user can assign tasks to others"""
    
    def has_permission(self, request, view):
        # Workspace admins or task creators can assign
        return request.user.has_perm('tasks.can_assign_tasks') or request.user.is_staff
    
    def has_object_permission(self, request, view, obj):
        return request.user == obj.created_by or request.user.has_perm('tasks.can_assign_tasks')