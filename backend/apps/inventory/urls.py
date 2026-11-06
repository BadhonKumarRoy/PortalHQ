"""
URL router for Inventory and Movements.
"""
from rest_framework.routers import DefaultRouter
from .views import SupplierViewSet, InventoryItemViewSet, InventoryMovementViewSet

router = DefaultRouter()
router.register(r'suppliers', SupplierViewSet, basename='supplier')
router.register(r'items', InventoryItemViewSet, basename='inventory-item')
router.register(r'movements', InventoryMovementViewSet, basename='inventory-movement')

urlpatterns = router.urls
