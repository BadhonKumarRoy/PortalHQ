# ===== FILE EXPLANATION =====
# Database models for the communication app.
# Contains three models:
#   Announcement: broadcast messages to clients, employees, or everyone
#   Meeting: scheduled meeting records with agendas and minutes
#   Notification: in-app notifications sent to individual users

from django.db import models


class Announcement(models.Model):
    """
    A broadcast message sent to users by an admin.
    Can target all users, only clients, or only employees.
    Example: "System maintenance on Friday at 10pm"
    """

    TARGET_CHOICES = [
        ('ALL', 'All'),                     # Everyone sees this
        ('CLIENTS', 'Clients Only'),         # Only client users see this
        ('EMPLOYEES', 'Employees Only'),     # Only employee users see this
    ]

    title = models.CharField(max_length=255)
    content = models.TextField()
    target_audience = models.CharField(
        max_length=20,
        choices=TARGET_CHOICES,
        default='ALL'
    )

    # Who posted this announcement (admin or employee)
    created_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='announcements'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} → {self.target_audience}"


class Meeting(models.Model):
    """
    Represents a scheduled meeting between team members and/or clients.
    Stores agenda and meeting minutes (notes taken during the meeting).
    """

    title = models.CharField(max_length=255)
    agenda = models.TextField(blank=True)   # Topics to be discussed

    # All users attending this meeting (employees and clients)
    participants = models.ManyToManyField(
        'accounts.User',
        blank=True,
        related_name='meetings'
    )

    # Optional link to a project this meeting is about
    project = models.ForeignKey(
        'projects.Project',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name='meetings'
    )

    meeting_date = models.DateTimeField()           # When the meeting is scheduled
    minutes = models.TextField(blank=True)          # Notes taken during the meeting
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-meeting_date']

    def __str__(self):
        return f"{self.title} — {self.meeting_date.strftime('%Y-%m-%d %H:%M')}"


class Notification(models.Model):
    """
    An in-app notification sent to a specific user.
    Example: "Your ticket has been resolved", "New document uploaded for your project"
    """

    # Who this notification is for
    recipient = models.ForeignKey(
        'accounts.User',
        related_name='notifications',
        on_delete=models.CASCADE  # Delete notifications if the user is deleted
    )

    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)  # Becomes True when user reads it
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']  # Newest notifications first

    def __str__(self):
        read_status = "✓" if self.is_read else "●"
        return f"{read_status} [{self.recipient}] {self.title}"
