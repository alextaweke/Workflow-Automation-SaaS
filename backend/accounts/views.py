from django.contrib.auth import authenticate, login, logout, get_user_model
from rest_framework import generics, permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer, UserDetailSerializer,
    ChangePasswordSerializer, ForgotPasswordSerializer, ResetPasswordSerializer,
    UpdateProfileSerializer, UserRoleUpdateSerializer, MembershipSerializer,
    UserActivityLogSerializer, UserSessionSerializer
)
from .models import User, UserActivityLog, UserSession, PasswordResetToken, Membership
from .permissions import IsAdminOrManager, CanManageUsers
import logging
import uuid
logger = logging.getLogger(__name__)
User = get_user_model()

# REGISTER
class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # Send welcome email
        self.send_welcome_email(user)
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'message': 'Registration successful. Please verify your email.'
        }, status=status.HTTP_201_CREATED)
    
    def send_welcome_email(self, user):
        """Send welcome email (use Celery in production)"""
        subject = f'Welcome to {settings.SITE_NAME}'
        message = f"""
        Hi {user.get_full_name() or user.username},
        
        Welcome to {settings.SITE_NAME}! We're excited to have you on board.
        
        Get started by completing your profile and creating your first workspace.
        
        Best regards,
        The {settings.SITE_NAME} Team
        """
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
        except Exception as e:
            logger.error(f"Failed to send welcome email: {e}")

# LOGIN
class CustomTokenObtainPairView(TokenObtainPairView):
    def post(self, request, *args, **kwargs):
        serializer = LoginSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        
        user = serializer.validated_data['user']
        
        # Create session record
        session = UserSession.objects.create(
            user=user,
            session_key=str(uuid.uuid4()),  # ALWAYS unique
            ip_address=request.META.get('REMOTE_ADDR'),
            user_agent=request.META.get('HTTP_USER_AGENT', '')[:255],
            device_type=self.get_device_type(request.META.get('HTTP_USER_AGENT', '')),
            browser=self.get_browser(request.META.get('HTTP_USER_AGENT', '')),
            os=self.get_os(request.META.get('HTTP_USER_AGENT', ''))
)

        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        return Response({
            'user': UserSerializer(user).data,
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'session_id': session.id,
            'message': 'Login successful'
        })
    
    def get_device_type(self, user_agent):
        user_agent = user_agent.lower()
        if 'mobile' in user_agent:
            return 'mobile'
        elif 'tablet' in user_agent:
            return 'tablet'
        return 'desktop'
    
    def get_browser(self, user_agent):
        user_agent = user_agent.lower()
        if 'chrome' in user_agent:
            return 'Chrome'
        elif 'firefox' in user_agent:
            return 'Firefox'
        elif 'safari' in user_agent:
            return 'Safari'
        elif 'edge' in user_agent:
            return 'Edge'
        return 'Other'
    
    def get_os(self, user_agent):
        user_agent = user_agent.lower()
        if 'windows' in user_agent:
            return 'Windows'
        elif 'mac' in user_agent:
            return 'macOS'
        elif 'linux' in user_agent:
            return 'Linux'
        elif 'android' in user_agent:
            return 'Android'
        elif 'ios' in user_agent:
            return 'iOS'
        return 'Other'

class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        try:
            # Blacklist the refresh token
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            
            # Update session
            session_id = request.data.get('session_id')
            if session_id:
                try:
                    session = UserSession.objects.get(id=session_id, user=request.user)
                    session.logout_time = timezone.now()
                    session.is_active = False
                    session.save()
                except UserSession.DoesNotExist:
                    pass
            
            # Log logout activity
            UserActivityLog.objects.create(
                user=request.user,
                activity_type='logout',
                description='User logged out',
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            return Response({'message': 'Logged out successfully'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# USER MANAGEMENT
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrManager]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin or user.is_superuser:
            return User.objects.all()
        elif user.role == 'admin':
            return User.objects.filter(company_members__company__in=user.companies.all())
        return User.objects.filter(id=user.id)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def me(self, request):
        """Get current user profile"""
        serializer = UserDetailSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], permission_classes=[permissions.IsAuthenticated])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UpdateProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            activity_type='settings_change',
            description='Updated profile',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response(UserSerializer(request.user).data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        serializer = ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = request.user
        if not user.check_password(serializer.validated_data['old_password']):
            return Response({'old_password': 'Wrong password'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        
        # Log activity
        UserActivityLog.objects.create(
            user=user,
            activity_type='settings_change',
            description='Changed password',
            ip_address=request.META.get('REMOTE_ADDR')
        )
        
        return Response({'message': 'Password changed successfully'})
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def forgot_password(self, request):
        """Request password reset"""
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        user = serializer.context['user']
        
        # Create reset token
        reset_token = PasswordResetToken.objects.create(user=user)
        
        # Send reset email
        reset_url = f"{settings.FRONTEND_URL}/reset-password/{reset_token.token}/"
        
        subject = 'Password Reset Request'
        message = f"""
        Hello {user.get_full_name() or user.username},
        
        You requested a password reset. Click the link below to reset your password:
        
        {reset_url}
        
        This link will expire in 24 hours.
        
        If you didn't request this, please ignore this email.
        """
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
            return Response({'message': 'Password reset email sent'})
        except Exception as e:
            logger.error(f"Failed to send password reset email: {e}")
            return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.AllowAny])
    def reset_password(self, request):
        """Reset password with token"""
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        token_value = serializer.validated_data['token']
        
        try:
            reset_token = PasswordResetToken.objects.get(token=token_value, used=False)
            if not reset_token.is_valid():
                return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
            
            user = reset_token.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            reset_token.use()
            
            # Log activity
            UserActivityLog.objects.create(
                user=user,
                activity_type='settings_change',
                description='Reset password',
                ip_address=request.META.get('REMOTE_ADDR')
            )
            
            return Response({'message': 'Password reset successfully'})
        except PasswordResetToken.DoesNotExist:
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['put'], permission_classes=[CanManageUsers])
    def update_role(self, request, pk=None):
        """Update user role (admin only)"""
        user = self.get_object()
        serializer = UserRoleUpdateSerializer(data=request.data, context={'target_user': user})
        serializer.is_valid(raise_exception=True)
        
        old_role = user.role
        user.role = serializer.validated_data['role']
        user.save()
        
        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            activity_type='role_change',
            description=f"Changed user {user.email} role from {old_role} to {user.role}",
            ip_address=request.META.get('REMOTE_ADDR'),
            metadata={'old_role': old_role, 'new_role': user.role, 'target_user': user.id}
        )
        
        return Response({'message': f'Role updated to {user.role}'})
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def activate(self, request, pk=None):
        """Activate user account"""
        user = self.get_object()
        user.is_active = True
        user.save()
        
        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            activity_type='update',
            description=f"Activated user {user.email}",
            ip_address=request.META.get('REMOTE_ADDR'),
            metadata={'target_user': user.id}
        )
        
        return Response({'message': 'User activated successfully'})
    
    @action(detail=True, methods=['post'], permission_classes=[CanManageUsers])
    def deactivate(self, request, pk=None):
        """Deactivate user account"""
        user = self.get_object()
        if user == request.user:
            return Response({'error': 'Cannot deactivate your own account'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.is_active = False
        user.save()
        
        # Log activity
        UserActivityLog.objects.create(
            user=request.user,
            activity_type='update',
            description=f"Deactivated user {user.email}",
            ip_address=request.META.get('REMOTE_ADDR'),
            metadata={'target_user': user.id}
        )
        
        return Response({'message': 'User deactivated successfully'})
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def activities(self, request):
        """Get user activity log"""
        activities = UserActivityLog.objects.filter(user=request.user)[:50]
        serializer = UserActivityLogSerializer(activities, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def sessions(self, request):
        """Get user active sessions"""
        sessions = UserSession.objects.filter(user=request.user, is_active=True)
        serializer = UserSessionSerializer(sessions, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def revoke_session(self, request):
        """Revoke a specific session"""
        session_id = request.data.get('session_id')
        try:
            session = UserSession.objects.get(id=session_id, user=request.user, is_active=True)
            session.is_active = False
            session.logout_time = timezone.now()
            session.save()
            return Response({'message': 'Session revoked successfully'})
        except UserSession.DoesNotExist:
            return Response({'error': 'Session not found'}, status=status.HTTP_404_NOT_FOUND)

# MEMBERSHIP MANAGEMENT
class MembershipViewSet(viewsets.ModelViewSet):
    serializer_class = MembershipSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.is_super_admin or user.is_superuser:
            return Membership.objects.all()
        return Membership.objects.filter(user=user)
    
    @action(detail=False, methods=['post'])
    def join_company(self, request):
        """Join a company (for invitations)"""
        company_id = request.data.get('company_id')
        role = request.data.get('role', 'member')
        
        from workspaces.models import Company
        try:
            company = Company.objects.get(id=company_id)
        except Company.DoesNotExist:
            return Response({'error': 'Company not found'}, status=status.HTTP_404_NOT_FOUND)
        
        membership, created = Membership.objects.get_or_create(
            user=request.user,
            company=company,
            defaults={'role': role, 'invited_by': request.user}
        )
        
        serializer = self.get_serializer(membership)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
    
    @action(detail=False, methods=['delete'])
    def leave_company(self, request):
        """Leave a company"""
        company_id = request.query_params.get('company_id')
        
        try:
            membership = Membership.objects.get(user=request.user, company_id=company_id)
            membership.delete()
            return Response({'message': 'Left company successfully'})
        except Membership.DoesNotExist:
            return Response({'error': 'Membership not found'}, status=status.HTTP_404_NOT_FOUND)

# EMAIL VERIFICATION
class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]
    
    def get(self, request, token):
        try:
            user = User.objects.get(email_verification_token=token)
            user.verify_email()
            return Response({'message': 'Email verified successfully'})
        except User.DoesNotExist:
            return Response({'error': 'Invalid verification token'}, status=status.HTTP_400_BAD_REQUEST)

class ResendVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request):
        user = request.user
        if user.is_verified:
            return Response({'message': 'Email already verified'}, status=status.HTTP_400_BAD_REQUEST)
        
        user.generate_email_verification()
        
        # Send verification email
        verify_url = f"{settings.FRONTEND_URL}/verify-email/{user.email_verification_token}/"
        
        subject = 'Verify Your Email'
        message = f"""
        Hello {user.get_full_name() or user.username},
        
        Please verify your email by clicking the link below:
        
        {verify_url}
        
        This link will expire in 24 hours.
        """
        
        try:
            send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email])
            return Response({'message': 'Verification email sent'})
        except Exception as e:
            logger.error(f"Failed to send verification email: {e}")
            return Response({'error': 'Failed to send email'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)