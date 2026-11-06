# ===== FILE EXPLANATION =====
# Django Admin configuration for the documents app.

from django.contrib import admin

from apps.documents.models import Document


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Document model."""

    list_display = ['title', 'category', 'version', 'project', 'client', 'uploaded_by', 'is_shared_with_client', 'created_at']
    list_filter = ['category', 'is_shared_with_client']
    search_fields = ['title', 'project__title', 'client__company_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at']
