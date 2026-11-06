"""
URL router for Asset Management.
"""
from rest_framework.routers import DefaultRouter
from .views import AssetViewSet

router = DefaultRouter()
router.register(r'', AssetViewSet, basename='asset')

urlpatterns = router.urls
