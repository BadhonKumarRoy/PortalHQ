from django.contrib import admin
from .models import Supplier, InventoryItem, InventoryMovement

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ('name', 'contact_person', 'email', 'phone')

@admin.register(InventoryItem)
class InventoryItemAdmin(admin.ModelAdmin):
    list_display = ('name', 'sku', 'category', 'quantity', 'unit', 'low_stock_threshold')
    search_fields = ('name', 'sku')
    list_filter = ('category',)

@admin.register(InventoryMovement)
class InventoryMovementAdmin(admin.ModelAdmin):
    list_display = ('item', 'movement_type', 'quantity', 'performed_by', 'created_at')
    list_filter = ('movement_type',)
