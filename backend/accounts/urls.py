from django.urls import path
from .views import RegisterView, CustomTokenObtainPairView, UserViewSet
from rest_framework_simplejwt.views import TokenRefreshView

user_me = UserViewSet.as_view({"get": "me"})

urlpatterns = [
    path("register/", RegisterView.as_view()),
    path("token/", CustomTokenObtainPairView.as_view()),
    path("refresh/", TokenRefreshView.as_view()),
    path("me/", user_me),
]