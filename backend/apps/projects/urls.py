# ===== FILE EXPLANATION =====
# URL routing for the projects app using DRF's DefaultRouter.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.projects.views import ProjectViewSet

router = DefaultRouter()
router.register('', ProjectViewSet, basename='project')

urlpatterns = router.urls
