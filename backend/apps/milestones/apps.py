# ===== FILE EXPLANATION =====
# App configuration for the milestones app.

from django.apps import AppConfig


class MilestonesConfig(AppConfig):
    """Configuration class for the milestones app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.milestones'
    label = 'milestones'
    verbose_name = 'Milestones'
