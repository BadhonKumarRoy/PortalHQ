# ===== FILE EXPLANATION =====
# Django Admin configuration for the tickets app.

from django.contrib import admin

from apps.tickets.models import Ticket, TicketComment


@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Ticket model."""

    list_display = ['title', 'priority', 'status', 'client', 'assigned_to', 'created_by', 'created_at']
    list_filter = ['status', 'priority']
    search_fields = ['title', 'description', 'client__company_name', 'assigned_to__full_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    """Admin panel configuration for the TicketComment model."""

    list_display = ['ticket', 'author', 'created_at']
    search_fields = ['ticket__title', 'author__full_name', 'content']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
