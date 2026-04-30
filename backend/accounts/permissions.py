from rest_framework import permissions
from .models import User

class IsAdminOrManager(permissions.BasePermission):
    """Allows access only to admin or manager users"""
    
    def has_permission(self, request, view):
        if view.action == 'me':
            return True
        return request.user and (request.user.is_super_admin or request.user.role in ['admin', 'manager'])
    
    def has_object_permission(self, request, view, obj):
        if view.action in ['me', 'update_profile', 'change_password']:
            return obj == request.user
        return request.user and (request.user.is_super_admin or request.user.role in ['admin', 'manager'])

class CanManageUsers(permissions.BasePermission):
    """Allows access to users with user management permissions"""
    
    def has_permission(self, request, view):
        return request.user and request.user.has_permission('manage_users')
    
    def has_object_permission(self, request, view, obj):
        # Can't modify yourself through this endpoint
        if obj == request.user:
            return False
        return request.user.has_permission('manage_users')

class IsOwnerOrAdmin(permissions.BasePermission):
    """Allows access to object owner or admin"""
    
    def has_object_permission(self, request, view, obj):
        if isinstance(obj, User):
            return obj == request.user or request.user.is_super_admin
        return request.user.is_super_admin