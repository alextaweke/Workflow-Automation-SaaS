from .models import Workspace

def create_workspace(user, validated_data):
    workspace = Workspace.objects.create(owner=user, **validated_data)
    workspace.members.add(user)
    return workspace