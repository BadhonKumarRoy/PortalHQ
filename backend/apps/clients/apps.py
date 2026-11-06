# ===== FILE EXPLANATION =====
# App configuration for the clients app.

from django.apps import AppConfig


class ClientsConfig(AppConfig):
    """Configuration class for the clients app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.clients'
    label = 'clients'
    verbose_name = 'Clients'
