from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission: Owners can edit, others read-only
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        # Owners or staff can edit
        return obj.owner == request.user if hasattr(obj, 'owner') else True

class IsWorkspaceMember(permissions.BasePermission):
    """
    Users must be workspace members
    """
    def has_permission(self, request, view):
        return True
    
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, 'workspace'):
            return obj.workspace.members.filter(id=request.user.id).exists()
        return True
