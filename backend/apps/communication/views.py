# ===== FILE EXPLANATION =====
# API views for the communication app.
# Handles Announcements, Meetings, and Notifications.
# Notifications include a custom action to mark them as read.

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.communication.models import Announcement, Meeting, Notification
from apps.communication.serializers import (
    AnnouncementSerializer, MeetingSerializer, NotificationSerializer
)
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class AnnouncementViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Announcements.
    Admins/Employees can create announcements; everyone sees relevant ones.
    Filtering is based on target_audience and user role.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = AnnouncementSerializer

    def get_queryset(self):
        """Return announcements relevant to the current user's role."""
        user = self.request.user

        if user.role == 'ADMIN':
            return Announcement.objects.all()

        elif user.role == 'EMPLOYEE':
            # Employees see announcements for All or Employees
            return Announcement.objects.filter(
                target_audience__in=['ALL', 'EMPLOYEES']
            )

        elif user.role == 'CLIENT':
            # Clients see announcements for All or Clients
            return Announcement.objects.filter(
                target_audience__in=['ALL', 'CLIENTS']
            )

        return Announcement.objects.none()

    def get_permissions(self):
        """Only admins/employees can create or delete announcements."""
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Set the creator to the current user."""
        serializer.save(created_by=self.request.user)


class MeetingViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Meetings.
    Admins see all meetings; Employees and Clients see meetings they're in.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = MeetingSerializer

    def get_queryset(self):
        """Filter meetings by participation."""
        user = self.request.user

        if user.role == 'ADMIN':
            return Meeting.objects.all().prefetch_related('participants')

        # Employees and Clients see meetings they're a participant in
        return Meeting.objects.filter(
            participants=user
        ).prefetch_related('participants')

    def get_permissions(self):
        """Only Admin/Employee can create or manage meetings."""
        if self.action in ('create', 'update', 'partial_update', 'destroy'):
            return [IsAuthenticated(), IsAdminOrEmployee()]
        return [IsAuthenticated()]


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for Notifications.
    Read-only: users can only see their own notifications.
    Custom action allows marking notifications as read.
    """

    permission_classes = [IsAuthenticated]
    serializer_class = NotificationSerializer

    def get_queryset(self):
        """Each user only sees their own notifications."""
        return Notification.objects.filter(recipient=self.request.user)

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        """
        POST /api/communication/notifications/<id>/mark-read/
        Mark a single notification as read.
        """
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'message': 'Notification marked as read.'})

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        """
        POST /api/communication/notifications/mark-all-read/
        Mark all of the current user's notifications as read.
        """
        updated_count = Notification.objects.filter(
            recipient=request.user,
            is_read=False  # Only update unread ones
        ).update(is_read=True)

        return Response({'message': f'{updated_count} notifications marked as read.'})
