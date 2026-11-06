# ===== FILE EXPLANATION =====
# Database model for Approvals.
# An Approval is a formal review request on a Document.
# Workflow: Employee uploads a document → requests approval → Client/Admin reviews it
# Status can be: PENDING → APPROVED / REJECTED / REVISION_NEEDED

from django.db import models


class Approval(models.Model):
    """
    Represents a document approval request.

    Approval workflow:
    1. An employee uploads a document and creates an Approval request.
    2. A reviewer (client or admin) looks at the document.
    3. Reviewer sets status to APPROVED, REJECTED, or REVISION_NEEDED.
    4. If REVISION_NEEDED, the employee updates the doc and requests again.

    Status choices:
    - PENDING: Waiting for review
    - APPROVED: Reviewer accepted it
    - REJECTED: Reviewer rejected it completely
    - REVISION_NEEDED: Reviewer wants changes before approving
    """

    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('REVISION_NEEDED', 'Revision Needed'),
    ]

    # Which document is being reviewed
    document = models.ForeignKey(
        'documents.Document',
        on_delete=models.CASCADE,  # Delete approval if document is deleted
        related_name='approvals'
    )

    # Who submitted the approval request
    requested_by = models.ForeignKey(
        'accounts.User',
        related_name='approval_requests',
        on_delete=models.SET_NULL,
        null=True
    )

    # Who reviewed the request (set when the review is submitted)
    reviewed_by = models.ForeignKey(
        'accounts.User',
        related_name='approval_reviews',
        on_delete=models.SET_NULL,
        null=True,
        blank=True  # Empty until someone actually reviews it
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING'
    )

    # Optional notes/feedback from the reviewer
    comments = models.TextField(blank=True)

    # Timestamps for the request and review events
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)  # Set when review is submitted

    class Meta:
        ordering = ['-requested_at']

    def __str__(self):
        return f"Approval for '{self.document.title}' — {self.status}"
