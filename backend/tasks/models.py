from django.db import models
from django.contrib.auth.models import User
from workspaces.models import Workspace

class Task(models.Model):
    STATUS_CHOICES = [
        ('todo', 'Todo'),
        ('in_progress', 'In Progress'),
        ('done', 'Done'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')

    assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
    workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='tasks')
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')

    created_at = models.DateTimeField(auto_now_add=True)