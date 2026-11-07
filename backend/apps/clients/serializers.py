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
    contact_name = serializers.CharField(source='name', read_only=True)

    class Meta:
        model = Client
        fields = ['id', 'name', 'contact_name', 'company_name', 'email', 'industry', 'status', 'created_at']


class ClientSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Client model.
    Used for retrieving a single client and for creating/updating clients.
    Includes all fields including contact info, notes, and linked user.
    """
    name = serializers.CharField(required=False)
    contact_name = serializers.CharField(source='name', required=False)
    temp_password = serializers.CharField(read_only=True, required=False)

    # Include the linked user's email in responses (read-only, for display)
    user_email = serializers.EmailField(
        source='user_account.email',
        read_only=True
    )

    class Meta:
        model = Client
        fields = [
            'id', 'name', 'contact_name', 'company_name', 'email', 'phone', 'address',
            'status', 'industry', 'website', 'notes',
            'user_account', 'user_email', 'temp_password',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_email', 'temp_password']

    def validate(self, attrs):
        # Support both 'name' and 'contact_name' seamlessly
        name = attrs.get('name') or self.initial_data.get('contact_name') or self.initial_data.get('name')
        if not name:
            if self.instance and self.instance.name:
                name = self.instance.name
            else:
                raise serializers.ValidationError({
                    'name': ['Contact name is required.'],
                    'contact_name': ['Contact name is required.']
                })
        attrs['name'] = name
        return attrs
