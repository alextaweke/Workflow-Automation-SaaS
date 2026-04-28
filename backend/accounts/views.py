from django.contrib.auth import authenticate
from rest_framework import generics, permissions, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import RegisterSerializer, UserSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


# REGISTER
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


# LOGIN
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(request, username=username, password=password)

        if not user:
            return Response({"error": "Invalid credentials"}, status=401)

        return super().post(request, *args, **kwargs)


# CURRENT USER
class UserViewSet(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def me(self, request):
        return Response({
            "id": request.user.id,
            "email": request.user.email,
            "username": request.user.username,
        })