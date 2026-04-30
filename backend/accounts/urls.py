
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RegisterView, CustomTokenObtainPairView, LogoutView,
    UserViewSet, MembershipViewSet, VerifyEmailView, ResendVerificationView
)
from rest_framework_simplejwt.views import TokenRefreshView

user_me = UserViewSet.as_view({"get": "me"})

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')
router.register(r'memberships', MembershipViewSet, basename='membership')

urlpatterns = [
    path("users/me/", user_me),
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', CustomTokenObtainPairView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('verify-email/<uuid:token>/', VerifyEmailView.as_view(), name='verify_email'),
    path('resend-verification/', ResendVerificationView.as_view(), name='resend_verification'),
    path('', include(router.urls)),
] 