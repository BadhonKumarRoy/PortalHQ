# ===== FILE EXPLANATION =====
# Serializers for the milestones app.
# TaskSerializer is nested inside MilestoneSerializer so when you fetch
# a milestone, you also see all its tasks in the same response.

from rest_framework import serializers

from apps.milestones.models import Milestone, Task


class TaskSerializer(serializers.ModelSerializer):
    """
    Serializer for individual tasks within a milestone.
    Includes the assigned user's name for display.
    """

    # Show the name of the assigned employee (read-only display field)
    assigned_to_name = serializers.CharField(
        source='assigned_to.full_name',
        read_only=True
    )
    milestone_title = serializers.CharField(
        source='milestone.title',
        read_only=True
    )
    project_title = serializers.CharField(
        source='milestone.project.title',
        read_only=True
    )
    project_id = serializers.IntegerField(
        source='milestone.project.id',
        read_only=True
    )

    class Meta:
        model = Task
        fields = [
            'id', 'milestone', 'milestone_title', 'project_id', 'project_title',
            'title', 'is_done', 'assigned_to', 'assigned_to_name', 'due_date'
        ]
        read_only_fields = ['id', 'milestone_title', 'project_id', 'project_title']


class MilestoneSerializer(serializers.ModelSerializer):
    """
    Serializer for milestones, with tasks nested inside.
    When you GET a milestone, you see all its tasks too.
    When you POST/PUT a milestone, you only deal with the milestone itself.
    """

    # Nest all tasks inside the milestone response (read-only)
    tasks = TaskSerializer(many=True, read_only=True)

    # Show the project title for context
    project_title = serializers.CharField(source='project.title', read_only=True)

    class Meta:
        model = Milestone
        fields = [
            'id', 'project', 'project_title',
            'title', 'description', 'due_date', 'is_completed',
            'tasks',  # Nested tasks
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'tasks']
