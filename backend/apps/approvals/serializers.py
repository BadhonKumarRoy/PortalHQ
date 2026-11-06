# ===== FILE EXPLANATION =====
# Serializers for the approvals app.

from rest_framework import serializers

from apps.approvals.models import Approval


class ApprovalSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Approval model.
    Shows document title and reviewer/requester names for display.
    """

    # Readable display fields
    document_title = serializers.CharField(source='document.title', read_only=True)
    requested_by_name = serializers.CharField(source='requested_by.full_name', read_only=True)
    reviewed_by_name = serializers.CharField(source='reviewed_by.full_name', read_only=True)

    class Meta:
        model = Approval
        fields = [
            'id',
            'document', 'document_title',
            'requested_by', 'requested_by_name',
            'reviewed_by', 'reviewed_by_name',
            'status', 'comments',
            'requested_at', 'reviewed_at'
        ]
        # These are set automatically, not by the user
        read_only_fields = ['id', 'requested_by', 'requested_at']
