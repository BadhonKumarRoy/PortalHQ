# ===== FILE EXPLANATION =====
# API views for the reports app.
# Provides comprehensive operational analytics, executive BI data, audit logging, and CSV exports.

import csv
from decimal import Decimal
from django.http import HttpResponse
from django.utils import timezone
from django.db.models import Sum, Count, Q
from rest_framework import viewsets, permissions, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response

from apps.projects.models import Project
from apps.clients.models import Client
from apps.tickets.models import Ticket
from apps.approvals.models import Approval
from apps.milestones.models import Milestone, Task
from apps.documents.models import Document
from apps.accounts.permissions import IsAdmin, IsAdminOrEmployee
from .models import AuditLog
from .serializers import AuditLogSerializer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet for querying system audit trail logs.
    Admins see the entire organization log; other users see only their own actions.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['description', 'entity_type', 'user__full_name', 'user__email', 'action']
    ordering_fields = ['created_at', 'action', 'entity_type']
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        qs = AuditLog.objects.select_related('user').all()

        # Non-admins only see actions performed by themselves
        if getattr(user, 'role', '') != 'ADMIN':
            qs = qs.filter(user=user)

        # Filter by action if requested (?action=LOGIN)
        action_param = self.request.query_params.get('action')
        if action_param and action_param != 'All':
            qs = qs.filter(action=action_param)

        return qs.order_by('-created_at')


class AnalyticsView(APIView):
    """
    GET /api/reports/analytics/
    Returns high-level business intelligence, portfolio health, task velocities,
    ticket SLAs, and client distributions for the Reports dashboard.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrEmployee]

    def get(self, request):
        # 1. Projects Statistics
        total_projects = Project.objects.count()
        active_projects = Project.objects.filter(status__in=['IN_PROGRESS', 'ACTIVE']).count()
        planned_projects = Project.objects.filter(status='PLANNED').count()
        under_review_projects = Project.objects.filter(status='UNDER_REVIEW').count()
        on_hold_projects = Project.objects.filter(status='ON_HOLD').count()
        completed_projects = Project.objects.filter(status='COMPLETED').count()

        total_budget_agg = Project.objects.aggregate(total=Sum('budget'))['total'] or Decimal('0.00')

        # 2. Milestones & Tasks Velocity
        total_tasks = Task.objects.count()
        completed_tasks = Task.objects.filter(is_done=True).count()
        pending_tasks = total_tasks - completed_tasks
        task_completion_rate = round((completed_tasks / total_tasks * 100), 1) if total_tasks > 0 else 0.0

        # 3. Support Tickets & SLA
        total_tickets = Ticket.objects.count()
        open_tickets = Ticket.objects.filter(status__in=['OPEN', 'IN_PROGRESS', 'ASSIGNED', 'WAITING_CLIENT']).count()
        resolved_tickets = Ticket.objects.filter(status__in=['RESOLVED', 'CLOSED']).count()

        tickets_by_priority = {
            'CRITICAL': Ticket.objects.filter(priority='CRITICAL').count(),
            'HIGH': Ticket.objects.filter(priority='HIGH').count(),
            'MEDIUM': Ticket.objects.filter(priority='MEDIUM').count(),
            'LOW': Ticket.objects.filter(priority='LOW').count(),
        }

        tickets_by_status = {
            'OPEN': Ticket.objects.filter(status='OPEN').count(),
            'IN_PROGRESS': Ticket.objects.filter(status='IN_PROGRESS').count(),
            'WAITING_CLIENT': Ticket.objects.filter(status='WAITING_CLIENT').count(),
            'RESOLVED': Ticket.objects.filter(status='RESOLVED').count(),
            'CLOSED': Ticket.objects.filter(status='CLOSED').count(),
        }

        # 4. Approvals & Deliverables
        total_approvals = Approval.objects.count()
        pending_approvals = Approval.objects.filter(status='PENDING').count()
        approved_count = Approval.objects.filter(status='APPROVED').count()
        rejected_count = Approval.objects.filter(status__in=['REJECTED', 'REVISION_NEEDED']).count()
        total_documents = Document.objects.count()

        # 5. Client Portfolio Breakdown
        clients_data = []
        for client in Client.objects.all():
            client_projects = Project.objects.filter(client=client)
            client_budget = client_projects.aggregate(total=Sum('budget'))['total'] or Decimal('0.00')
            client_open_tickets = Ticket.objects.filter(client=client, status__in=['OPEN', 'IN_PROGRESS']).count()
            clients_data.append({
                'id': client.id,
                'name': client.name,
                'company_name': client.company_name,
                'email': client.email,
                'status': client.status,
                'projects_count': client_projects.count(),
                'total_budget': float(client_budget),
                'open_tickets_count': client_open_tickets,
            })

        # 6. Detailed Projects Table with Milestone Progress
        projects_table = []
        for p in Project.objects.select_related('client').prefetch_related('assigned_employees', 'milestones__tasks'):
            all_milestones = p.milestones.all()
            p_tasks = []
            for m in all_milestones:
                p_tasks.extend(m.tasks.all())
            p_total_tasks = len(p_tasks)
            p_done_tasks = len([t for t in p_tasks if t.is_done])
            progress_pct = round((p_done_tasks / p_total_tasks * 100)) if p_total_tasks > 0 else (
                100 if p.status == 'COMPLETED' else (50 if p.status in ('IN_PROGRESS', 'UNDER_REVIEW') else 0)
            )

            projects_table.append({
                'id': p.id,
                'title': p.title,
                'client_name': p.client.company_name if p.client else 'Unassigned',
                'status': p.status,
                'budget': float(p.budget) if p.budget else 0.0,
                'start_date': str(p.start_date) if p.start_date else None,
                'end_date': str(p.end_date) if p.end_date else None,
                'assigned_count': p.assigned_employees.count(),
                'total_tasks': p_total_tasks,
                'completed_tasks': p_done_tasks,
                'progress_percent': progress_pct,
            })

        # 7. Recent Audit Trail Entries (Top 15)
        recent_audits = AuditLog.objects.select_related('user').order_by('-created_at')[:15]
        audits_serialized = AuditLogSerializer(recent_audits, many=True).data

        return Response({
            'summary': {
                'total_projects': total_projects,
                'active_projects': active_projects,
                'planned_projects': planned_projects,
                'under_review_projects': under_review_projects,
                'on_hold_projects': on_hold_projects,
                'completed_projects': completed_projects,
                'total_budget': float(total_budget_agg),
                'total_tasks': total_tasks,
                'completed_tasks': completed_tasks,
                'pending_tasks': pending_tasks,
                'task_completion_rate': task_completion_rate,
                'total_tickets': total_tickets,
                'open_tickets': open_tickets,
                'resolved_tickets': resolved_tickets,
                'total_approvals': total_approvals,
                'pending_approvals': pending_approvals,
                'approved_count': approved_count,
                'rejected_count': rejected_count,
                'total_clients': Client.objects.count(),
                'total_documents': total_documents,
            },
            'project_status_breakdown': [
                {'status': 'PLANNED', 'label': 'Planned', 'count': planned_projects},
                {'status': 'IN_PROGRESS', 'label': 'In Progress', 'count': active_projects},
                {'status': 'UNDER_REVIEW', 'label': 'Under Review', 'count': under_review_projects},
                {'status': 'ON_HOLD', 'label': 'On Hold', 'count': on_hold_projects},
                {'status': 'COMPLETED', 'label': 'Completed', 'count': completed_projects},
            ],
            'clients_portfolio': clients_data,
            'projects_table': projects_table,
            'tickets_by_priority': tickets_by_priority,
            'tickets_by_status': tickets_by_status,
            'recent_audits': audits_serialized,
        })


class ExportReportView(APIView):
    """
    GET /api/reports/export/?type=projects|tickets|clients|audit
    Exports operational data in CSV format for offline reporting and spreadsheet analysis.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminOrEmployee]

    def get(self, request):
        export_type = request.query_params.get('type', 'projects').lower()
        timestamp = timezone.now().strftime("%Y%m%d_%H%M%S")
        filename = f"portalhq_{export_type}_{timestamp}.csv"

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)

        if export_type == 'projects':
            writer.writerow(['ID', 'Project Title', 'Client', 'Status', 'Start Date', 'End Date', 'Budget ($)', 'Staff Count'])
            for p in Project.objects.select_related('client').prefetch_related('assigned_employees').all():
                writer.writerow([
                    p.id,
                    p.title,
                    p.client.company_name if p.client else '',
                    p.status,
                    p.start_date or '',
                    p.end_date or '',
                    p.budget or 0,
                    p.assigned_employees.count(),
                ])

        elif export_type == 'tickets':
            writer.writerow(['Ticket ID', 'Title', 'Client', 'Priority', 'Status', 'Assigned To', 'Created Date'])
            for t in Ticket.objects.select_related('client', 'assigned_to').all():
                writer.writerow([
                    f"#{t.id}",
                    t.title,
                    t.client.company_name if t.client else 'General',
                    t.priority,
                    t.status,
                    t.assigned_to.full_name if t.assigned_to else 'Unassigned',
                    t.created_at.strftime("%Y-%m-%d %H:%M") if t.created_at else '',
                ])

        elif export_type == 'clients':
            writer.writerow(['Client ID', 'Company Name', 'Primary Contact', 'Email', 'Phone', 'Status', 'Industry', 'Total Projects', 'Total Budget ($)'])
            for c in Client.objects.all():
                c_projects = Project.objects.filter(client=c)
                total_b = c_projects.aggregate(total=Sum('budget'))['total'] or 0
                writer.writerow([
                    c.id,
                    c.company_name,
                    c.name,
                    c.email,
                    c.phone,
                    c.status,
                    c.industry or '',
                    c_projects.count(),
                    total_b,
                ])

        elif export_type == 'audit':
            writer.writerow(['ID', 'Timestamp', 'User', 'Email', 'Action', 'Entity Type', 'Entity ID', 'Description', 'IP Address'])
            for a in AuditLog.objects.select_related('user').order_by('-created_at')[:500]:
                writer.writerow([
                    a.id,
                    a.created_at.strftime("%Y-%m-%d %H:%M:%S") if a.created_at else '',
                    a.user.full_name if a.user else 'System',
                    a.user.email if a.user else '',
                    a.action,
                    a.entity_type,
                    a.entity_id or '',
                    a.description,
                    a.ip_address or '',
                ])
        else:
            return Response({'error': f"Unknown export type '{export_type}'. Choose from 'projects', 'tickets', 'clients', 'audit'."}, status=status.HTTP_400_BAD_REQUEST)

        return response
