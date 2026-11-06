# ===== FILE EXPLANATION =====
# API views for the milestones app.
# Provides CRUD for Milestones and Tasks.
# Employees can mark milestones/tasks as done; Admins can do everything.

from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from apps.milestones.models import Milestone, Task
from apps.milestones.serializers import MilestoneSerializer, TaskSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class MilestoneViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Milestone CRUD.
    Filters milestones based on the user's role and project assignments.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = MilestoneSerializer

    def get_queryset(self):
        """
        Return milestones the user has access to, based on their role.
        """
        user = self.request.user

        if user.role == 'ADMIN':
            # Admins see all milestones
            return Milestone.objects.all().select_related('project')

        elif user.role == 'EMPLOYEE':
            # Employees see milestones for their assigned projects
            return Milestone.objects.filter(
                project__assigned_employees=user
            ).select_related('project')

        elif user.role == 'CLIENT':
            # Clients see milestones for their client's projects
            if hasattr(user, 'client_profile') and user.client_profile:
                return Milestone.objects.filter(
                    project__client=user.client_profile
                ).select_related('project')

        return Milestone.objects.none()

    def get_permissions(self):
        """
        Admins can do everything.
        Employees and Clients can read; only Admins can write.
        """
        if self.action in ('create', 'destroy'):
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ('update', 'partial_update'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]


class TaskViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Task CRUD.
    Tasks are small to-do items inside milestones.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TaskSerializer

    def get_queryset(self):
        """Return tasks accessible to the user based on their role."""
        user = self.request.user

        if user.role == 'ADMIN':
            return Task.objects.all().select_related('milestone', 'assigned_to')

        elif user.role == 'EMPLOYEE':
            # Tasks in projects the employee is assigned to
            return Task.objects.filter(
                milestone__project__assigned_employees=user
            ).select_related('milestone', 'assigned_to')

        elif user.role == 'CLIENT':
            if hasattr(user, 'client_profile') and user.client_profile:
                return Task.objects.filter(
                    milestone__project__client=user.client_profile
                ).select_related('milestone', 'assigned_to')

        return Task.objects.none()

    def get_permissions(self):
        """Admins and Employees can create/update tasks; Clients are read-only."""
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdmin()]
        if self.action in ('create', 'update', 'partial_update'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]
