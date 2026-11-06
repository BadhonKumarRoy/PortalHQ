# ===== FILE EXPLANATION =====
# Django Admin configuration for the accounts app.
# Registers the User model so it appears in the Django admin panel.
# Visit /admin/ in your browser to manage users through a web interface.

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from apps.accounts.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """
    Custom admin panel configuration for the User model.
    Extends Django's built-in UserAdmin to work with our custom User model.
    """

    # Columns shown in the user list view
    list_display = ['email', 'full_name', 'role', 'is_active', 'is_staff', 'date_joined']

    # Sidebar filters to narrow down the list
    list_filter = ['role', 'is_active', 'is_staff']

    # Fields that the search bar searches through
    search_fields = ['email', 'full_name']

    # Default sort order
    ordering = ['-date_joined']

    # Fields shown when EDITING an existing user
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal Info', {'fields': ('full_name', 'phone')}),
        ('Role & Permissions', {'fields': ('role', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important Dates', {'fields': ('last_login', 'date_joined')}),
    )

    # Fields shown when CREATING a new user via admin
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'full_name', 'role', 'password1', 'password2'),
        }),
    )

    # Read-only fields (can't be edited in admin)
    readonly_fields = ['date_joined', 'last_login']
