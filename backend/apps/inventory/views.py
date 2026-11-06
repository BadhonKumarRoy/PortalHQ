"""
Views for Inventory management and inventory movement tracking.
Automatically updates item stock on movements.
"""
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Supplier, InventoryItem, InventoryMovement
from .serializers import SupplierSerializer, InventoryItemSerializer, InventoryMovementSerializer

class SupplierViewSet(viewsets.ModelViewSet):
    queryset = Supplier.objects.all().order_by('name')
    serializer_class = SupplierSerializer
    permission_classes = [IsAuthenticated]

class InventoryItemViewSet(viewsets.ModelViewSet):
    queryset = InventoryItem.objects.all().order_by('name')
    serializer_class = InventoryItemSerializer
    permission_classes = [IsAuthenticated]

class InventoryMovementViewSet(viewsets.ModelViewSet):
    queryset = InventoryMovement.objects.all().order_by('-created_at')
    serializer_class = InventoryMovementSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        movement = serializer.save(performed_by=self.request.user)
        # Stock quantity adjustment logic
        item = movement.item
        qty = movement.quantity
        if movement.movement_type in ['RECEIVE', 'RETURN']:
            item.quantity += qty
        elif movement.movement_type in ['ISSUE', 'DISPOSE']:
            item.quantity = max(0, item.quantity - qty)
        item.save()
