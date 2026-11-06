# ===== FILE EXPLANATION =====
# Database model for the Client entity.
# A "Client" in PortalHQ represents a business or individual that the
# organization works with. Each client can optionally be linked to a
# User account so they can log in to the portal.

from django.db import models


class Client(models.Model):
    """
    Represents a client (customer) of the organization.

    Clients can have:
    - Contact information (name, email, phone, address)
    - A status (Active, Inactive, or Prospect)
    - An optional linked user account for portal login
    - Projects, documents, tickets, and assets associated with them
    """

    STATUS_CHOICES = [
        ('ACTIVE', 'Active'),       # Currently working with this client
        ('INACTIVE', 'Inactive'),   # No longer active
        ('PROSPECT', 'Prospect'),   # Potential client, not yet contracted
    ]

    # ── Contact Information ───────────────────────────────────────────────
    name = models.CharField(max_length=255)                # Primary contact person's name
    company_name = models.CharField(max_length=255)        # Company or organization name
    email = models.EmailField(unique=True)                  # Must be unique across all clients
    phone = models.CharField(max_length=20, blank=True)
    address = models.TextField(blank=True)

    # ── Business Information ──────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE'
    )
    industry = models.CharField(max_length=100, blank=True)   # e.g., "Healthcare", "Finance"
    website = models.URLField(blank=True)                      # Company website URL
    notes = models.TextField(blank=True)                       # Internal notes about this client

    # ── Portal Access ─────────────────────────────────────────────────────
    # Optional link to a User account — when set, the client can log into the portal
    user_account = models.OneToOneField(
        'accounts.User',
        on_delete=models.SET_NULL,  # If the user is deleted, don't delete the client
        null=True,
        blank=True,
        related_name='client_profile'  # Access via: user.client_profile
    )

    # ── Timestamps ────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)  # Set once at creation
    updated_at = models.DateTimeField(auto_now=True)       # Updated on every save

    class Meta:
        ordering = ['company_name']  # Sort alphabetically by company name

    def __str__(self):
        """Display the company name in admin and shell."""
        return self.company_name
