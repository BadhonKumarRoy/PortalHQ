# ===== FILE EXPLANATION =====
# This is Django's command-line utility for administrative tasks.
# Run it with: python manage.py <command>
# Examples: python manage.py runserver, python manage.py migrate, python manage.py createsuperuser

import os
import sys


def main():
    """
    Run administrative tasks for the PortalHQ Django project.
    Sets up the settings module and executes management commands.
    """
    # Tell Django which settings file to use
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it's installed and your "
            "virtual environment is activated."
        ) from exc

    # Pass command-line arguments to Django's management system
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
