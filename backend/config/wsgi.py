# ===== FILE EXPLANATION =====
# WSGI (Web Server Gateway Interface) entry point for PortalHQ.
# This file is used by production web servers (like Gunicorn or uWSGI)
# to communicate with Django. You don't usually edit this file.

import os

from django.core.wsgi import get_wsgi_application

# Tell Django which settings file to use
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# Create the WSGI application object that the web server talks to
application = get_wsgi_application()
