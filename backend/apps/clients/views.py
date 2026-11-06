# ===== FILE EXPLANATION =====
# API views for the clients app.
# Provides full CRUD (Create, Read, Update, Delete) operations on Client records.
# Only Organization Admins can access these endpoints.

from rest_framework import viewsets, filters
from rest_framework.permissions import IsAuthenticated

from apps.clients.models import Client
from apps.clients.serializers import ClientSerializer, ClientListSerializer
from apps.accounts.permissions import IsAdmin


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet that handles all CRUD operations for clients.

    Endpoints (all prefixed with /api/clients/):
        GET    /            → list all clients
        POST   /            → create a new client
        GET    /<id>/       → retrieve one client
        PUT    /<id>/       → fully update a client
        PATCH  /<id>/       → partially update a client
        DELETE /<id>/       → delete a client

    Access: Organization Admins only.
    """

    # Only admins can manage clients
    permission_classes = [IsAuthenticated, IsAdmin]

    # Return all clients (admins see everything)
    queryset = Client.objects.all()

    # Allow searching by name, company, or email in the query string
    # Example: GET /api/clients/?search=acme
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name', 'email']
    ordering_fields = ['company_name', 'created_at', 'status']

    def get_serializer_class(self):
        """
        Use the lightweight list serializer for list views,
        and the full serializer for all other operations.
        """
        if self.action == 'list':
            return ClientListSerializer  # Smaller payload for lists
        return ClientSerializer  # Full details for single-object views
