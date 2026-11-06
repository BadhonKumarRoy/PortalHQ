"""
Inventory Management Models.
Implements item tracking, supplier relationships, and all 7 movement types
as defined in SRS Section 5.17 & 5.18:
Receive -> Store -> Issue -> Transfer -> Return -> Maintenance -> Dispose
"""
from django.db import models
from django.conf import settings

class Supplier(models.Model):
    name = models.CharField(max_length=255)
    contact_person = models.CharField(max_length=255, blank=True)
    email = models.EmailField(blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class InventoryItem(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    sku = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=100, default='General')
    quantity = models.IntegerField(default=0)
    unit = models.CharField(max_length=50, default='units')
    supplier = models.ForeignKey(Supplier, null=True, blank=True, on_delete=models.SET_NULL, related_name='items')
    low_stock_threshold = models.IntegerField(default=10)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class InventoryMovement(models.Model):
    MOVEMENT_TYPES = [
        ('RECEIVE', 'Receive'),
        ('STORE', 'Store'),
        ('ISSUE', 'Issue'),
        ('TRANSFER', 'Transfer'),
        ('RETURN', 'Return'),
        ('MAINTENANCE', 'Maintenance'),
        ('DISPOSE', 'Dispose'),
    ]

    item = models.ForeignKey(InventoryItem, on_delete=models.CASCADE, related_name='movements')
    movement_type = models.CharField(max_length=50, choices=MOVEMENT_TYPES)
    quantity = models.IntegerField()
    from_location = models.CharField(max_length=255, blank=True)
    to_location = models.CharField(max_length=255, blank=True)
    performed_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    reason = models.CharField(max_length=255, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.movement_type} - {self.item.name} ({self.quantity})"
