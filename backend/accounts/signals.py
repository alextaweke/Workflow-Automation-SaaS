from django.db.models.signals import post_save
from django.dispatch import receiver
from django.conf import settings
from .models import User, UserActivityLog

@receiver(post_save, sender=User)
def log_user_creation(sender, instance, created, **kwargs):
    """Log when a new user is created"""
    if created:
        UserActivityLog.objects.create(
            user=instance,
            activity_type='create',
            description='User account created',
            metadata={'source': 'registration'}
        )