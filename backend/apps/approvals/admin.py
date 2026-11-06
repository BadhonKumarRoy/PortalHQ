# ===== FILE EXPLANATION =====
# Django Admin configuration for the approvals app.

from django.contrib import admin

from apps.approvals.models import Approval


@admin.register(Approval)
class ApprovalAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Approval model."""

    list_display = ['document', 'requested_by', 'reviewed_by', 'status', 'requested_at', 'reviewed_at']
    list_filter = ['status']
    search_fields = ['document__title', 'requested_by__full_name', 'reviewed_by__full_name']
    ordering = ['-requested_at']
    readonly_fields = ['requested_at']
