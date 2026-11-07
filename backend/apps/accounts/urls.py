# ===== FILE EXPLANATION =====
# URL patterns for the accounts app.
# Maps URL paths to their corresponding view functions.
# All these URLs are prefixed with /api/auth/ (defined in config/urls.py).

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
    AdminResetPasswordView,
)

urlpatterns = [
    # ── Authentication Endpoints ─────────────────────────────────────────
    path('login/', LoginView.as_view(), name='auth-login'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── Current User Profile ─────────────────────────────────────────────
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),

    # ── User Management (Admin Only) ─────────────────────────────────────
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
    path('users/<int:pk>/reset-password/', AdminResetPasswordView.as_view(), name='user-reset-password'),
]
