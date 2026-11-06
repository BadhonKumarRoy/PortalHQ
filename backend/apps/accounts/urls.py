# ===== FILE EXPLANATION =====
# URL patterns for the accounts app.
# Maps URL paths to their corresponding view functions.
# All these URLs are prefixed with /api/auth/ (defined in config/urls.py).

from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView  # Built-in JWT refresh view

from apps.accounts.views import (
    LoginView,
    RegisterView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
)

urlpatterns = [
    # ── Authentication Endpoints ─────────────────────────────────────────
    path('login/', LoginView.as_view(), name='auth-login'),
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),

    # Refresh an expired access token using a valid refresh token
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),

    # ── Current User Profile ─────────────────────────────────────────────
    path('me/', MeView.as_view(), name='auth-me'),
    path('change-password/', ChangePasswordView.as_view(), name='auth-change-password'),

    # ── User Management (Admin Only) ─────────────────────────────────────
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
