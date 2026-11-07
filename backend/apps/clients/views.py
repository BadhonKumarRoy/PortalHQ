# ===== FILE EXPLANATION =====
# API views for the clients app.
# Provides full CRUD (Create, Read, Update, Delete) operations on Client records.
# When creating a client, automatically creates their portal login credentials.
# Also provides a 1-click 'portal-access' endpoint to retrieve or reset client login info anytime.
# Only Organization Admins can access these endpoints.

import random
from rest_framework import viewsets, filters, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.clients.models import Client
from apps.clients.serializers import ClientSerializer, ClientListSerializer
from apps.accounts.permissions import IsAdmin
from apps.accounts.models import User


class ClientViewSet(viewsets.ModelViewSet):
    """
    ViewSet that handles all CRUD operations for clients.

    Endpoints (all prefixed with /api/clients/):
        GET    /                          → list all clients
        POST   /                          → create a new client (auto-creates portal login)
        GET    /<id>/                     → retrieve one client
        PUT    /<id>/                     → fully update a client
        PATCH  /<id>/                     → partially update a client
        DELETE /<id>/                     → delete a client
        POST   /<id>/portal-access/       → generate or retrieve portal credentials to copy & share

    Access: Organization Admins only.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = Client.objects.all()

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'company_name', 'email']
    ordering_fields = ['company_name', 'created_at', 'status']

    def get_serializer_class(self):
        if self.action == 'list':
            return ClientListSerializer
        return ClientSerializer

    def perform_create(self, serializer):
        """
        Save the client and automatically provision their client portal login
        with a temporary password ready for the admin to copy and share.
        """
        client = serializer.save()
        self._sync_client_user(client)

    def perform_update(self, serializer):
        """
        When updating client information (name, email, phone, status),
        automatically synchronize the linked User account profile so login
        credentials and portal display names stay 100% updated in real-time.
        """
        client = serializer.save()
        self._sync_client_user(client)

    def _sync_client_user(self, client):
        """
        Keep Client and User account models perfectly in sync.
        Handles name changes, email updates, and ensures login profile matches.
        """
        target_email = client.email.strip().lower()
        user = client.user_account or User.objects.filter(email__iexact=target_email).first()

        if user:
            # If the client's email changed, safely update user's email if no other user has it
            if user.email.lower() != target_email:
                existing = User.objects.filter(email__iexact=target_email).exclude(pk=user.pk).first()
                if existing:
                    user = existing
                else:
                    user.email = target_email

            user.full_name = client.name
            if client.phone is not None:
                user.phone = client.phone
            user.is_active = (client.status == 'ACTIVE')
            user.save()

            if client.user_account != user:
                client.user_account = user
                client.save(update_fields=['user_account'])
        else:
            # Auto-provision user account with a temporary password
            temp_pass = getattr(self, 'request', None) and self.request.data.get('portal_password')
            if not temp_pass or len(temp_pass) < 8:
                temp_pass = f"Portal#{random.randint(1000, 9999)}"

            user = User.objects.create_user(
                email=target_email,
                full_name=client.name,
                password=temp_pass,
                role='CLIENT',
                phone=client.phone or '',
                is_active=(client.status == 'ACTIVE')
            )
            client.temp_password = temp_pass
            client.user_account = user
            client.save(update_fields=['user_account'])

        return user

    @action(detail=True, methods=['post'], url_path='portal-access')
    def portal_access(self, request, pk=None):
        """
        POST /api/clients/<id>/portal-access/
        Generates or resets the client's portal login and returns
        a clean copyable credential card for WhatsApp or email.
        """
        client = self.get_object()
        user = self._sync_client_user(client)

        temp_pass = request.data.get('password')
        if not temp_pass or len(temp_pass) < 8:
            temp_pass = f"Portal#{random.randint(1000, 9999)}"

        user.set_password(temp_pass)
        user.save()

        return Response({
            'message': f"Portal login credentials ready for {client.name}.",
            'client_name': client.name,
            'company_name': client.company_name,
            'email': user.email,
            'temp_password': temp_pass
        }, status=status.HTTP_200_OK)
