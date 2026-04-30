from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Task
import logging

logger = logging.getLogger(__name__)

@receiver(pre_save, sender=Task)
def track_task_changes(sender, instance, **kwargs):
    """Track changes before saving"""
    if instance.pk:
        try:
            old_instance = sender.objects.get(pk=instance.pk)
            instance._changed_fields = []
            
            for field in ['status', 'assigned_to', 'priority', 'due_date']:
                if getattr(old_instance, field) != getattr(instance, field):
                    instance._changed_fields.append(field)
        except sender.DoesNotExist:
            pass

@receiver(post_save, sender=Task)
def send_task_notifications(sender, instance, created, **kwargs):
    """Send notifications on task creation/update"""
    if created:
        # Send email to assignee
        if instance.assigned_to and instance.assigned_to.email:
            send_mail(
                f'New Task Assigned: {instance.title}',
                f'You have been assigned a new task: {instance.title}\n\n'
                f'Due Date: {instance.due_date or "No due date"}\n'
                f'Priority: {instance.get_priority_display()}\n\n'
                f'View task: {settings.FRONTEND_URL}/tasks/{instance.id}',
                settings.DEFAULT_FROM_EMAIL,
                [instance.assigned_to.email],
                fail_silently=True,
            )
        
        logger.info(f"Task {instance.id} created - notifications sent")
    
    elif hasattr(instance, '_changed_fields'):
        # Status change notifications
        if 'status' in instance._changed_fields and instance.assigned_to:
            # Send status update notification
            pass
        
        if 'assigned_to' in instance._changed_fields and instance.assigned_to:
            # Send reassignment notification
            pass