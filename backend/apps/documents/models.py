# ===== FILE EXPLANATION =====
# Database model for Documents.
# Documents are uploaded files (PDFs, Word docs, images, etc.) associated
# with projects or clients. They can optionally be shared with clients.
# File uploads are stored in the 'media/documents/YEAR/MONTH/' folder.

from django.db import models


class Document(models.Model):
    """
    Represents an uploaded file/document in PortalHQ.

    Documents can be:
    - Deliverables: work products given to clients
    - Contracts: legal agreements
    - Reports: status or financial reports
    - Other: anything else

    A document can be linked to a project, a client, or both.
    When 'is_shared_with_client' is True, the client can see it.
    """

    CATEGORY_CHOICES = [
        ('DELIVERABLE', 'Deliverable'),  # Finished work product
        ('CONTRACT', 'Contract'),         # Legal agreement
        ('REPORT', 'Report'),             # Status or financial report
        ('OTHER', 'Other'),               # Anything else
    ]

    # ── Document Info ─────────────────────────────────────────────────────
    title = models.CharField(max_length=255)

    # FileField stores the file on disk and saves the path in the DB
    # Files go to: media/documents/YEAR/MONTH/filename
    file = models.FileField(upload_to='documents/%Y/%m/')

    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default='OTHER'
    )
    version = models.CharField(max_length=20, default='1.0')  # e.g., "1.0", "2.3"

    # ── Relationships ─────────────────────────────────────────────────────
    # Optional link to a project
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,  # Keep the document if the project is deleted
        related_name='documents'
    )

    # Optional link to a client
    client = models.ForeignKey(
        'clients.Client',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='documents'
    )

    # Who uploaded this file
    uploaded_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploaded_documents'
    )

    # ── Visibility ────────────────────────────────────────────────────────
    # Controls whether this document is visible to the client in the portal
    is_shared_with_client = models.BooleanField(default=False)

    # ── Timestamps ────────────────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} (v{self.version})"
