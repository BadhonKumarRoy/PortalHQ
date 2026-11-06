# ===== FILE EXPLANATION =====
# URL routing for the tickets app.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.tickets.views import TicketViewSet, TicketCommentViewSet

router = DefaultRouter()
router.register('', TicketViewSet, basename='ticket')
router.register('comments', TicketCommentViewSet, basename='ticket-comment')

urlpatterns = router.urls
