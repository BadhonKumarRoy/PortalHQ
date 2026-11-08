# ===== FILE EXPLANATION =====
# Helper utilities for audit logging across the PortalHQ platform.
# Captures security and operational events (logins, creates, updates, approvals).

from apps.reports.models import AuditLog


def log_action(user, action, entity_type, entity_id=None, description='', ip_address=None):
    """
    Safely creates an AuditLog record.
    Returns the created AuditLog instance, or None if logging failed.
    """
    try:
        authenticated_user = user if (user and getattr(user, 'is_authenticated', False)) else None
        return AuditLog.objects.create(
            user=authenticated_user,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            description=description,
            ip_address=ip_address
        )
    except Exception as e:
        # Logging should never crash the main application flow
        print(f"[AuditLog Error] Failed to log action {action} on {entity_type}: {e}")
        return None
