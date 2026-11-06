"""
Serializers for Inventory and Movement tracking.
"""
from rest_framework import serializers
from .models import Supplier, InventoryItem, InventoryMovement

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'

class InventoryItemSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    is_low_stock = serializers.SerializerMethodField()

    class Meta:
        model = InventoryItem
        fields = [
            'id', 'name', 'description', 'sku', 'category', 'quantity', 'unit',
            'supplier', 'supplier_name', 'low_stock_threshold', 'is_low_stock',
            'created_at', 'updated_at'
        ]

    def get_is_low_stock(self, obj):
        return obj.quantity <= obj.low_stock_threshold

class InventoryMovementSerializer(serializers.ModelSerializer):
    item_name = serializers.CharField(source='item.name', read_only=True)
    performed_by_name = serializers.CharField(source='performed_by.full_name', read_only=True)

    class Meta:
        model = InventoryMovement
        fields = [
            'id', 'item', 'item_name', 'movement_type', 'quantity',
            'from_location', 'to_location', 'performed_by', 'performed_by_name',
            'reason', 'notes', 'created_at'
        ]
