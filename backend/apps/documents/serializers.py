# ===== FILE EXPLANATION =====
# Serializers for the documents app.
# Handles file upload data, file size restrictions (max 500 KB),
# category normalization, and display of document metadata.

from rest_framework import serializers
from apps.documents.models import Document

# Maximum allowed file size for document uploads (500 Kilobytes)
MAX_FILE_SIZE_BYTES = 500 * 1024  # 500 KB


class DocumentSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Document model.
    Handles file uploads, enforces strict 500 KB file limits,
    normalizes category choices, and provides readable display fields.
    """

    # Show who uploaded the file (read-only display)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    # Show linked names for context
    project_title = serializers.CharField(source='project.title', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    # Portal visibility flag with explicit boolean handling
    is_shared_with_client = serializers.BooleanField(default=False, required=False)

    # file_url provides the full URL to download the file
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_url', 'category', 'category_display', 'version',
            'project', 'project_title',
            'client', 'client_name',
            'uploaded_by', 'uploaded_by_name',
            'is_shared_with_client',
            'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']

    def to_internal_value(self, data):
        """
        Normalize form inputs:
        - Handle category case-insensitively (e.g. 'Deliverable' -> 'DELIVERABLE')
        - Convert string booleans ('true' / 'false') for is_shared_with_client
        """
        if hasattr(data, '_mutable'):
            # QueryDict from multipart form data
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        # 1. Normalize category
        if 'category' in data and isinstance(data['category'], str):
            val = data['category'].strip().upper()
            mapping = {
                'DELIVERABLE': 'DELIVERABLE',
                'SPECIFICATION': 'SPECIFICATION',
                'CONTRACT': 'CONTRACT',
                'REPORT': 'REPORT',
                'INVOICE': 'INVOICE',
                'OTHER': 'OTHER',
            }
            if val in mapping:
                data['category'] = mapping[val]

        # 2. Normalize boolean sharing flag
        if 'is_shared_with_client' in data:
            val = data['is_shared_with_client']
            if isinstance(val, str):
                data['is_shared_with_client'] = val.lower() in ('true', '1', 'yes')

        return super().to_internal_value(data)

    def validate_file(self, value):
        """
        Enforce strict file size restriction (max 500 KB).
        """
        if value and hasattr(value, 'size'):
            if value.size > MAX_FILE_SIZE_BYTES:
                size_kb = value.size / 1024
                raise serializers.ValidationError(
                    f"File size ({size_kb:.1f} KB) exceeds the maximum allowed limit of 500 KB. "
                    f"Please upload a smaller file under 500 KB."
                )
        return value

    def get_file_url(self, obj):
        """
        Build an absolute URL for the document file.
        Uses the request context to construct the full URL with domain.
        """
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document list views."""

    project_title = serializers.CharField(source='project.title', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'category', 'category_display', 'version', 'file', 'file_url',
            'project', 'project_title', 'client', 'client_name',
            'is_shared_with_client', 'created_at'
        ]

    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None
