# ===== FILE EXPLANATION =====
# URL routing for the approvals app.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.approvals.views import ApprovalViewSet

router = DefaultRouter()
router.register('', ApprovalViewSet, basename='approval')

urlpatterns = router.urls
