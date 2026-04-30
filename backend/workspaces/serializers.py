from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.conf import settings
from django.utils import timezone

from .models import (
    Workspace,
    WorkspaceMembership,
    WorkspaceInvitation,
    Company,
    Department,
)

User = get_user_model()


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
        ]


class WorkspaceMembershipSerializer(serializers.ModelSerializer):
    user_details = UserBasicSerializer(
        source="user",
        read_only=True,
    )

    invited_by_details = UserBasicSerializer(
        source="invited_by",
        read_only=True,
    )

    class Meta:
        model = WorkspaceMembership

        fields = [
            "id",
            "workspace",
            "user",
            "user_details",
            "role",
            "invited_by",
            "invited_by_details",
            "joined_at",
            "last_accessed",
            "email_notifications",
            "desktop_notifications",
        ]

        read_only_fields = [
            "joined_at",
            "invited_by",
        ]


class WorkspaceSerializer(serializers.ModelSerializer):
    member_count = serializers.IntegerField(read_only=True)
    task_count = serializers.IntegerField(read_only=True)
    completed_tasks = serializers.IntegerField(read_only=True)

    is_subscription_active = serializers.BooleanField(
        read_only=True
    )

    days_until_expiry = serializers.IntegerField(
        read_only=True
    )

    can_add_members = serializers.BooleanField(
        read_only=True
    )

    owner_details = UserBasicSerializer(
        source="owner",
        read_only=True,
    )

    memberships = WorkspaceMembershipSerializer(
        many=True,
        read_only=True,
    )

    absolute_url = serializers.SerializerMethodField()

    class Meta:
        model = Workspace

        fields = [
            "id",
            "uuid",
            "name",
            "description",
            "logo",

            "owner",
            "owner_details",

            "members",
            "memberships",

            "plan",
            "subscription_end_date",
            "trial_ends_at",

            "config",
            "features",

            "is_active",
            "is_archived",

            "created_at",
            "updated_at",
            "created_by",

            "member_count",
            "task_count",
            "completed_tasks",

            "is_subscription_active",
            "days_until_expiry",
            "can_add_members",

            "absolute_url",
        ]

        read_only_fields = [
            "uuid",
            "created_at",
            "updated_at",
            "member_count",
            "task_count",
            "completed_tasks",
            "is_subscription_active",
            "days_until_expiry",
            "features",
        ]

    def get_absolute_url(self, obj):
        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(
                f"/api/workspaces/{obj.id}/"
            )

        return None

    def validate_name(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Workspace name must be at least 3 characters"
            )

        return value

    def validate_plan(self, value):
        request = self.context.get("request")

        if request and request.method == "PATCH":
            instance = self.instance

            if instance and request.user != instance.owner:
                raise serializers.ValidationError(
                    "Only workspace owner can change plan"
                )

        return value

    def create(self, validated_data):
        request = self.context.get("request")

        workspace = Workspace.objects.create(
            owner=request.user,
            created_by=request.user,
            **validated_data,
        )

        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=request.user,
            role="owner",
            invited_by=request.user,
        )

        return workspace

    def update(self, instance, validated_data):
        old_plan = instance.plan

        instance = super().update(
            instance,
            validated_data,
        )

        new_plan = validated_data.get("plan")

        if new_plan and old_plan != new_plan:
            instance.set_default_features()
            instance.save()

        return instance


class WorkspaceCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace

        fields = [
            "name",
            "description",
            "plan",
        ]

    def create(self, validated_data):
        request = self.context.get("request")

        workspace = Workspace.objects.create(
            owner=request.user,
            created_by=request.user,
            **validated_data,
        )

        WorkspaceMembership.objects.create(
            workspace=workspace,
            user=request.user,
            role="owner",
            invited_by=request.user,
        )

        return workspace


class WorkspaceInvitationSerializer(serializers.ModelSerializer):
    invited_by_details = UserBasicSerializer(
        source="invited_by",
        read_only=True,
    )

    class Meta:
        model = WorkspaceInvitation

        fields = [
            "id",
            "workspace",
            "email",
            "invited_by",
            "invited_by_details",
            "role",
            "token",
            "status",
            "created_at",
            "expires_at",
            "accepted_at",
        ]

        read_only_fields = [
            "token",
            "status",
            "created_at",
            "expires_at",
        ]

    def validate_email(self, value):
        workspace = self.context.get("workspace")

        if workspace and workspace.members.filter(
            email=value
        ).exists():
            raise serializers.ValidationError(
                "User is already a member of this workspace"
            )

        if WorkspaceInvitation.objects.filter(
            workspace=workspace,
            email=value,
            status="pending",
        ).exists():
            raise serializers.ValidationError(
                "Invitation already sent to this email"
            )

        return value

    def create(self, validated_data):
        workspace = self.context.get("workspace")
        request = self.context.get("request")

        invitation = WorkspaceInvitation.objects.create(
            workspace=workspace,
            invited_by=request.user,
            **validated_data,
        )

        return invitation


class WorkspaceMemberAddSerializer(serializers.Serializer):
    user_id = serializers.IntegerField()

    role = serializers.ChoiceField(
        choices=WorkspaceMembership.ROLE_CHOICES,
        default="member",
    )

    def validate_user_id(self, value):
        try:
            user = User.objects.get(id=value)

        except User.DoesNotExist:
            raise serializers.ValidationError(
                "User does not exist"
            )

        workspace = self.context.get("workspace")

        if workspace.members.filter(id=value).exists():
            raise serializers.ValidationError(
                "User is already a member"
            )

        return value


class WorkspaceSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace

        fields = [
            "config",
            "features",
        ]

    def update(self, instance, validated_data):
        if "config" in validated_data:
            current_config = instance.config or {}

            current_config.update(
                validated_data["config"]
            )

            validated_data["config"] = current_config

        return super().update(
            instance,
            validated_data,
        )


class CompanySerializer(serializers.ModelSerializer):
    department_count = serializers.IntegerField(
        read_only=True
    )

    member_count = serializers.IntegerField(
        read_only=True
    )

    full_address = serializers.CharField(
        read_only=True
    )

    owner_details = serializers.SerializerMethodField()

    class Meta:
        model = Company

        fields = [
            "id",
            "uuid",

            "name",
            "legal_name",
            "description",

            "company_type",
            "industry",

            "email",
            "phone",
            "website",

            "address_line1",
            "address_line2",
            "city",
            "state",
            "postal_code",
            "country",

            "full_address",

            "tax_id",
            "registration_number",

            "logo",
            "primary_color",

            "owner",
            "owner_details",

            "config",

            "is_active",
            "is_verified",

            "created_at",
            "updated_at",
            "verified_at",

            "department_count",
            "member_count",
        ]

        read_only_fields = [
            "uuid",
            "created_at",
            "updated_at",
            "verified_at",
            "is_verified",
        ]

    def get_owner_details(self, obj):
        return {
            "id": obj.owner.id,
            "username": obj.owner.username,
            "email": obj.owner.email,
        }

    def validate(self, data):
        if data.get("is_verified") and not self.instance:
            raise serializers.ValidationError(
                "Cannot set verified on creation"
            )

        return data

    def create(self, validated_data):
        request = self.context.get("request")

        validated_data["owner"] = request.user

        return super().create(validated_data)


class DepartmentSerializer(serializers.ModelSerializer):
    member_count = serializers.SerializerMethodField()

    full_path = serializers.CharField(
        read_only=True
    )

    manager_details = serializers.SerializerMethodField()

    class Meta:
        model = Department

        fields = [
            "id",
            "company",

            "name",
            "description",

            "manager",
            "manager_details",

            "members",

            "parent_department",

            "member_count",
            "full_path",

            "created_at",
            "updated_at",
        ]

    def get_member_count(self, obj):
        return obj.members.count()

    def get_manager_details(self, obj):
        if obj.manager:
            return {
                "id": obj.manager.id,
                "username": obj.manager.username,
                "email": obj.manager.email,
            }

        return None