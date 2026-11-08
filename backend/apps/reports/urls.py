# ===== FILE EXPLANATION =====
# URL configuration for the reports app.
# Routes:
#   - /api/reports/analytics/    → AnalyticsView (aggregated BI and portfolio KPIs)
#   - /api/reports/export/       → ExportReportView (CSV file download)
#   - /api/reports/audit-logs/   → AuditLogViewSet (list / filter audit records)

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuditLogViewSet, AnalyticsView, ExportReportView

router = DefaultRouter()
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')

urlpatterns = [
    path('analytics/', AnalyticsView.as_view(), name='reports-analytics'),
    path('export/', ExportReportView.as_view(), name='reports-export'),
    path('', include(router.urls)),
]
