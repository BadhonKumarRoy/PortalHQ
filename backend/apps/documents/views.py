# ===== FILE EXPLANATION =====
# API views for the documents app.
# Handles file uploads and document management with role-based access.
# Clients can only see documents explicitly shared with them.

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from apps.documents.models import Document
from apps.documents.serializers import DocumentSerializer, DocumentListSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class DocumentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Document CRUD and file upload.

    Data visibility:
    - Admins: see all documents
    - Employees: see all non-client-restricted documents
    - Clients: only see documents where is_shared_with_client=True
               and the document is linked to their client profile
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'category']
    ordering_fields = ['created_at', 'title']

    def get_queryset(self):
        """Filter documents based on the user's role."""
        user = self.request.user

        if user.role == 'ADMIN':
            # Admins see everything
            return Document.objects.all().select_related('project', 'client', 'uploaded_by')

        elif user.role == 'EMPLOYEE':
            # Employees see all documents (they work on these)
            return Document.objects.all().select_related('project', 'client', 'uploaded_by')

        elif user.role == 'CLIENT':
            # Clients only see documents explicitly shared with them
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                return Document.objects.filter(
                    client=client,
                    is_shared_with_client=True  # Must be explicitly shared
                ).select_related('project', 'client', 'uploaded_by')

        return Document.objects.none()

    def get_serializer_class(self):
        """Use lightweight serializer for lists."""
        if self.action == 'list':
            return DocumentListSerializer
        return DocumentSerializer

    def get_permissions(self):
        """Only Admin/Employee can upload or modify; Clients read-only."""
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Automatically set the uploader to the current user."""
        serializer.save(uploaded_by=self.request.user)
