# ===== FILE EXPLANATION =====
# API views for the projects app.
# Handles CRUD for projects with role-based data filtering:
#   - Admins see ALL projects
#   - Employees see only projects they're assigned to
#   - Clients see only projects belonging to their client profile

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from apps.projects.models import Project
from apps.projects.serializers import ProjectSerializer, ProjectListSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class ProjectViewSet(viewsets.ModelViewSet):
    """
    ViewSet that handles all CRUD operations for projects.

    Data visibility rules:
    - Admin: sees all projects
    - Employee: sees only projects they are assigned to
    - Client: sees only projects belonging to their linked client account

    Endpoints (all prefixed with /api/projects/):
        GET    /            → list projects (filtered by role)
        POST   /            → create project (admin only)
        GET    /<id>/       → get a single project
        PUT    /<id>/       → update (admin only)
        PATCH  /<id>/       → partial update (admin only)
        DELETE /<id>/       → delete (admin only)
    """

    permission_classes = [IsAuthenticated]

    # Allow search and ordering via query parameters
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'client__company_name']
    ordering_fields = ['created_at', 'status', 'start_date']

    def get_queryset(self):
        """
        Return projects based on the requesting user's role.
        This is the key method that enforces data visibility.
        """
        user = self.request.user

        if user.role == 'ADMIN':
            # Admins can see all projects
            return Project.objects.all().select_related('client', 'created_by')

        elif user.role == 'EMPLOYEE':
            # Employees only see projects they're assigned to
            return Project.objects.filter(
                assigned_employees=user
            ).select_related('client', 'created_by')

        elif user.role == 'CLIENT':
            # Clients only see projects belonging to their client profile
            # First check if this user has an associated client profile
            if hasattr(user, 'client_profile') and user.client_profile:
                return Project.objects.filter(
                    client=user.client_profile
                ).select_related('client', 'created_by')

        # Fallback: return nothing if no matching role or missing client profile
        return Project.objects.none()

    def get_serializer_class(self):
        """Use the light serializer for lists, full one for everything else."""
        if self.action == 'list':
            return ProjectListSerializer
        return ProjectSerializer

    def get_permissions(self):
        """
        Apply stricter permissions for write operations.
        - Only Admins can create, update, or delete projects.
        - All authenticated users can read (filtered by role).
        """
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Automatically set the 'created_by' field to the currently logged-in user
        when a new project is created.
        """
        serializer.save(created_by=self.request.user)
