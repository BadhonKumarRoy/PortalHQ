# ===== FILE EXPLANATION =====
# URL routing for the milestones app.
# Registers both Milestone and Task viewsets.

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.milestones.views import MilestoneViewSet, TaskViewSet

router = DefaultRouter()
router.register('', MilestoneViewSet, basename='milestone')      # /api/milestones/
router.register('tasks', TaskViewSet, basename='task')           # /api/milestones/tasks/

urlpatterns = router.urls
