from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import Workspace, Task

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'email', 'username', 'first_name', 'last_name']

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'username', 'password']
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user

class WorkspaceSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)
    members = UserSerializer(many=True, read_only=True)
    
    class Meta:
        model = Workspace
        fields = '__all__'

class TaskSerializer(serializers.ModelSerializer):
    assignee = UserSerializer(read_only=True)
    workspace = WorkspaceSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    
    class Meta:
        model = Task
        fields = '__all__'
        read_only_fields = ['created_by']