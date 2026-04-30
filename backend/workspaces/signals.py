from django.db.models.signals import post_save, pre_delete
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import WorkspaceInvitation, WorkspaceMembership
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=WorkspaceInvitation)
def send_invitation_email(sender, instance, created, **kwargs):
    """Send email when invitation is created"""
    if created:
        # Build invitation URL
        invite_url = f"{settings.FRONTEND_URL}/invitations/accept/{instance.token}/"
        
        # Send email (use Celery in production)
        send_mail(
            f'Invitation to join {instance.workspace.name}',
            f'You have been invited to join {instance.workspace.name} as a {instance.role}.\n\n'
            f'Click here to accept: {invite_url}\n\n'
            f'This invitation expires in 7 days.',
            settings.DEFAULT_FROM_EMAIL,
            [instance.email],
            fail_silently=True,
        )
        
        logger.info(f"Invitation email sent to {instance.email}")

@receiver(post_save, sender=WorkspaceMembership)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send welcome email when user joins workspace"""
    if created:
        send_mail(
            f'Welcome to {instance.workspace.name}',
            f'You have been added to {instance.workspace.name} as a {instance.role}.\n\n'
            f'Get started by logging in to your dashboard.',
            settings.DEFAULT_FROM_EMAIL,
            [instance.user.email],
            fail_silently=True,
        )