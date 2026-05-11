from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Count, Q
from django.utils import timezone
from datetime import timedelta

from tasks.models import Task
from workspaces.models import Workspace


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def weekly_activity(request):
    """Get weekly activity data"""
    user = request.user

    # Get last 7 days
    days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    today = timezone.now().date()
    start_of_week = today - timedelta(days=today.weekday())

    # Get user's workspaces
    workspaces = Workspace.objects.filter(Q(members=user) | Q(owner=user))

    activity = []
    for i, day in enumerate(days):
        day_date = start_of_week + timedelta(days=i)
        day_start = timezone.make_aware(
            timezone.datetime.combine(day_date, timezone.datetime.min.time())
        )
        day_end = day_start + timedelta(days=1)

        tasks = Task.objects.filter(
            workspace__in=workspaces, created_at__gte=day_start, created_at__lt=day_end
        )

        activity.append(
            {
                "day": day,
                "tasks": tasks.count(),
                "meetings": 0,  # You can add meetings model if you have one
                "completed": tasks.filter(
                    status="done", updated_at__gte=day_start, updated_at__lt=day_end
                ).count(),
            }
        )

    return Response(activity)
