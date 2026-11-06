# ===== FILE EXPLANATION =====
# Serializers for the clients app.
# ClientSerializer: full details (used for create/update/retrieve).
# ClientListSerializer: summary (used in list views to keep responses small).

from rest_framework import serializers

from apps.clients.models import Client


class ClientListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for listing clients.
    Only includes essential fields to keep API responses fast and small.
    Used when fetching a list of all clients.
    """

    class Meta:
        model = Client
        fields = ['id', 'name', 'company_name', 'email', 'status', 'created_at']


class ClientSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Client model.
    Used for retrieving a single client and for creating/updating clients.
    Includes all fields including contact info, notes, and linked user.
    """

    # Include the linked user's email in responses (read-only, for display)
    user_email = serializers.EmailField(
        source='user_account.email',
        read_only=True  # This is derived from the relationship, not a direct field
    )

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'company_name', 'email', 'phone', 'address',
            'status', 'industry', 'website', 'notes',
            'user_account', 'user_email',  # user_account is the FK id, user_email is a bonus display field
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_email']
