
from rest_framework import serializers
from django.conf import settings
from django.utils import timezone

from accounts.models import User
from workspaces.models import Company, Department, Workspace
from .models import Task

class UserBasicSerializer(serializers.ModelSerializer):
    """Simplified user serializer for nested relationships"""
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


class CompanyBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Company
        fields = ['id', 'name', 'legal_name']

class DepartmentBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = ['id', 'name', 'full_path']
class WorkspaceBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Workspace
        fields = ['id', 'name', 'plan']

class TaskSerializer(serializers.ModelSerializer):
    # Read-only computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    completion_percentage = serializers.IntegerField(read_only=True)
    time_variance = serializers.FloatField(read_only=True)
    
    # Nested relationships
    assigned_to_details = UserBasicSerializer(source='assigned_to', read_only=True)
    created_by_details = UserBasicSerializer(source='created_by', read_only=True)
    collaborators_details = UserBasicSerializer(source='collaborators', many=True, read_only=True)
    
    # Subtasks (limited to avoid recursion)
    subtasks = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    parent_task_details = serializers.PrimaryKeyRelatedField(source='parent_task', read_only=True)
    
    # URL field for HATEOAS
    absolute_url = serializers.SerializerMethodField()
    # Company and Department details for context
    company_details = CompanyBasicSerializer(source='company', read_only=True)
    department_details = DepartmentBasicSerializer(source='department', read_only=True)
    workspace_details = WorkspaceBasicSerializer(
    source='workspace',
    read_only=True
    )
    class Meta:
        model = Task
        fields = [
            'id', 'uuid', 'title', 'description', 'workspace', 'workspace_details',
            'company', 'company_details',  # Add these
            'department', 'department_details',  # Add these
            'parent_task', 'parent_task_details', 'subtasks',
            'assigned_to', 'assigned_to_details', 'created_by', 'created_by_details',
            'collaborators', 'collaborators_details',
            'status', 'priority', 'tags',
            'due_date', 'start_date', 'completed_at',
            'estimated_hours', 'actual_hours', 'time_variance',
            'created_at', 'updated_at',
            'is_overdue', 'completion_percentage',
            'absolute_url'
        ]
        read_only_fields = ['created_by', 'created_at', 'updated_at', 'completed_at', 'uuid']
        
    def get_absolute_url(self, obj):
        request = self.context.get('request')
        if request:
            return request.build_absolute_uri(f'/api/tasks/{obj.id}/')
        return None
    
    def validate_due_date(self, value):
        """Ensure due date is not in the past for new tasks"""
        if value and value < timezone.now():
            raise serializers.ValidationError("Due date cannot be in the past")
        return value
    
    def validate_estimated_hours(self, value):
        if value and value < 0:
            raise serializers.ValidationError("Estimated hours cannot be negative")
        if value and value > 1000:
            raise serializers.ValidationError("Estimated hours cannot exceed 1000")
        return value
    
    def validate_tags(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError("Tags must be a list")
        if len(value) > 20:
            raise serializers.ValidationError("Maximum 20 tags allowed")
        return value
    
    def create(self, validated_data):
        # Auto-set created_by from context
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Track who made the update
        request = self.context.get('request')
        if request and request.user:
            validated_data['last_modified_by'] = request.user
        
        # Handle status change to done
        if validated_data.get('status') == 'done' and instance.status != 'done':
            validated_data['completed_at'] = timezone.now()
        
        return super().update(instance, validated_data)

class TaskDetailSerializer(TaskSerializer):
    """Extended serializer for detail views with more information"""
    class Meta(TaskSerializer.Meta):
        fields = TaskSerializer.Meta.fields + [
            'is_deleted', 'deleted_at', 'last_modified_by'
        ]

class TaskCreateSerializer(serializers.ModelSerializer):
    """Specialized serializer for task creation"""
    class Meta:
        model = Task
        fields = [
            'title', 'description', 'workspace', 
            'company', 'department',  # Add these
            'parent_task',
            'assigned_to', 'collaborators', 'status', 'priority',
            'due_date', 'start_date', 'estimated_hours', 'tags'
        ]
    
    def create(self, validated_data):
        request = self.context.get('request')
        validated_data['created_by'] = request.user
        
        # Validate that department belongs to company
        if validated_data.get('department') and validated_data.get('company'):
            department = validated_data['department']
            if department.company_id != validated_data['company'].id:
                raise serializers.ValidationError(
                    "Department must belong to the selected company"
                )
        
        return super().create(validated_data)

class TaskBulkUpdateSerializer(serializers.Serializer):
    """Serializer for bulk operations"""
    task_ids = serializers.ListField(child=serializers.IntegerField())
    updates = serializers.DictField()
    
    def validate_task_ids(self, value):
        if not value:
            raise serializers.ValidationError("task_ids cannot be empty")
        if len(value) > 100:
            raise serializers.ValidationError("Maximum 100 tasks per bulk operation")
        return value
    
    def validate_updates(self, value):
        allowed_fields = ['status', 'priority', 'assigned_to', 'due_date', 'tags']
        for field in value.keys():
            if field not in allowed_fields:
                raise serializers.ValidationError(f"Field '{field}' cannot be updated in bulk")
        return value

class TaskFilterSerializer(serializers.Serializer):
    """Serializer for task filtering parameters"""
    status = serializers.ListField(child=serializers.CharField(), required=False)
    priority = serializers.ListField(child=serializers.CharField(), required=False)
    assigned_to = serializers.IntegerField(required=False)
    workspace = serializers.IntegerField(required=False)
    due_before = serializers.DateTimeField(required=False)
    due_after = serializers.DateTimeField(required=False)
    created_after = serializers.DateTimeField(required=False)
    search = serializers.CharField(required=False, max_length=100)
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    is_overdue = serializers.BooleanField(required=False)
