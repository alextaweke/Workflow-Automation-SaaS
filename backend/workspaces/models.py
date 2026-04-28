from django.db import models
from django.conf import settings


class Workspace(models.Model):
    name = models.CharField(max_length=255)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_workspaces'
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name='workspaces'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name