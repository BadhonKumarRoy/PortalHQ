# ===== FILE EXPLANATION =====
# Database models for Milestones and Tasks.
# A Milestone is a major checkpoint within a Project (e.g., "Design Phase Complete").
# A Task is a small to-do item within a Milestone (e.g., "Create wireframes").

from django.db import models


class Milestone(models.Model):
    """
    Represents a major milestone within a project.
    Think of it as a checkpoint — a significant deliverable or phase.

    Example: "Beta Launch", "Client Review", "Final Delivery"
    """

    # Which project this milestone belongs to
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,     # Delete milestones when the project is deleted
        related_name='milestones'     # Access via: project.milestones.all()
    )

    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)  # Mark as done when achieved
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['due_date', 'created_at']

    def __str__(self):
        return f"{self.title} ({self.project.title})"


class Task(models.Model):
    """
    Represents a small, actionable task within a Milestone.
    Tasks are the most granular unit of work in PortalHQ.

    Example: "Write unit tests", "Review pull request", "Send invoice"
    """

    # Which milestone this task belongs to
    milestone = models.ForeignKey(
        Milestone,
        on_delete=models.CASCADE,  # Delete tasks when their milestone is deleted
        related_name='tasks'       # Access via: milestone.tasks.all()
    )

    title = models.CharField(max_length=255)
    is_done = models.BooleanField(default=False)  # True when the task is completed

    # Which employee is responsible for this task (optional)
    assigned_to = models.ForeignKey(
        'accounts.User',
        null=True,
        blank=True,
        on_delete=models.SET_NULL,  # Keep the task if the user is deleted
        related_name='tasks'
    )

    due_date = models.DateField(null=True, blank=True)

    class Meta:
        ordering = ['due_date', 'id']

    def __str__(self):
        status = "✓" if self.is_done else "○"
        return f"{status} {self.title}"
