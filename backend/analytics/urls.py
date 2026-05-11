from analytics.views import weekly_activity
from django.urls import path

urlpatterns = [
    # ... existing URLs ...
    path("weekly-activity/", weekly_activity, name="weekly-activity"),
]
