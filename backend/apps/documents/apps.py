# ===== FILE EXPLANATION =====
# App configuration for the documents app.

from django.apps import AppConfig


class DocumentsConfig(AppConfig):
    """Configuration class for the documents app."""

    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.documents'
    label = 'documents'
    verbose_name = 'Documents'
