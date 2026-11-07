# ===== FILE EXPLANATION =====
# API views for the tickets app.
# Clients can create and view their tickets; Employees manage and respond to them.

from rest_framework import viewsets, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.tickets.models import Ticket, TicketComment
from apps.tickets.serializers import TicketSerializer, TicketListSerializer, TicketCommentSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Ticket CRUD.

    Data visibility:
    - Admin: all tickets
    - Employee: tickets assigned to them OR all unassigned tickets
    - Client: only their own tickets
    """

    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description']
    ordering_fields = ['created_at', 'priority', 'status']

    def get_queryset(self):
        """Filter tickets based on the user's role."""
        user = self.request.user

        if user.role == 'ADMIN':
            return Ticket.objects.all().select_related('project', 'client', 'created_by', 'assigned_to')

        elif user.role == 'EMPLOYEE':
            # Employees see tickets assigned to them or all open/unassigned tickets
            from django.db.models import Q
            return Ticket.objects.filter(
                Q(assigned_to=user) | Q(assigned_to__isnull=True)
            ).select_related('project', 'client', 'created_by', 'assigned_to')

        elif user.role == 'CLIENT':
            # Clients only see their own tickets
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                return Ticket.objects.filter(
                    client=client
                ).select_related('project', 'client', 'created_by', 'assigned_to')

        return Ticket.objects.none()

    def get_serializer_class(self):
        """Light serializer for lists, full for single views."""
        if self.action == 'list':
            return TicketListSerializer
        return TicketSerializer

    def get_permissions(self):
        """Everyone authenticated can create tickets; Admins can delete."""
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Automatically set the creator to the current user."""
        user = self.request.user
        extra = {'created_by': user}
        if user.role == 'CLIENT':
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                extra['client'] = client
        serializer.save(**extra)

    @action(detail=True, methods=['get', 'post'], url_path='comments')
    def comments(self, request, pk=None):
        """
        GET  /api/tickets/<id>/comments/ → list comments for this ticket
        POST /api/tickets/<id>/comments/ → post a new comment
        """
        ticket = self.get_object()
        if request.method == 'POST':
            content = request.data.get('content', '').strip()
            if not content:
                return Response({'error': 'Comment content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)
            comment = TicketComment.objects.create(
                ticket=ticket,
                author=request.user,
                content=content
            )
            serializer = TicketCommentSerializer(comment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        comments = ticket.comments.all().select_related('author').order_by('created_at')
        serializer = TicketCommentSerializer(comments, many=True)
        return Response(serializer.data)


class TicketCommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TicketComment CRUD.
    Both employees and clients can post comments on accessible tickets.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = TicketCommentSerializer

    def get_queryset(self):
        """Return comments that the user has access to (via their ticket access)."""
        user = self.request.user

        if user.role == 'ADMIN':
            return TicketComment.objects.all().select_related('ticket', 'author')

        elif user.role == 'EMPLOYEE':
            from django.db.models import Q
            return TicketComment.objects.filter(
                Q(ticket__assigned_to=user) | Q(ticket__assigned_to__isnull=True)
            ).select_related('ticket', 'author')

        elif user.role == 'CLIENT':
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                return TicketComment.objects.filter(
                    ticket__client=client
                ).select_related('ticket', 'author')

        return TicketComment.objects.none()

    def get_permissions(self):
        """Only admins can delete comments."""
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Automatically set the comment author to the current user."""
        serializer.save(author=self.request.user)
