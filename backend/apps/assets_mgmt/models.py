"""
Asset Management Models.
Tracks physical and digital business assets (laptops, software, equipment),
custody assignment, and warranty info.
"""
from django.db import models
from django.conf import settings

class Asset(models.Model):
    TYPE_CHOICES = [
        ('HARDWARE', 'Hardware'),
        ('SOFTWARE', 'Software'),
        ('EQUIPMENT', 'Equipment'),
        ('OTHER', 'Other'),
    ]
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available'),
        ('ASSIGNED', 'Assigned'),
        ('MAINTENANCE', 'Maintenance'),
        ('RETIRED', 'Retired'),
    ]

    name = models.CharField(max_length=255)
    asset_type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='HARDWARE')
    serial_number = models.CharField(max_length=100, blank=True)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='AVAILABLE')
    assigned_to = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_assets'
    )
    client = models.ForeignKey(
        'clients.Client',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='client_assets'
    )
    warranty_expiry = models.DateField(null=True, blank=True)
    purchase_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.get_asset_type_display()})"
