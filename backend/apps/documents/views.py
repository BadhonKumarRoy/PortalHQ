# ===== FILE EXPLANATION =====
# API views for the documents app.
# Handles file uploads, 1-click sharing toggles, and document management with role-based access.
# Clients see documents linked to their company/projects where is_shared_with_client=True.

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q

from apps.documents.models import Document
from apps.documents.serializers import DocumentSerializer, DocumentListSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document CRUD, file upload, and portal sharing.

    Data visibility:
    - Admins: see all documents
    - Employees: see all documents (assigned / project deliverables)
    - Clients: see documents where is_shared_with_client=True that belong
               to their company or their company's projects (or global client docs)
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'category', 'project__title', 'client__company_name']
    ordering_fields = ['created_at', 'title', 'category']

    def get_queryset(self):
        """Filter documents based on the user's role."""
        user = self.request.user

        if user.role == 'ADMIN':
            # Admins see everything
            return Document.objects.all().select_related('project', 'client', 'uploaded_by')

        elif user.role == 'EMPLOYEE':
            # Employees see all documents to collaborate on deliverables
            return Document.objects.all().select_related('project', 'client', 'uploaded_by')

        elif user.role == 'CLIENT':
            # Clients see documents shared with them (directly or via project or global)
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                return Document.objects.filter(
                    Q(client=client) | Q(project__client=client) | Q(client__isnull=True, project__isnull=True),
                    is_shared_with_client=True  # Must be explicitly shared
                ).select_related('project', 'client', 'uploaded_by').distinct()

        return Document.objects.none()

    def get_serializer_class(self):
        """Use lightweight serializer for lists, full serializer for detail/create."""
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def get_permissions(self):
        """Only Admin/Employee can upload, edit, toggle share, or delete documents."""
        if self.action in ('create', 'update', 'partial_update', 'destroy', 'toggle_share'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """
        Automatically set the uploader to the current user.
        If project is selected but client is not explicitly set, inherit project's client.
        """
        project = serializer.validated_data.get('project')
        client = serializer.validated_data.get('client')

        if not client and project and project.client:
            serializer.save(uploaded_by=self.request.user, client=project.client)
        else:
            serializer.save(uploaded_by=self.request.user)

    def perform_update(self, serializer):
        """Ensure client is populated from project on update if project is set."""
        project = serializer.validated_data.get('project')
        client = serializer.validated_data.get('client')

        if not client and project and project.client:
            serializer.save(client=project.client)
        else:
            serializer.save()

    @action(detail=True, methods=['post', 'patch'], url_path='toggle-share')
    def toggle_share(self, request, pk=None):
        """
        1-Click Sharing Toggle:
        Allows Admins and Employees to quickly switch a document between
        'Shared with Client' and 'Internal Only'.
        """
        document = self.get_object()
        document.is_shared_with_client = not document.is_shared_with_client
        document.save(update_fields=['is_shared_with_client'])

        status_text = 'shared with client' if document.is_shared_with_client else 'internal only'
        return Response({
            'id': document.id,
            'title': document.title,
            'is_shared_with_client': document.is_shared_with_client,
            'message': f"Document '{document.title}' is now {status_text}."
        }, status=status.HTTP_200_OK)
