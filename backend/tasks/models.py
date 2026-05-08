from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator, MaxLengthValidator
from django.utils import timezone
from workspaces.models import Workspace
import uuid

class TaskManager(models.Manager):
    """Custom manager for Task model with advanced queryset methods"""
    
    def overdue(self):
        return self.filter(due_date__lt=timezone.now(), status__in=['todo', 'in_progress'])
    
    def completed_today(self):
        today = timezone.now().date()
        return self.filter(
            status='done',
            completed_at__date=today
        )
    
    def by_priority(self, priority):
        return self.filter(priority=priority)
    
    def get_user_tasks(self, user, include_completed=False):
        qs = self.filter(assigned_to=user)
        if not include_completed:
            qs = qs.exclude(status='done')
        return qs

class Task(models.Model):
    # UUID for public API exposure (security through obscurity)
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    
    # Enhanced status choices with colors for UI
    STATUS_CHOICES = (
        ("backlog", "Backlog"),
        ("todo", "Todo"),
        ("in_progress", "In Progress"),
        ("in_review", "In Review"),
        ("done", "Done"),
        ("archived", "Archived"),
    )
    
    STATUS_COLORS = {
        "backlog": "#94a3b8",
        "todo": "#3b82f6",
        "in_progress": "#eab308",
        "in_review": "#8b5cf6",
        "done": "#10b981",
        "archived": "#6b7280",
    }
    
    # Priority levels
    PRIORITY_CHOICES = (
        ("low", "Low"),
        ("medium", "Medium"),
        ("high", "High"),
        ("urgent", "Urgent"),
        ("critical", "Critical"),
    )
    
    PRIORITY_LEVELS = {
        "low": 1,
        "medium": 2,
        "high": 3,
        "urgent": 4,
        "critical": 5,
    }
    
    # Relations
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="tasks",
        null=True, 
        blank=True
    )
    company = models.ForeignKey(
    'workspaces.Company',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='tasks',
    help_text="The company this task belongs to"
    )

    department = models.ForeignKey(
    'workspaces.Department',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    related_name='tasks',
    help_text="The department this task belongs to"
    )
    # Parent-child relationship for task breakdown
    parent_task = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='subtasks'
    )
    
    # Basic fields with enhanced validation
    title = models.CharField(
        max_length=255,
        validators=[MinLengthValidator(3, "Title must be at least 3 characters long")]
    )
    
    description = models.TextField(blank=True)
    
    # Rich text description (optional - requires django-tinymce or similar)
    # rich_description = models.TextField(blank=True, help_text="HTML formatted description")
    
    # Metadata
    tags = models.JSONField(default=list, blank=True, help_text="List of tags")
    
    # Assignments
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="assigned_tasks"
    )
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="created_tasks"
    )
    
    # Additional assignees (multiple people)
    collaborators = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="collaborated_tasks",
        blank=True
    )
    
    # Status and priority
    status = models.CharField(
        max_length=20, 
        choices=STATUS_CHOICES, 
        default="todo",
        db_index=True
    )
    
    priority = models.CharField(
        max_length=20,
        choices=PRIORITY_CHOICES,
        default="medium",
        db_index=True
    )
    
    # Timelines
    due_date = models.DateTimeField(null=True, blank=True, db_index=True)
    start_date = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Time tracking
    estimated_hours = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    actual_hours = models.DecimalField(max_digits=6, decimal_places=2, default=0)
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="modified_tasks"
    )
    
    # Soft delete
    is_deleted = models.BooleanField(default=False, db_index=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    
    # Custom manager
    objects = TaskManager()
    all_objects = models.Manager()  # Includes soft-deleted
    
    class Meta:
        ordering = ['-priority', 'due_date', '-created_at']
        indexes = [
            models.Index(fields=['workspace', 'status']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['due_date', 'status']),
            models.Index(fields=['workspace', 'priority']),
            models.Index(fields=['-created_at']),
        ]
        permissions = [
            ("can_assign_tasks", "Can assign tasks to any user"),
            ("can_view_all_tasks", "Can view all tasks in workspace"),
            ("can_archive_tasks", "Can archive tasks"),
        ]
    
    def __str__(self):
        return f"{self.title} (ID: {self.id})"
    
    def save(self, *args, **kwargs):
        # Auto-set completed_at when status changes to done
        if self.status == 'done' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'done':
            self.completed_at = None
        
        # Update timestamps on status change
        if self.pk:
            old = Task.all_objects.get(pk=self.pk)
            if old.status != self.status:
                # Could trigger webhooks or signals here
                pass
        
        super().save(*args, **kwargs)
    
    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.due_date and self.status not in ['done', 'archived']:
            return timezone.now() > self.due_date
        return False
    
    @property
    def is_blocked(self):
        """Check if any subtask is blocking this task"""
        if self.subtasks.filter(status__in=['todo', 'in_progress']).exists():
            return True
        return False
    
    @property
    def completion_percentage(self):
        """Calculate completion based on subtasks"""
        total_subtasks = self.subtasks.count()
        if total_subtasks == 0:
            return 0 if self.status != 'done' else 100
        
        completed = self.subtasks.filter(status='done').count()
        return int((completed / total_subtasks) * 100)
    
    @property
    def time_variance(self):
        """Calculate time variance (estimated vs actual)"""
        if self.estimated_hours:
            variance = (self.actual_hours - self.estimated_hours) / self.estimated_hours * 100
            return round(variance, 2)
        return None
    
    def archive(self, user):
        """Archive the task"""
        self.status = 'archived'
        self.last_modified_by = user
        self.save()
    
    def restore(self):
        """Restore from archive"""
        if self.status == 'archived':
            self.status = 'todo'
            self.save()
    
    def soft_delete(self, user):
        """Soft delete the task"""
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.last_modified_by = user
        self.save()
    
    def hard_delete(self):
        """Permanently delete the task"""
        super().delete()