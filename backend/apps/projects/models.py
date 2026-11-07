# ===== FILE EXPLANATION =====
# Database model for Projects.
# A project is the main unit of work in PortalHQ.
# Each project belongs to a client and can have employees assigned to it.
# Projects track status, dates, budget, and are linked to milestones,
# documents, tickets, and meetings.

from django.db import models


class Project(models.Model):
    """
    Represents a work project in PortalHQ.

    Projects are the central hub that connects:
    - Clients (who the work is for)
    - Employees (who is doing the work)
    - Milestones, tasks, documents, tickets, and meetings

    Status flow: PLANNED → ACTIVE → UNDER_REVIEW → COMPLETED
    """

    STATUS_CHOICES = [
        ('PLANNED', 'Planned'),           # Project created but not started
        ('ACTIVE', 'Active'),             # Currently in progress
        ('IN_PROGRESS', 'In Progress'),   # In progress
        ('ON_HOLD', 'On Hold'),           # Temporarily paused
        ('UNDER_REVIEW', 'Under Review'), # Work submitted, awaiting approval
        ('COMPLETED', 'Completed'),       # All work done and accepted
        ('CANCELLED', 'Cancelled'),       # Project cancelled before completion
    ]

    # ── Core Fields ───────────────────────────────────────────────────────
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)

    # Which client this project is for
    client = models.ForeignKey(
        'clients.Client',
        on_delete=models.CASCADE,     # If a client is deleted, delete their projects too
        related_name='projects'       # Access via: client.projects.all()
    )

    # Employees working on this project (many employees can work on one project)
    assigned_employees = models.ManyToManyField(
        'accounts.User',
        blank=True,                      # A project can exist with no employees yet
        related_name='assigned_projects' # Access via: user.assigned_projects.all()
    )

    # ── Status & Timeline ─────────────────────────────────────────────────
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PLANNED')
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)

    # ── Financial ─────────────────────────────────────────────────────────
    budget = models.DecimalField(
        max_digits=12,       # Up to 10 digits before the decimal
        decimal_places=2,    # 2 decimal places (e.g., 50000.00)
        null=True,
        blank=True
    )

    # ── Tracking ──────────────────────────────────────────────────────────
    # Who created this project (if they're deleted, we keep the project)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='created_projects'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']  # Newest projects first

    def __str__(self):
        """Display the project title in admin and shell."""
        return self.title
