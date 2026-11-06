"""
Serializers for Asset Management.
Converts Asset models into JSON for REST endpoints.
"""
from rest_framework import serializers
from .models import Asset

class AssetSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)

    class Meta:
        model = Asset
        fields = [
            'id', 'name', 'asset_type', 'serial_number', 'brand', 'model',
            'status', 'assigned_to', 'assigned_to_name', 'client', 'client_name',
            'warranty_expiry', 'purchase_date', 'notes', 'created_at', 'updated_at'
        ]
