from django.db import models
from django.conf import settings
from django.core.validators import MinLengthValidator
from django.utils import timezone
from django.db.models import Q, Count
import uuid


class WorkspaceManager(models.Manager):
    """Custom manager for Workspace model"""

    def get_active_workspaces(self, user):
        """Get active workspaces for a user"""
        return self.filter(members=user, is_active=True)

    def get_user_owned_workspaces(self, user):
        """Get workspaces owned by user"""
        return self.filter(owner=user, is_active=True)

    def get_workspaces_with_stats(self, user):
        """Get workspaces with statistics"""
        return (
            self.filter(Q(members=user) | Q(owner=user), is_active=True)
            .annotate(
                member_count=Count("members", distinct=True),
                task_count=Count("tasks", distinct=True),
                completed_tasks=Count(
                    "tasks",
                    filter=Q(tasks__status="done"),
                    distinct=True,
                ),
            )
            .distinct()
        )


class Workspace(models.Model):
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        db_index=True,
    )

    PLAN_CHOICES = (
        ("free", "Free"),
        ("pro", "Pro"),
        ("business", "Business"),
        ("enterprise", "Enterprise"),
    )

    # Basic info
    name = models.CharField(
        max_length=255,
        validators=[
            MinLengthValidator(
                3,
                "Name must be at least 3 characters long",
            )
        ],
    )

    description = models.TextField(
        blank=True,
        help_text="Workspace description",
    )

    logo = models.ImageField(
        upload_to="workspace_logos/",
        null=True,
        blank=True,
    )

    # Relations
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_workspaces",
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="workspaces",
        blank=True,
        through="WorkspaceMembership",
        through_fields=("workspace", "user"),
    )

    # Subscription
    plan = models.CharField(
        max_length=20,
        choices=PLAN_CHOICES,
        default="free",
    )

    subscription_end_date = models.DateTimeField(
        null=True,
        blank=True,
    )

    trial_ends_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    # Config
    config = models.JSONField(
        default=dict,
        blank=True,
    )

    features = models.JSONField(
        default=dict,
        blank=True,
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_archived = models.BooleanField(default=False)

    # Audit
    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="created_workspaces",
    )

    # Managers
    objects = WorkspaceManager()
    all_objects = models.Manager()

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(fields=["owner", "is_active"]),
            models.Index(fields=["plan", "subscription_end_date"]),
            models.Index(fields=["name"]),
        ]

    def __str__(self):
        return f"{self.name} (ID: {self.id})"

    def save(self, *args, **kwargs):
        if not self.pk:
            self.set_default_features()

        super().save(*args, **kwargs)

    def set_default_features(self):
        self.features = {
            "max_members": self.get_max_members(),
            "max_projects": self.get_max_projects(),
            "max_storage_mb": self.get_max_storage(),
            "api_access": self.plan != "free",
            "advanced_reports": self.plan in ["business", "enterprise"],
            "sso_enabled": self.plan == "enterprise",
            "audit_logs": self.plan in ["business", "enterprise"],
            "custom_fields": self.plan
            in ["pro", "business", "enterprise"],
            "automations": self.plan in ["business", "enterprise"],
            "integrations": self.plan != "free",
        }

    def get_max_members(self):
        limits = {
            "free": 10,
            "pro": 50,
            "business": 200,
            "enterprise": 9999,
        }

        return limits.get(self.plan, 10)

    def get_max_projects(self):
        limits = {
            "free": 5,
            "pro": 50,
            "business": 500,
            "enterprise": 9999,
        }

        return limits.get(self.plan, 5)

    def get_max_storage(self):
        limits = {
            "free": 100,
            "pro": 1024,
            "business": 10240,
            "enterprise": 102400,
        }

        return limits.get(self.plan, 100)

    @property
    def is_subscription_active(self):
        if not self.subscription_end_date:
            return self.plan == "free"

        return timezone.now() < self.subscription_end_date

    @property
    def days_until_expiry(self):
        if self.subscription_end_date:
            delta = self.subscription_end_date - timezone.now()
            return max(0, delta.days)

        return None

    @property
    def can_add_members(self):
        member_count = self.members.count()
        return member_count < self.get_max_members()

    def add_member(self, user, role="member", invited_by=None):
        current_member_count = self.members.count()

        if current_member_count >= self.get_max_members():
            raise ValueError("Workspace member limit reached")

        membership, created = WorkspaceMembership.objects.get_or_create(
            workspace=self,
            user=user,
            defaults={
                "role": role,
                "invited_by": invited_by,
            },
        )

        return membership

    def remove_member(self, user):
        if user == self.owner:
            raise ValueError("Cannot remove workspace owner")

        self.members.remove(user)

        WorkspaceMembership.objects.filter(
            workspace=self,
            user=user,
        ).delete()

    def archive(self):
        self.is_archived = True
        self.is_active = False
        self.save()

    def restore(self):
        self.is_archived = False
        self.is_active = True
        self.save()

    def upgrade_plan(self, new_plan):
        if new_plan not in dict(self.PLAN_CHOICES):
            raise ValueError(f"Invalid plan: {new_plan}")

        self.plan = new_plan
        self.set_default_features()
        self.save()


class WorkspaceMembership(models.Model):
    ROLE_CHOICES = (
        ("owner", "Owner"),
        ("admin", "Admin"),
        ("member", "Member"),
        ("viewer", "Viewer"),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="memberships",
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="workspace_memberships",
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default="member",
    )

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="invited_members",
    )

    joined_at = models.DateTimeField(auto_now_add=True)

    last_accessed = models.DateTimeField(
        null=True,
        blank=True,
    )

    email_notifications = models.BooleanField(default=True)

    desktop_notifications = models.BooleanField(default=True)

    class Meta:
        unique_together = ["workspace", "user"]

        indexes = [
            models.Index(fields=["workspace", "role"]),
            models.Index(fields=["user", "joined_at"]),
        ]

    def __str__(self):
        return f"{self.user.username} - {self.workspace.name} ({self.role})"

    def has_permission(self, permission):
        permissions = {
            "owner": ["manage", "invite", "remove", "export", "delete"],
            "admin": ["manage", "invite", "remove", "export"],
            "member": ["create", "edit", "view"],
            "viewer": ["view"],
        }

        return permission in permissions.get(self.role, [])


class WorkspaceInvitation(models.Model):
    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("accepted", "Accepted"),
        ("expired", "Expired"),
        ("rejected", "Rejected"),
    )

    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="invitations",
    )

    email = models.EmailField()

    invited_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="sent_invitations",
    )

    role = models.CharField(
        max_length=20,
        choices=WorkspaceMembership.ROLE_CHOICES,
        default="member",
    )

    token = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    expires_at = models.DateTimeField()

    accepted_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    class Meta:
        indexes = [
            models.Index(fields=["token", "status"]),
            models.Index(fields=["email", "workspace"]),
            models.Index(fields=["expires_at"]),
        ]

    def save(self, *args, **kwargs):
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)

        super().save(*args, **kwargs)

    def is_expired(self):
        return timezone.now() > self.expires_at

    def accept(self, user):
        if self.is_expired():
            self.status = "expired"
            self.save()

            raise ValueError("Invitation has expired")

        workspace = self.workspace

        workspace.add_member(
            user,
            role=self.role,
            invited_by=self.invited_by,
        )

        self.status = "accepted"
        self.accepted_at = timezone.now()
        self.save()

    def reject(self):
        self.status = "rejected"
        self.save()


class CompanyManager(models.Manager):
    def get_active_companies(self, user):
        return self.filter(
            Q(owner=user) | Q(departments__members=user),
            is_active=True,
        ).distinct()

    def get_companies_with_stats(self, user):
        return self.filter(owner=user).annotate(
            department_count=Count("departments", distinct=True),
            member_count=Count(
                "departments__members",
                distinct=True,
            ),
        )


class Company(models.Model):
    COMPANY_TYPE_CHOICES = (
        ("corporation", "Corporation"),
        ("llc", "LLC"),
        ("partnership", "Partnership"),
        ("sole_proprietorship", "Sole Proprietorship"),
        ("nonprofit", "Non-Profit"),
        ("government", "Government"),
    )

    INDUSTRY_CHOICES = (
        ("technology", "Technology"),
        ("healthcare", "Healthcare"),
        ("finance", "Finance"),
        ("education", "Education"),
        ("retail", "Retail"),
        ("manufacturing", "Manufacturing"),
        ("services", "Services"),
        ("other", "Other"),
    )
    workspace = models.ForeignKey(
        'Workspace',
        on_delete=models.CASCADE,
        related_name='companies',
        null=True,
        blank=True,
        help_text="The workspace this company belongs to"
    )
    uuid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        db_index=True,
    )

    name = models.CharField(
        max_length=255,
        validators=[
            MinLengthValidator(
                2,
                "Company name must be at least 2 characters",
            )
        ],
    )

    legal_name = models.CharField(
        max_length=255,
        blank=True,
    )

    description = models.TextField(blank=True)

    company_type = models.CharField(
        max_length=30,
        choices=COMPANY_TYPE_CHOICES,
        default="corporation",
    )

    industry = models.CharField(
        max_length=30,
        choices=INDUSTRY_CHOICES,
        default="technology",
    )

    email = models.EmailField(blank=True)

    phone = models.CharField(
        max_length=20,
        blank=True,
    )

    website = models.URLField(blank=True)

    address_line1 = models.CharField(
        max_length=255,
        blank=True,
    )

    address_line2 = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
        blank=True,
    )

    state = models.CharField(
        max_length=100,
        blank=True,
    )

    postal_code = models.CharField(
        max_length=20,
        blank=True,
    )

    country = models.CharField(
        max_length=100,
        blank=True,
    )

    tax_id = models.CharField(
        max_length=50,
        blank=True,
    )

    registration_number = models.CharField(
        max_length=50,
        blank=True,
    )

    logo = models.ImageField(
        upload_to="company_logos/",
        null=True,
        blank=True,
    )

    primary_color = models.CharField(
        max_length=7,
        default="#3B82F6",
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="owned_companies",
    )

    config = models.JSONField(
        default=dict,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_verified = models.BooleanField(default=False)

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    updated_at = models.DateTimeField(auto_now=True)

    verified_at = models.DateTimeField(
        null=True,
        blank=True,
    )

    objects = CompanyManager()

    class Meta:
        verbose_name = "Company"
        verbose_name_plural = "Companies"

        ordering = ["name"]

    def __str__(self):
        return f"{self.name} (ID: {self.id})"

    def save(self, *args, **kwargs):
        if not self.legal_name:
            self.legal_name = self.name

        super().save(*args, **kwargs)

    @property
    def full_address(self):
        parts = [
            self.address_line1,
            self.address_line2,
            (
                f"{self.city}, {self.state} {self.postal_code}"
                if self.city
                else ""
            ),
            self.country,
        ]

        return ", ".join([p for p in parts if p])


class Department(models.Model):
    company = models.ForeignKey(
        Company,
        on_delete=models.CASCADE,
        related_name="departments",
    )

    name = models.CharField(max_length=100)

    description = models.TextField(blank=True)

    manager = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="managed_departments",
    )

    members = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="departments",
        blank=True,
    )

    parent_department = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="subdepartments",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ["company", "name"]
        ordering = ["name"]

    def __str__(self):
        return f"{self.company.name} - {self.name}"

    @property
    def full_path(self):
        if self.parent_department:
            return f"{self.parent_department.full_path} > {self.name}"

        return self.name