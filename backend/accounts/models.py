from django.contrib.auth.models import AbstractUser, Group, Permission
from django.db import models
from django.core.validators import RegexValidator, MinLengthValidator
from django.utils import timezone
from workspaces.models import Company
import uuid

class User(AbstractUser):
    # UUID for API exposure
    uuid = models.UUIDField(default=uuid.uuid4, editable=False, unique=True, db_index=True)
    
    # Enhanced role choices with permissions mapping
    ROLE_CHOICES = (
        ('super_admin', 'Super Admin'),
        ('admin', 'Admin'),
        ('manager', 'Manager'),
        ('member', 'Member'),
        ('viewer', 'Viewer'),
    )
    
    ROLE_PERMISSIONS = {
        'super_admin': ['*'],  # All permissions
        'admin': ['manage_users', 'manage_workspaces', 'view_reports', 'manage_settings'],
        'manager': ['manage_team', 'assign_tasks', 'view_reports', 'create_projects'],
        'member': ['create_tasks', 'edit_own_tasks', 'view_projects'],
        'viewer': ['view_projects', 'view_tasks'],
    }
    
    # Basic info with validation
    email = models.EmailField(unique=True, db_index=True)
    phone_number = models.CharField(
        max_length=15,
        blank=True,
        validators=[RegexValidator(regex=r'^\+?1?\d{9,15}$', message="Phone number must be in international format")]
    )
    
    # Profile fields
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    
    # Role and permissions
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='member', db_index=True)
    custom_permissions = models.JSONField(default=list, blank=True, help_text="Custom permissions beyond role")
    
    # Account status
    is_active = models.BooleanField(default=True, db_index=True)
    is_verified = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    locked_until = models.DateTimeField(null=True, blank=True)
    
    # Security fields
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    last_login_agent = models.TextField(blank=True)
    failed_login_attempts = models.IntegerField(default=0)
    email_verification_token = models.UUIDField(null=True, blank=True)
    password_reset_token = models.UUIDField(null=True, blank=True)
    password_reset_expires = models.DateTimeField(null=True, blank=True)
    
    # Two-factor authentication
    two_factor_enabled = models.BooleanField(default=False)
    two_factor_secret = models.CharField(max_length=32, blank=True)
    backup_codes = models.JSONField(default=list, blank=True)
    
    # Preferences
    preferences = models.JSONField(default=dict, blank=True, help_text="User preferences")
    notification_settings = models.JSONField(default=dict, blank=True)
    theme = models.CharField(max_length=20, default='light', choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System')
    ])
    language = models.CharField(max_length=10, default='en', choices=[
        ('en', 'English'),
        ('es', 'Spanish'),
        ('fr', 'French'),
        ('de', 'German'),
        ('zh', 'Chinese'),
    ])
    timezone = models.CharField(max_length=50, default='UTC')
    
    # Audit fields
    last_seen = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)
    
    # Override groups and user_permissions to avoid related_name clashes
    groups = models.ManyToManyField(
        Group,
        verbose_name='groups',
        blank=True,
        help_text='The groups this user belongs to.',
        related_name="custom_user_set",
        related_query_name="user",
    )
    user_permissions = models.ManyToManyField(
        Permission,
        verbose_name='user permissions',
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="custom_user_set",
        related_query_name="user",
    )

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'first_name', 'last_name']
    
    class Meta:
        ordering = ['-date_joined']
        indexes = [
            models.Index(fields=['email', 'is_active']),
            models.Index(fields=['role', 'is_active']),
            models.Index(fields=['last_seen']),
            models.Index(fields=['uuid']),
        ]
        permissions = [
            ("can_impersonate_users", "Can impersonate other users"),
            ("can_view_all_users", "Can view all users"),
            ("can_manage_roles", "Can manage user roles"),
            ("can_export_users", "Can export user data"),
        ]
    
    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.email})"
    
    def save(self, *args, **kwargs):
        # Auto-set email verification token for new users
        if not self.pk:
            self.email_verification_token = uuid.uuid4()
        
        # Handle username generation if not provided
        if not self.username and self.email:
            self.username = self.email.split('@')[0]
        
        # Ensure unique username
        if User.objects.filter(username=self.username).exclude(pk=self.pk).exists():
            base_username = self.username
            counter = 1
            while User.objects.filter(username=f"{base_username}{counter}").exists():
                counter += 1
            self.username = f"{base_username}{counter}"
        
        super().save(*args, **kwargs)
    
    def get_full_name(self):
        """Return the full name of the user."""
        if self.first_name and self.last_name:
            return f"{self.first_name} {self.last_name}"
        return self.first_name or self.last_name or self.username
    
    def get_short_name(self):
        """Return the short name for the user."""
        return self.first_name or self.username
    
    @property
    def is_super_admin(self):
        return self.role == 'super_admin' or self.is_superuser
    
    @property
    def is_account_locked(self):
        """Check if account is locked"""
        if not self.is_locked:
            return False
        if self.locked_until and timezone.now() > self.locked_until:
            self.is_locked = False
            self.locked_until = None
            self.save(update_fields=['is_locked', 'locked_until'])
            return False
        return True
    
    def has_permission(self, permission):
        """Check if user has specific permission"""
        if self.is_super_admin or self.is_superuser:
            return True
        
        # Check role-based permissions
        role_perms = self.ROLE_PERMISSIONS.get(self.role, [])
        if permission in role_perms or '*' in role_perms:
            return True
        
        # Check custom permissions
        if permission in self.custom_permissions:
            return True
        
        # Check Django permissions
        return self.has_perm(permission)
    
    def increment_failed_logins(self):
        """Increment failed login attempts and lock if needed"""
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.is_locked = True
            self.locked_until = timezone.now() + timezone.timedelta(minutes=30)
        self.save(update_fields=['failed_login_attempts', 'is_locked', 'locked_until'])
    
    def reset_failed_logins(self):
        """Reset failed login attempts"""
        self.failed_login_attempts = 0
        self.save(update_fields=['failed_login_attempts'])
    
    def generate_email_verification(self):
        """Generate new email verification token"""
        self.email_verification_token = uuid.uuid4()
        self.save(update_fields=['email_verification_token'])
    
    def verify_email(self):
        """Mark email as verified"""
        self.is_verified = True
        self.email_verification_token = None
        self.save(update_fields=['is_verified', 'email_verification_token'])
    
    def soft_delete(self):
        """Soft delete user account"""
        self.is_active = False
        self.is_deleted = True
        self.deleted_at = timezone.now()
        self.save(update_fields=['is_active', 'is_deleted', 'deleted_at'])
    
    def restore(self):
        """Restore soft-deleted account"""
        self.is_active = True
        self.is_deleted = False
        self.deleted_at = None
        self.save(update_fields=['is_active', 'is_deleted', 'deleted_at'])
    
    def update_last_seen(self):
        """Update last seen timestamp"""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])
    
    def get_active_companies(self):
        """Get companies where user is an active member"""
        from workspaces.models import Company
        return Company.objects.filter(
            members__user=self,
            members__is_active=True
        ).select_related('owner')
    
    def get_notification_preferences(self):
        """Get user notification preferences"""
        default_prefs = {
            'email_notifications': True,
            'task_assigned': True,
            'task_completed': True,
            'mention_notifications': True,
            'workspace_invites': True,
            'daily_digest': False,
            'weekly_report': True,
        }
        return {**default_prefs, **self.notification_settings}

class UserActivityLog(models.Model):
    """Track user activities for audit"""
    
    ACTIVITY_TYPES = (
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('export', 'Export'),
        ('settings_change', 'Settings Change'),
        ('role_change', 'Role Change'),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="activities")
    activity_type = models.CharField(max_length=20, choices=ACTIVITY_TYPES)
    description = models.TextField()
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'created_at']),
            models.Index(fields=['activity_type', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.activity_type} at {self.created_at}"

class UserSession(models.Model):
    """Track user sessions"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_key = models.CharField(max_length=255, unique=False, null=True, blank=True)
    ip_address = models.GenericIPAddressField()
    user_agent = models.TextField()
    device_type = models.CharField(max_length=20, blank=True)
    browser = models.CharField(max_length=50, blank=True)
    os = models.CharField(max_length=50, blank=True)
    login_time = models.DateTimeField(auto_now_add=True)
    last_activity = models.DateTimeField(auto_now=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-login_time']
        indexes = [
            models.Index(fields=['session_key', 'is_active']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.session_key[:10]}..."

class Membership(models.Model):
    """Enhanced membership model with company roles"""
    
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("manager", "Manager"),
        ("member", "Member"),
        ("viewer", "Viewer"),
    )
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="memberships")
    company = models.ForeignKey(Company, on_delete=models.CASCADE, related_name="members", null=True, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="member", db_index=True)
    
    # Additional fields
    joined_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    invited_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name="invited_memberships")
    is_active = models.BooleanField(default=True)
    
    # Department assignment
    #departments = models.ManyToManyField('workspaces.Department', blank=True, related_name="members")
    
    # Access level
    custom_permissions = models.JSONField(default=list, blank=True)
    
    class Meta:
        unique_together = ("user", "company")
        indexes = [
            models.Index(fields=['company', 'role']),
            models.Index(fields=['user', 'is_active']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.company} ({self.role})"
    
    def has_company_permission(self, permission):
        """Check if user has specific permission in this company context"""
        role_perms = {
            'owner': ['*'],
            'admin': ['manage_members', 'manage_projects', 'view_reports', 'edit_settings'],
            'manager': ['manage_team', 'assign_tasks', 'view_reports'],
            'member': ['create_tasks', 'edit_own'],
            'viewer': ['view_only'],
        }
        
        perms = role_perms.get(self.role, [])
        return permission in perms or '*' in perms or permission in self.custom_permissions

class PasswordResetToken(models.Model):
    """Model for tracking password reset tokens"""
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_resets")
    token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    used = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(hours=24)
        super().save(*args, **kwargs)
    
    def is_valid(self):
        """Check if token is still valid"""
        return not self.used and timezone.now() < self.expires_at
    
    def use(self):
        """Mark token as used"""
        self.used = True
        self.save()