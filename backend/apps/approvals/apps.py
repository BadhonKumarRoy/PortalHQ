# ===== FILE EXPLANATION =====
# App configuration for the approvals app.

from django.apps import AppConfig


class ApprovalsConfig(AppConfig):
    """Configuration class for the approvals app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.approvals'
    label = 'approvals'
    verbose_name = 'Approvals'
