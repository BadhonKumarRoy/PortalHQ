# ===== FILE EXPLANATION =====
# URL routing for the documents app.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.documents.views import DocumentViewSet

router = DefaultRouter()
router.register('', DocumentViewSet, basename='document')

urlpatterns = router.urls
