# ===== FILE EXPLANATION =====
# This is the main URL configuration for PortalHQ.
# It maps URL prefixes to each app's URL patterns.
# All API endpoints start with /api/ followed by the app name.
# Media files are also served here during development.

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static  # For serving media files in development

urlpatterns = [
    # Django admin panel — visit /admin/ in browser
    path('admin/', admin.site.urls),

    # ── Authentication & User Management ────────────────────────────────
    path('api/auth/', include('apps.accounts.urls')),

    # ── Core Business Apps ───────────────────────────────────────────────
    path('api/clients/', include('apps.clients.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/milestones/', include('apps.milestones.urls')),
    path('api/tasks/', include('apps.milestones.task_urls')),

    # ── Documents & Approvals ────────────────────────────────────────────
    path('api/documents/', include('apps.documents.urls')),
    path('api/approvals/', include('apps.approvals.urls')),

    # ── Support & Communication ──────────────────────────────────────────
    path('api/tickets/', include('apps.tickets.urls')),
    path('api/communication/', include('apps.communication.urls')),

    # ── Asset & Inventory Management ─────────────────────────────────────
    path('api/assets/', include('apps.assets_mgmt.urls')),
    path('api/inventory/', include('apps.inventory.urls')),

    # ── Reports & Audit ──────────────────────────────────────────────────
    path('api/reports/', include('apps.reports.urls')),
]

# In development, let Django serve uploaded media files
# In production, your web server (nginx, etc.) handles this instead
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
