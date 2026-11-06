# ===== FILE EXPLANATION =====
# This is the main Django settings file for PortalHQ.
# It controls everything: database, installed apps, authentication,
# CORS, JWT tokens, file uploads, and more.
# Values like SECRET_KEY and DEBUG are loaded from a .env file for security.

from pathlib import Path
from datetime import timedelta

# python-decouple reads values from your .env file
from decouple import config, Csv

# ─────────────────────────────────────────────
# BASE DIRECTORY
# ─────────────────────────────────────────────
# Build paths inside the project like: BASE_DIR / 'subfolder'
BASE_DIR = Path(__file__).resolve().parent.parent

# ─────────────────────────────────────────────
# SECURITY SETTINGS
# ─────────────────────────────────────────────
# Read SECRET_KEY from .env — never hardcode this!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-change-me-in-production')

# Debug mode — set to False in production
DEBUG = config('DEBUG', default=True, cast=bool)

# Hosts that are allowed to serve this app (supports local and cloud deployment like Render)
ALLOWED_HOSTS = ['*']

# ─────────────────────────────────────────────
# CUSTOM USER MODEL
# ─────────────────────────────────────────────
# Tell Django to use our custom User model from the accounts app
AUTH_USER_MODEL = 'accounts.User'

# ─────────────────────────────────────────────
# INSTALLED APPS
# ─────────────────────────────────────────────
INSTALLED_APPS = [
    # Django built-in apps
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party packages
    'rest_framework',           # Django REST Framework for building APIs
    'corsheaders',              # CORS headers for frontend communication
    'rest_framework_simplejwt', # JWT authentication

    # PortalHQ custom apps (each handles a specific feature area)
    'apps.accounts',      # User accounts and authentication
    'apps.clients',       # Client management
    'apps.projects',      # Project tracking
    'apps.milestones',    # Project milestones and tasks
    'apps.documents',     # Document/file management
    'apps.approvals',     # Document approval workflows
    'apps.tickets',       # Support tickets
    'apps.communication', # Announcements, meetings, notifications
    'apps.assets_mgmt',   # IT asset management
    'apps.inventory',     # Inventory and stock management
    'apps.reports',       # Reports and audit logs
]

# ─────────────────────────────────────────────
# MIDDLEWARE
# ─────────────────────────────────────────────
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serves static files in production
    'corsheaders.middleware.CorsMiddleware',  # CORS must be near the top
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

# ─────────────────────────────────────────────
# URL CONFIGURATION
# ─────────────────────────────────────────────
ROOT_URLCONF = 'config.urls'

# ─────────────────────────────────────────────
# TEMPLATES
# ─────────────────────────────────────────────
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# ─────────────────────────────────────────────
# WSGI APPLICATION
# ─────────────────────────────────────────────
WSGI_APPLICATION = 'config.wsgi.application'

# ─────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────
# Uses DATABASE_URL if available (e.g. Render / Heroku Postgres), otherwise falls back to SQLite
import dj_database_url
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR / "db.sqlite3"}',
        conn_max_age=600
    )
}

# ─────────────────────────────────────────────
# PASSWORD VALIDATION
# ─────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ─────────────────────────────────────────────
# INTERNATIONALIZATION
# ─────────────────────────────────────────────
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ─────────────────────────────────────────────
# STATIC FILES
# ─────────────────────────────────────────────
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ─────────────────────────────────────────────
# MEDIA FILES (user uploads)
# ─────────────────────────────────────────────
MEDIA_URL = '/media/'                    # URL prefix for media files
MEDIA_ROOT = BASE_DIR / 'media'         # Physical folder where uploads are stored

# ─────────────────────────────────────────────
# DEFAULT AUTO FIELD
# ─────────────────────────────────────────────
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ─────────────────────────────────────────────
# DJANGO REST FRAMEWORK CONFIGURATION
# ─────────────────────────────────────────────
REST_FRAMEWORK = {
    # Use JWT tokens for authentication (not session cookies)
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    # All endpoints require authentication by default
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
}

# ─────────────────────────────────────────────
# SIMPLE JWT CONFIGURATION
# ─────────────────────────────────────────────
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=60),   # Access token expires in 60 minutes
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),       # Refresh token lasts 7 days
    'ROTATE_REFRESH_TOKENS': True,                     # Issue a new refresh token on each refresh
    'BLACKLIST_AFTER_ROTATION': True,                  # Old refresh tokens are blacklisted
    'AUTH_HEADER_TYPES': ('Bearer',),                  # Authorization: Bearer <token>
}

# ─────────────────────────────────────────────
# CORS CONFIGURATION
# ─────────────────────────────────────────────
# Allow all origins so Vercel frontend, local development, and mobile can communicate with the API
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True
