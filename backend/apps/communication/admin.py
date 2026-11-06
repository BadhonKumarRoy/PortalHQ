# ===== FILE EXPLANATION =====
# Django Admin configuration for the communication app.

from django.contrib import admin

from apps.communication.models import Announcement, Meeting, Notification


@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Announcement model."""

    list_display = ['title', 'target_audience', 'created_by', 'created_at']
    list_filter = ['target_audience']
    search_fields = ['title', 'content', 'created_by__full_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']


@admin.register(Meeting)
class MeetingAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Meeting model."""

    list_display = ['title', 'project', 'meeting_date', 'created_at']
    list_filter = []
    search_fields = ['title', 'project__title']
    ordering = ['-meeting_date']
    readonly_fields = ['created_at']
    filter_horizontal = ['participants']  # Nice widget for many-to-many


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Notification model."""

    list_display = ['title', 'recipient', 'is_read', 'created_at']
    list_filter = ['is_read']
    search_fields = ['title', 'recipient__full_name', 'message']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
