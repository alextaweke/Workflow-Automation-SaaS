# from django.contrib import admin
# from .models import Workspace, Task

# @admin.register(Workspace)
# class WorkspaceAdmin(admin.ModelAdmin):
#     list_display = ['name', 'owner', 'created_at']
#     list_filter = ['created_at']
#     filter_horizontal = ['members']

# @admin.register(Task)
# class TaskAdmin(admin.ModelAdmin):
#     list_display = ['title', 'status', 'assignee', 'workspace', 'created_at']  # Fixed!
#     list_filter = ['status', 'workspace', 'created_at']
#     list_editable = ['status']
#     search_fields = ['title', 'description']