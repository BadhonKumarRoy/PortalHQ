# ===== FILE EXPLANATION =====
# API views for the approvals app.
# Employees can create approval requests; Admins/Clients can review them.

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.approvals.models import Approval
from apps.approvals.serializers import ApprovalSerializer
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee


class ApprovalViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Approval CRUD.

    Employees create approval requests.
    Admins and Clients can review (approve/reject/request revisions).

    Custom action:
        POST /api/approvals/<id>/review/ — Submit a review decision
    """

    permission_classes = [IsAuthenticated]
    serializer_class = ApprovalSerializer

    def get_queryset(self):
        """
        Filter approvals by user role.
        """
        user = self.request.user

        if user.role == 'ADMIN':
            return Approval.objects.all().select_related('document', 'requested_by', 'reviewed_by')

        elif user.role == 'EMPLOYEE':
            # Employees see approvals they requested
            return Approval.objects.filter(
                requested_by=user
            ).select_related('document', 'requested_by', 'reviewed_by')

        elif user.role == 'CLIENT':
            # Clients see approvals for their documents
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                return Approval.objects.filter(
                    document__client=client
                ).select_related('document', 'requested_by', 'reviewed_by')

        return Approval.objects.none()

    def get_permissions(self):
        """Create: Employees/Admins only. Delete: Admin only."""
        if self.action == 'create':
            return [IsAuthenticated(), IsAdminOrEmployee()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdmin()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Automatically set the requester to the current user."""
        serializer.save(requested_by=self.request.user)

    @action(detail=True, methods=['post', 'patch'], url_path='review')
    def review(self, request, pk=None):
        """
        POST /api/approvals/<id>/review/
        Submit a review decision for an approval request.

        Request body:
            { "status": "APPROVED", "comments": "Looks great!" }
        """
        approval = self.get_object()

        # Get the new status from the request body
        new_status = request.data.get('status')
        comments = request.data.get('comments', '')

        # Validate the status value
        valid_statuses = ['APPROVED', 'REJECTED', 'REVISION_NEEDED']
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Choose from: {valid_statuses}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update the approval record
        approval.status = new_status
        approval.comments = comments
        approval.reviewed_by = request.user   # Record who did the review
        approval.reviewed_at = timezone.now() # Record when the review happened
        approval.save()

        return Response(
            ApprovalSerializer(approval).data,
            status=status.HTTP_200_OK
        )
