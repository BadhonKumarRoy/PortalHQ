# ===== FILE EXPLANATION =====
# Database models for the support ticket system.
# Clients can submit Tickets when they have issues or requests.
# Employees respond via TicketComments and update the status.

from django.db import models


class Ticket(models.Model):
    """
    Represents a support ticket submitted by a client or created internally.

    Ticket lifecycle:
    OPEN → ASSIGNED (employee takes it) → IN_PROGRESS → RESOLVED → CLOSED

    If more info is needed from the client: IN_PROGRESS → WAITING_CLIENT → IN_PROGRESS
    """

    STATUS_CHOICES = [
        ('OPEN', 'Open'),                       # Just submitted, unassigned
        ('ASSIGNED', 'Assigned'),               # Assigned to an employee
        ('IN_PROGRESS', 'In Progress'),         # Employee is actively working on it
        ('WAITING_CLIENT', 'Waiting for Client'),  # Need more info from client
        ('RESOLVED', 'Resolved'),               # Issue fixed
        ('CLOSED', 'Closed'),                   # Fully closed, no further action
    ]

    PRIORITY_CHOICES = [
        ('LOW', 'Low'),           # Minor issue, can wait
        ('MEDIUM', 'Medium'),     # Normal priority
        ('HIGH', 'High'),         # Needs attention soon
        ('CRITICAL', 'Critical'), # Production-breaking, needs immediate fix
    ]

    # ── Ticket Content ────────────────────────────────────────────────────
    title = models.CharField(max_length=255)
    description = models.TextField()

    # ── Status & Priority ─────────────────────────────────────────────────
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='OPEN')
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='MEDIUM')

    # ── Relationships ─────────────────────────────────────────────────────
    # Optional link to a project (some tickets are project-specific)
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='tickets'
    )

    # Which client this ticket belongs to
    client = models.ForeignKey(
        'clients.Client',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='tickets'
    )

    # Who created the ticket (could be a client or an employee on behalf of a client)
    created_by = models.ForeignKey(
        'accounts.User',
        related_name='created_tickets',
        on_delete=models.SET_NULL,
        null=True
    )

    # Which employee is handling this ticket
    assigned_to = models.ForeignKey(
        'accounts.User',
        related_name='assigned_tickets',
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    # ── Timestamps ────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.priority}] {self.title} — {self.status}"


class TicketComment(models.Model):
    """
    A comment/reply on a support ticket.
    Both employees and clients can post comments on a ticket.
    Comments serve as the conversation thread for resolving the issue.
    """

    # Which ticket this comment belongs to
    ticket = models.ForeignKey(
        Ticket,
        related_name='comments',  # Access via: ticket.comments.all()
        on_delete=models.CASCADE  # Delete comments if ticket is deleted
    )

    # Who wrote the comment
    author = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True
    )

    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']  # Oldest comments first (chronological thread)

    def __str__(self):
        return f"Comment by {self.author} on Ticket #{self.ticket_id}"
