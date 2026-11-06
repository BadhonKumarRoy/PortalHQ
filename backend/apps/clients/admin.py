# ===== FILE EXPLANATION =====
# Django Admin configuration for the clients app.
# Registers the Client model in the Django admin panel.

from django.contrib import admin

from apps.clients.models import Client


@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Client model."""

    # Columns visible in the client list table
    list_display = ['company_name', 'name', 'email', 'status', 'industry', 'created_at']

    # Sidebar filters
    list_filter = ['status', 'industry']

    # Searchable fields
    search_fields = ['name', 'company_name', 'email']

    # Default sort
    ordering = ['company_name']

    # Read-only fields in the form
    readonly_fields = ['created_at', 'updated_at']
