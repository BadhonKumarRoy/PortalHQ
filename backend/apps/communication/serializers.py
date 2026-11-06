# ===== FILE EXPLANATION =====
# Serializers for the communication app.

from rest_framework import serializers

from apps.communication.models import Announcement, Meeting, Notification


class AnnouncementSerializer(serializers.ModelSerializer):
    """Serializer for Announcements. Shows creator's name."""

    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    class Meta:
        model = Announcement
        fields = ['id', 'title', 'content', 'target_audience', 'created_by', 'created_by_name', 'created_at']
        read_only_fields = ['id', 'created_by', 'created_at']


class MeetingSerializer(serializers.ModelSerializer):
    """Serializer for Meetings. Shows participant list and project title."""

    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'agenda', 'participants',
            'project', 'project_title',
            'meeting_date', 'minutes', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for Notifications. Used for reading and marking as read."""

    class Meta:
        model = Notification
        fields = ['id', 'recipient', 'title', 'message', 'is_read', 'created_at']
        read_only_fields = ['id', 'recipient', 'created_at']
