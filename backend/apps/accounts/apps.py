# ===== FILE EXPLANATION =====
# App configuration for the accounts app.
# Django uses this to configure the app when the server starts.

from django.apps import AppConfig


class AccountsConfig(AppConfig):
    """Configuration class for the accounts app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.accounts'      # Must match the path in INSTALLED_APPS
    label = 'accounts'          # Short name used for database table prefixes
    verbose_name = 'Accounts'   # Human-readable name shown in Django admin
