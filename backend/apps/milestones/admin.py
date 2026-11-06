# ===== FILE EXPLANATION =====
# Django Admin configuration for the milestones app.

from django.contrib import admin

from apps.milestones.models import Milestone, Task


@admin.register(Milestone)
class MilestoneAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Milestone model."""

    list_display = ['title', 'project', 'due_date', 'is_completed', 'created_at']
    list_filter = ['is_completed']
    search_fields = ['title', 'project__title']
    ordering = ['due_date']
    readonly_fields = ['created_at']


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    """Admin panel configuration for the Task model."""

    list_display = ['title', 'milestone', 'assigned_to', 'due_date', 'is_done']
    list_filter = ['is_done']
    search_fields = ['title', 'milestone__title', 'assigned_to__full_name']
    ordering = ['due_date']
