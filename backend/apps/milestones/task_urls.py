# apps/milestones/task_urls.py
# Standalone router for /api/tasks/ endpoints.

from rest_framework.routers import DefaultRouter
from apps.milestones.views import TaskViewSet

router = DefaultRouter()
router.register('', TaskViewSet, basename='task')

urlpatterns = router.urls
