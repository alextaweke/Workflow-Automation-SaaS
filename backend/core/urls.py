from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# ViewSet Router (automatic CRUD URLs!)
router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'workspaces', views.WorkspaceViewSet, basename='workspace')
router.register(r'tasks', views.TaskViewSet, basename='task')

urlpatterns = [
    # Auth
     path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/token/', views.CustomTokenObtainPairView.as_view(), name='token'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # ViewSets (automatic: list, create, retrieve, update, delete)
    path('', include(router.urls)),
]