from django.contrib import admin
from .models import Asset

@admin.register(Asset)
class AssetAdmin(admin.ModelAdmin):
    list_display = ('name', 'asset_type', 'status', 'assigned_to', 'client', 'warranty_expiry')
    list_filter = ('asset_type', 'status')
    search_fields = ('name', 'serial_number', 'brand', 'model')
