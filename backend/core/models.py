# from django.contrib.auth.models import User
# from django.db import models
# from django.core.mail import send_mail
# from django.db.models.signals import post_save
# from django.dispatch import receiver

# class Workspace(models.Model):
#     name = models.CharField(max_length=255)
#     owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='owned_workspaces')
#     members = models.ManyToManyField(User, related_name='workspaces', blank=True)
#     created_at = models.DateTimeField(auto_now_add=True)
    
#     def __str__(self):
#         return self.name

# class Task(models.Model):
#     STATUS_CHOICES = [
#         ('todo', 'Todo'),
#         ('in_progress', 'In Progress'),
#         ('done', 'Done'),
#     ]
    
#     title = models.CharField(max_length=255)
#     description = models.TextField(blank=True)
#     status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
#     assignee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_tasks')
#     workspace = models.ForeignKey(Workspace, on_delete=models.CASCADE, related_name='tasks')
#     created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tasks')
#     created_at = models.DateTimeField(auto_now_add=True)
#     updated_at = models.DateTimeField(auto_now=True)
    
#     class Meta:
#         ordering = ['-created_at']
    
#     def __str__(self):
#         return f"{self.title} - {self.status}"

# # Email notification
# @receiver(post_save, sender=Task)
# def send_task_notification(sender, instance, created, **kwargs):
#     if created and instance.assignee != instance.created_by:
#         send_mail(
#             subject=f'New Task: {instance.title}',
#             message=f'{instance.description}\n\nWorkspace: {instance.workspace.name}',
#             from_email='noreply@workflow.com',
#             recipient_list=[instance.assignee.email],
#         )