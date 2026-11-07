# ===== FILE EXPLANATION =====
# Serializers for the tickets app.
# TicketSerializer includes nested comments for a full ticket view.

from rest_framework import serializers

from apps.tickets.models import Ticket, TicketComment


class TicketCommentSerializer(serializers.ModelSerializer):
    """Serializer for individual ticket comments."""

    # Show author's name for display
    author_name = serializers.CharField(source='author.full_name', read_only=True)

    class Meta:
        model = TicketComment
        fields = ['id', 'ticket', 'author', 'author_name', 'content', 'created_at']
        read_only_fields = ['id', 'author', 'created_at']


class TicketSerializer(serializers.ModelSerializer):
    """
    Full serializer for the Ticket model.
    Includes nested comments and display names.
    """

    comments = TicketCommentSerializer(many=True, read_only=True)
    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'title', 'description', 'status', 'priority',
            'project', 'project_title', 'client', 'client_name',
            'created_by', 'created_by_name',
            'assigned_to', 'assigned_to_name',
            'comments',  # Nested comment thread
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']


class TicketListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing tickets."""

    created_by_name = serializers.CharField(source='created_by.full_name', read_only=True)
    assigned_to_name = serializers.CharField(source='assigned_to.full_name', read_only=True)
    client_name = serializers.CharField(source='client.company_name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Ticket
        fields = ['id', 'title', 'status', 'priority', 'project', 'project_title', 'client_name',
                  'created_by_name', 'assigned_to_name', 'created_at']
