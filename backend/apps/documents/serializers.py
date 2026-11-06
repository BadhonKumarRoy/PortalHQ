# ===== FILE EXPLANATION =====
# Serializers for the documents app.
# Handles file upload data and display of document metadata.

from rest_framework import serializers

from apps.documents.models import Document


class DocumentSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Document model.
    Handles file uploads and provides readable display fields.
    """

    # Show who uploaded the file (read-only display)
    uploaded_by_name = serializers.CharField(source='uploaded_by.full_name', read_only=True)

    # Show linked names for context
    project_title = serializers.CharField(source='project.title', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)

    # file_url provides the full URL to download the file
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = [
            'id', 'title', 'file', 'file_url', 'category', 'version',
            'project', 'project_title',
            'client', 'client_name',
            'uploaded_by', 'uploaded_by_name',
            'is_shared_with_client',
            'created_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at']

    def get_file_url(self, obj):
        """
        Build an absolute URL for the document file.
        Uses the request context to construct the full URL with domain.
        """
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document list views."""

    project_title = serializers.CharField(source='project.title', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'category', 'version', 'project_title', 'client_name',
                  'is_shared_with_client', 'created_at']
