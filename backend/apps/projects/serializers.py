# ===== FILE EXPLANATION =====
# Serializers for the projects app.
# Converts Project model instances to/from JSON.
# The serializer includes nested info (like client name) for better readability.

from rest_framework import serializers

from apps.projects.models import Project
from apps.accounts.serializers import UserSerializer


class ProjectSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Project model.
    Includes nested client name and employee details for better readability.
    Used for retrieve, create, and update operations.
    """

    # Nested field: show client name alongside client_id in responses
    client_name = serializers.CharField(source='client.company_name', read_only=True)

    # Show who created the project (read-only display)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)

    # For listing assigned employees with their details
    assigned_employees_detail = UserSerializer(
        source='assigned_employees',
        many=True,         # Multiple employees
        read_only=True     # Can't set employees via this field (use assigned_employees instead)
    )

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description',
            'client', 'client_name',                              # client is the FK id; client_name is display
            'assigned_employees', 'assigned_employees_detail',    # assigned_employees is a list of ids
            'status', 'start_date', 'end_date', 'budget',
            'created_by', 'created_by_name',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_by_name', 'created_at', 'updated_at']


class ProjectListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing projects.
    Keeps responses small by only including key fields.
    """

    client_name = serializers.CharField(source='client.company_name', read_only=True)
    assigned_employees_count = serializers.IntegerField(source='assigned_employees.count', read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'title', 'description', 'client', 'client_name',
            'assigned_employees_count',
            'status', 'start_date', 'end_date', 'budget', 'created_at'
        ]
