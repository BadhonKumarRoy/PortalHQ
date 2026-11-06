# ===== FILE EXPLANATION =====
# App configuration for the tickets app.

from django.apps import AppConfig


class TicketsConfig(AppConfig):
    """Configuration class for the tickets app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.tickets'
    label = 'tickets'
    verbose_name = 'Tickets'
