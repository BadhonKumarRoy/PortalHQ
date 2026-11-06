# ===== FILE EXPLANATION =====
# Django Admin configuration for the projects app.

from django.contrib import admin

from apps.projects.models import Project


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Project model."""

    list_display = ['title', 'client', 'status', 'start_date', 'end_date', 'created_by', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'client__company_name', 'created_by__full_name']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at']

    # Show the many-to-many assigned_employees field as a widget
    filter_horizontal = ['assigned_employees']
