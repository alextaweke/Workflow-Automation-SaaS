from rest_framework import serializers
from django.contrib.auth import authenticate, get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from django.utils import timezone
from .models import User, UserActivityLog, UserSession, Membership
import re

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    is_super_admin = serializers.BooleanField(read_only=True)
    active_companies_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'uuid', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone_number', 'avatar', 'bio', 'role', 'is_active', 'is_verified',
            'theme', 'language', 'timezone', 'last_seen', 'date_joined',
            'is_super_admin', 'active_companies_count'
        ]
        read_only_fields = ['uuid', 'last_seen', 'date_joined', 'is_verified']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_active_companies_count(self, obj):
        return obj.get_active_companies().count()
    
    def update(self, instance, validated_data):
        # Handle password separately
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)
        
        return super().update(instance, validated_data)

class UserDetailSerializer(UserSerializer):
    """Detailed user serializer with additional info"""
    notification_settings = serializers.JSONField(read_only=True)
    preferences = serializers.JSONField(read_only=True)
    
    class Meta(UserSerializer.Meta):
        fields = UserSerializer.Meta.fields + [
            'notification_settings', 'preferences', 'two_factor_enabled',
            'created_at', 'updated_at'
        ]

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    email = serializers.EmailField(validators=[EmailValidator()])
    
    class Meta:
        model = User
        fields = ['email', 'username', 'first_name', 'last_name', 'password', 'confirm_password']
    
    def validate(self, data):
        if data['password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        
        # Check if email already exists
        if User.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "A user with this email already exists"})
        
        # Username sanitization
        username = data.get('username', '')
        if not username:
            # Generate username from email
            data['username'] = data['email'].split('@')[0]
        
        if not re.match(r'^[\w.@+-]+$', data['username']):
            raise serializers.ValidationError({"username": "Username contains invalid characters"})
        
        return data
    
    def create(self, validated_data):
        validated_data.pop('confirm_password')
        user = User.objects.create_user(**validated_data)
        
        # Log registration activity
        UserActivityLog.objects.create(
            user=user,
            activity_type='create',
            description='User registered',
            ip_address=self.context.get('request').META.get('REMOTE_ADDR') if self.context.get('request') else None,
            user_agent=self.context.get('request').META.get('HTTP_USER_AGENT', '') if self.context.get('request') else ''
        )
        
        return user
class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        username = data.get("username")
        password = data.get("password")

        try:
            user_obj = User.objects.get(email=username)
            username = user_obj.username
        except User.DoesNotExist:
            pass

        user = authenticate(username=username, password=password)

        if not user:
            raise serializers.ValidationError("Invalid credentials")

        if not user.is_active:
            raise serializers.ValidationError("Account is deactivated")

        data["user"] = user
        return data
class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data

class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        try:
            user = User.objects.get(email=value)
            self.context['user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError("No user found with this email address")
        return value

class ResetPasswordSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    confirm_password = serializers.CharField(write_only=True)
    
    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match"})
        return data

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'phone_number', 'bio', 'avatar', 'theme', 'language', 'timezone']
    
    def validate_phone_number(self, value):
        if value and not re.match(r'^\+?1?\d{9,15}$', value):
            raise serializers.ValidationError("Invalid phone number format")
        return value

class UserRoleUpdateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES)
    user_id = serializers.IntegerField()
    
    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)
            self.context['target_user'] = user
        except User.DoesNotExist:
            raise serializers.ValidationError("User not found")
        return value

class MembershipSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    invited_by_details = UserSerializer(source='invited_by', read_only=True)
    
    class Meta:
        model = Membership
        fields = [
            'id', 'user', 'user_details', 'company', 'role',
            'joined_at', 'updated_at', 'invited_by', 'invited_by_details',
            'is_active', 'custom_permissions'
        ]
        read_only_fields = ['joined_at', 'updated_at']

class UserActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserActivityLog
        fields = ['id', 'activity_type', 'description', 'ip_address', 'created_at', 'metadata']
        read_only_fields = '__all__'

class UserSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSession
        fields = ['id', 'ip_address', 'device_type', 'browser', 'os', 'login_time', 'last_activity', 'is_active']
        read_only_fields = '__all__'