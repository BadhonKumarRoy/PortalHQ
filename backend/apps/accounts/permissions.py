# ===== FILE EXPLANATION =====
# Custom permission classes for PortalHQ.
# These are used in views to restrict access based on the user's role.
# Example usage in a view: permission_classes = [IsAdmin]

from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Allow access only to users with the ADMIN role.
    Used for administrative operations like creating users and clients.
    """

    def has_permission(self, request, view):
        """Return True only if the logged-in user is an Organization Admin."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )


class IsEmployee(BasePermission):
    """
    Allow access only to users with the EMPLOYEE role.
    Used for employee-specific operations.
    """

    def has_permission(self, request, view):
        """Return True only if the logged-in user is an Employee."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'EMPLOYEE'
        )


class IsClient(BasePermission):
    """
    Allow access only to users with the CLIENT role.
    Clients can only view data related to their own account.
    """

    def has_permission(self, request, view):
        """Return True only if the logged-in user is a Client."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'CLIENT'
        )


class IsAdminOrEmployee(BasePermission):
    """
    Allow access to users who are either ADMIN or EMPLOYEE.
    Used for internal team operations (clients are excluded).
    """

    def has_permission(self, request, view):
        """Return True if the user is an Admin or an Employee."""
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role in ('ADMIN', 'EMPLOYEE')
        )


class IsAdminOrReadOnly(BasePermission):
    """
    Allow read access to anyone authenticated.
    Allow write access (POST, PUT, PATCH, DELETE) only to Admins.
    """

    def has_permission(self, request, view):
        """Allow safe (read) methods for all; restrict writes to Admins."""
        # GET, HEAD, OPTIONS are always allowed for authenticated users
        if request.method in ('GET', 'HEAD', 'OPTIONS'):
            return request.user and request.user.is_authenticated

        # Write operations (create, update, delete) are Admin-only
        return (
            request.user
            and request.user.is_authenticated
            and request.user.role == 'ADMIN'
        )
