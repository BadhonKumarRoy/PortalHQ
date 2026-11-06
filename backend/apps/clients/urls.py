# ===== FILE EXPLANATION =====
# URL routing for the clients app.
# Uses DRF's DefaultRouter which automatically generates all the standard
# REST URL patterns (list, create, retrieve, update, delete).

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.clients.views import ClientViewSet

# Create a router and register our ClientViewSet
router = DefaultRouter()
router.register('', ClientViewSet, basename='client')  # '' means no extra prefix

# The router automatically generates these URL patterns:
#   GET    /api/clients/        → ClientViewSet.list
#   POST   /api/clients/        → ClientViewSet.create
#   GET    /api/clients/<pk>/   → ClientViewSet.retrieve
#   PUT    /api/clients/<pk>/   → ClientViewSet.update
#   PATCH  /api/clients/<pk>/   → ClientViewSet.partial_update
#   DELETE /api/clients/<pk>/   → ClientViewSet.destroy
urlpatterns = router.urls
