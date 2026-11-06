# ===== FILE EXPLANATION =====
# App configuration for the communication app.

from django.apps import AppConfig


class CommunicationConfig(AppConfig):
    """Configuration class for the communication app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.communication'
    label = 'communication'
    verbose_name = 'Communication'
