# ===== FILE EXPLANATION =====
# URL routing for the communication app.
# Registers Announcements, Meetings, and Notifications viewsets.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.communication.views import AnnouncementViewSet, MeetingViewSet, NotificationViewSet

router = DefaultRouter()
router.register('announcements', AnnouncementViewSet, basename='announcement')
router.register('meetings', MeetingViewSet, basename='meeting')
router.register('notifications', NotificationViewSet, basename='notification')

urlpatterns = router.urls
