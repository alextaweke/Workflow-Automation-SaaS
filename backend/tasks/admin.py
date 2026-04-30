from django.contrib import admin
from django.utils.html import format_html
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status_color', 'priority_badge', 'assigned_to', 
                    'due_date', 'is_overdue_status', 'created_at']
    list_filter = ['status', 'priority', 'workspace', 'created_by', 'assigned_to']
    search_fields = ['title', 'description', 'tags']
    readonly_fields = ['uuid', 'created_at', 'updated_at', 'completed_at']
    date_hierarchy = 'created_at'
    list_per_page = 50
    ordering = ['-priority', '-created_at']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('uuid', 'title', 'description', 'workspace', 'parent_task')
        }),
        ('Assignment', {
            'fields': ('assigned_to', 'collaborators', 'created_by')
        }),
        ('Status & Priority', {
            'fields': ('status', 'priority', 'tags')
        }),
        ('Timeline', {
            'fields': ('start_date', 'due_date', 'completed_at')
        }),
        ('Time Tracking', {
            'fields': ('estimated_hours', 'actual_hours')
        }),
        ('Audit', {
            'fields': ('created_at', 'updated_at', 'last_modified_by', 'is_deleted', 'deleted_at'),
            'classes': ('collapse',)
        }),
    )
    
    def status_color(self, obj):
        colors = {
            'todo': 'blue',
            'in_progress': 'orange',
            'done': 'green',
            'archived': 'gray'
        }
        return format_html(
            '<span style="color: {};">●</span> {}',
            colors.get(obj.status, 'black'),
            obj.get_status_display()
        )
    status_color.short_description = 'Status'
    
    def priority_badge(self, obj):
        badges = {
            'low': 'info',
            'medium': 'warning',
            'high': 'danger',
            'urgent': 'danger',
            'critical': 'danger'
        }
        return format_html(
            '<span class="badge badge-{}">{}</span>',
            badges.get(obj.priority, 'secondary'),
            obj.get_priority_display()
        )
    priority_badge.short_description = 'Priority'
    
    def is_overdue_status(self, obj):
        if obj.is_overdue:
            return format_html('<span style="color: red;">⚠ Overdue</span>')
        return 'On time'
    is_overdue_status.short_description = 'Status'
    
    actions = ['mark_as_done', 'bulk_archive']
    
    def mark_as_done(self, request, queryset):
        updated = queryset.update(status='done')
        self.message_user(request, f'{updated} tasks marked as done.')
    mark_as_done.short_description = 'Mark selected tasks as done'
    
    def bulk_archive(self, request, queryset):
        updated = queryset.update(status='archived')
        self.message_user(request, f'{updated} tasks archived.')
    bulk_archive.short_description = 'Archive selected tasks'