# from django.urls import path
# from .views import RegisterView, CustomTokenObtainPairView, UserViewSet
# from rest_framework_simplejwt.views import TokenRefreshView

# user_me = UserViewSet.as_view({"get": "me"})

# urlpatterns = [
#     path("register/", RegisterView.as_view()),
#     path("token/", CustomTokenObtainPairView.as_view()),
#     path("refresh/", TokenRefreshView.as_view()),
#     path("me/", user_me),
# ]


from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import RegisterView, CustomTokenView, MeView

urlpatterns = [
    path('register/', RegisterView.as_view()),
    path('token/', CustomTokenView.as_view()),
    path('refresh/', TokenRefreshView.as_view()),
    path('me/', MeView.as_view()),
]