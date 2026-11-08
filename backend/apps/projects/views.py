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
            qs = Project.objects.all().select_related('client', 'created_by')
        elif user.role == 'EMPLOYEE':
            qs = Project.objects.filter(
                assigned_employees=user
            ).select_related('client', 'created_by')
        elif user.role == 'CLIENT':
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                qs = Project.objects.filter(
                    client=client
                ).select_related('client', 'created_by')
            else:
                return Project.objects.none()
        else:
            return Project.objects.none()

        # Safely extract query parameters (DRF request or Django WSGIRequest)
        req_params = getattr(self.request, 'query_params', getattr(self.request, 'GET', {}))

        # Filter by status query param
        status_param = req_params.get('status')
        if status_param and status_param != 'All':
            if status_param in ('IN_PROGRESS', 'ACTIVE'):
                qs = qs.filter(status__in=['IN_PROGRESS', 'ACTIVE'])
            else:
                qs = qs.filter(status=status_param)

        # Filter by client query param
        client_param = req_params.get('client')
        if client_param:
            qs = qs.filter(client_id=client_param)

        return qs

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
