from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Task
from .serializers import TaskSerializer

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Task.objects.filter(workspace__members=self.request.user)

        workspace = self.request.query_params.get("workspace")
        if workspace:
            qs = qs.filter(workspace_id=workspace)

        return qs.order_by("-created_at")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False)
    def my_tasks(self, request):
        tasks = self.get_queryset().filter(assignee=request.user)
        return Response(self.get_serializer(tasks, many=True).data)

    @action(detail=False)
    def todo(self, request):
        tasks = self.get_queryset().filter(status="todo")
        return Response(self.get_serializer(tasks, many=True).data)