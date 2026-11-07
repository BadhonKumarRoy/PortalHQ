"""
Command to seed initial demo users and realistic testing data:
- Users & Clients:
  - admin@portalhq.com (Password: admin123) -> Organization Admin
  - employee@portalhq.com (Password: emp123) -> Staff / Employee
  - client@portalhq.com (Password: client123) -> Client (Apex Innovations Ltd.)
  - uits@client.com (Password: client123) -> Client (UITS Tech Systems)
- Projects:
  - Enterprise PortalHQ Modernization (Active, Milestones, Tasks)
  - Cloud Infrastructure Migration (Planned)
  - Mobile Client Companion App (Under Review)
- Milestones & Tasks
- Support Tickets & Comments
- Documents & Approval Requests
- Communication: Meetings, Announcements, and Notifications
"""
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files.base import ContentFile

from apps.accounts.models import User
from apps.clients.models import Client
from apps.projects.models import Project
from apps.milestones.models import Milestone, Task
from apps.tickets.models import Ticket, TicketComment
from apps.documents.models import Document
from apps.approvals.models import Approval
from apps.communication.models import Announcement, Meeting, Notification


class Command(BaseCommand):
    help = 'Seeds initial demo users and comprehensive testing entries for all portals'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting PortalHQ demo database seeding...'))

        # ─────────────────────────────────────────────────────────────
        # 1. CORE USERS
        # ─────────────────────────────────────────────────────────────
        # 1.1 Admin User
        admin_user, created = User.objects.get_or_create(
            email='admin@portalhq.com',
            defaults={
                'full_name': 'Sarah Admin',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(self.style.SUCCESS('Created Admin: admin@portalhq.com (Pass: admin123)'))
        else:
            self.stdout.write('Admin admin@portalhq.com ready.')

        # 1.2 Employee User
        emp_user, created = User.objects.get_or_create(
            email='employee@portalhq.com',
            defaults={
                'full_name': 'David Staff',
                'role': 'EMPLOYEE',
                'is_staff': True,
            }
        )
        if created:
            emp_user.set_password('emp123')
            emp_user.save()
            self.stdout.write(self.style.SUCCESS('Created Employee: employee@portalhq.com (Pass: emp123)'))
        else:
            self.stdout.write('Employee employee@portalhq.com ready.')

        # 1.3 Client User 1 (Apex Innovations)
        client_user, created = User.objects.get_or_create(
            email='client@portalhq.com',
            defaults={
                'full_name': 'Alex Johnson',
                'role': 'CLIENT',
            }
        )
        if created:
            client_user.set_password('client123')
            client_user.save()
            self.stdout.write(self.style.SUCCESS('Created Client: client@portalhq.com (Pass: client123)'))
        else:
            self.stdout.write('Client client@portalhq.com ready.')

        # 1.4 Client User 2 (UITS Tech Systems)
        uits_user, created = User.objects.get_or_create(
            email='uits@client.com',
            defaults={
                'full_name': 'Elena Rostova',
                'role': 'CLIENT',
            }
        )
        if created:
            uits_user.set_password('client123')
            uits_user.save()
            self.stdout.write(self.style.SUCCESS('Created Client: uits@client.com (Pass: client123)'))
        else:
            self.stdout.write('Client uits@client.com ready.')

        # ─────────────────────────────────────────────────────────────
        # 2. CLIENT PROFILES
        # ─────────────────────────────────────────────────────────────
        apex_client, _ = Client.objects.get_or_create(
            email='client@portalhq.com',
            defaults={
                'name': 'Alex Johnson',
                'company_name': 'Apex Innovations Ltd.',
                'phone': '+1 (555) 019-2834',
                'address': '742 Evergreen Terrace, Suite 400, Springfield',
                'status': 'ACTIVE',
                'industry': 'Financial Technology',
                'website': 'https://apexinnovations.example.com',
                'notes': 'Key enterprise account. Focus on portal automation and security compliance.',
                'user_account': client_user,
            }
        )
        if not apex_client.user_account:
            apex_client.user_account = client_user
            apex_client.save()

        uits_client, _ = Client.objects.get_or_create(
            email='uits@client.com',
            defaults={
                'name': 'Elena Rostova',
                'company_name': 'UITS Tech Systems',
                'phone': '+1 (555) 014-9821',
                'address': '1200 Innovation Parkway, Austin, TX',
                'status': 'ACTIVE',
                'industry': 'Enterprise Software',
                'website': 'https://uitstech.example.com',
                'notes': 'Partner firm building mobile companion application.',
                'user_account': uits_user,
            }
        )
        if not uits_client.user_account:
            uits_client.user_account = uits_user
            uits_client.save()

        # ─────────────────────────────────────────────────────────────
        # 3. PROJECTS
        # ─────────────────────────────────────────────────────────────
        today = date.today()

        # Project 1: PortalHQ Modernization (Active)
        p1, _ = Project.objects.get_or_create(
            title='Enterprise PortalHQ Modernization',
            client=apex_client,
            defaults={
                'description': 'Modernizing enterprise B2B workflows with custom dashboards, secure role-based portals, and live document tracking.',
                'status': 'IN_PROGRESS',
                'start_date': today - timedelta(days=35),
                'end_date': today + timedelta(days=45),
                'budget': 48500.00,
            }
        )
        p1.assigned_employees.add(emp_user)

        # Project 2: Cloud Infrastructure Migration (Planned)
        p2, _ = Project.objects.get_or_create(
            title='Cloud Infrastructure Migration',
            client=apex_client,
            defaults={
                'description': 'Migrating legacy monolithic services to containerized microservices and automated CI/CD pipeline.',
                'status': 'PLANNED',
                'start_date': today + timedelta(days=10),
                'end_date': today + timedelta(days=120),
                'budget': 62000.00,
            }
        )
        p2.assigned_employees.add(emp_user)

        # Project 3: Mobile Client Companion App (Under Review)
        p3, _ = Project.objects.get_or_create(
            title='Mobile Client Companion App',
            client=uits_client,
            defaults={
                'description': 'Cross-platform mobile application providing real-time approval queues and meeting notifications.',
                'status': 'UNDER_REVIEW',
                'start_date': today - timedelta(days=60),
                'end_date': today + timedelta(days=15),
                'budget': 35000.00,
            }
        )
        p3.assigned_employees.add(emp_user)

        # ─────────────────────────────────────────────────────────────
        # 4. MILESTONES & TASKS
        # ─────────────────────────────────────────────────────────────
        # Project 1 Milestones
        m1, _ = Milestone.objects.get_or_create(
            project=p1,
            title='Phase 1: Architecture & UI/UX Wireframes',
            defaults={
                'description': 'System architecture specification, database schema diagram, and Figma wireframes.',
                'due_date': today - timedelta(days=15),
                'is_completed': True,
            }
        )
        Task.objects.get_or_create(
            milestone=m1,
            title='Draft technical architecture diagram',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today - timedelta(days=20)}
        )
        Task.objects.get_or_create(
            milestone=m1,
            title='Design high-fidelity Figma prototypes for Admin & Client',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today - timedelta(days=16)}
        )

        m2, _ = Milestone.objects.get_or_create(
            project=p1,
            title='Phase 2: Core Dashboard & Document Management',
            defaults={
                'description': 'JWT authentication, role separation, and live document upload repository.',
                'due_date': today - timedelta(days=2),
                'is_completed': True,
            }
        )
        Task.objects.get_or_create(
            milestone=m2,
            title='Implement JWT authentication and role-based permissions',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today - timedelta(days=5)}
        )
        Task.objects.get_or_create(
            milestone=m2,
            title='Build document library and portal access visibility switch',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today - timedelta(days=3)}
        )

        m3, _ = Milestone.objects.get_or_create(
            project=p1,
            title='Phase 3: Client Approvals & Support Ticket Workflows',
            defaults={
                'description': 'Interactive approval decisions, SLA status indicators, and comment threads.',
                'due_date': today + timedelta(days=12),
                'is_completed': False,
            }
        )
        Task.objects.get_or_create(
            milestone=m3,
            title='Implement multi-step approval workflow with review actions',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today + timedelta(days=2)}
        )
        Task.objects.get_or_create(
            milestone=m3,
            title='Create interactive support ticket thread discussion',
            defaults={'is_done': False, 'assigned_to': emp_user, 'due_date': today + timedelta(days=6)}
        )
        Task.objects.get_or_create(
            milestone=m3,
            title='Perform client acceptance testing and security scan',
            defaults={'is_done': False, 'assigned_to': emp_user, 'due_date': today + timedelta(days=10)}
        )

        m4, _ = Milestone.objects.get_or_create(
            project=p1,
            title='Phase 4: Production Deployment & Handover',
            defaults={
                'description': 'Production deployment, SSL configuration, and administrator training.',
                'due_date': today + timedelta(days=40),
                'is_completed': False,
            }
        )
        Task.objects.get_or_create(
            milestone=m4,
            title='Configure production SSL and domain mapping',
            defaults={'is_done': False, 'assigned_to': emp_user, 'due_date': today + timedelta(days=30)}
        )
        Task.objects.get_or_create(
            milestone=m4,
            title='Deliver portal training manual and administrator credentials',
            defaults={'is_done': False, 'assigned_to': emp_user, 'due_date': today + timedelta(days=38)}
        )

        # Project 3 Milestone
        m_app, _ = Milestone.objects.get_or_create(
            project=p3,
            title='Beta Release & Client Acceptance',
            defaults={
                'description': 'Mobile build delivered for client review on TestFlight and Google Play Internal.',
                'due_date': today + timedelta(days=8),
                'is_completed': False,
            }
        )
        Task.objects.get_or_create(
            milestone=m_app,
            title='Distribute iOS build via TestFlight to Elena Rostova',
            defaults={'is_done': True, 'assigned_to': emp_user, 'due_date': today - timedelta(days=3)}
        )
        Task.objects.get_or_create(
            milestone=m_app,
            title='Collect client feedback and finalize release candidate',
            defaults={'is_done': False, 'assigned_to': emp_user, 'due_date': today + timedelta(days=7)}
        )

        # ─────────────────────────────────────────────────────────────
        # 5. DOCUMENTS & APPROVAL REQUESTS
        # ─────────────────────────────────────────────────────────────
        doc1, _ = Document.objects.get_or_create(
            title='PortalHQ Technical Architecture Specification v1.2',
            project=p1,
            client=apex_client,
            defaults={
                'category': 'DELIVERABLE',
                'version': '1.2',
                'uploaded_by': emp_user,
                'is_shared_with_client': True,
            }
        )
        if not doc1.file:
            doc1.file.save(
                'PortalHQ_Architecture_v1.2.txt',
                ContentFile(b'PortalHQ Technical Architecture Specification v1.2\nAuthor: David Staff\nStatus: Pending Review\n'),
                save=True
            )

        doc2, _ = Document.objects.get_or_create(
            title='Master Service Agreement & SLA 2026',
            project=p1,
            client=apex_client,
            defaults={
                'category': 'CONTRACT',
                'version': '1.0',
                'uploaded_by': admin_user,
                'is_shared_with_client': True,
            }
        )
        if not doc2.file:
            doc2.file.save(
                'MSA_SLA_2026.txt',
                ContentFile(b'Master Service Agreement & SLA 2026\nOrganization: PortalHQ\nClient: Apex Innovations Ltd.\n'),
                save=True
            )

        # Approval Request for doc1 (Pending review by client)
        Approval.objects.get_or_create(
            document=doc1,
            defaults={
                'requested_by': emp_user,
                'status': 'PENDING',
                'comments': 'Please review and approve the finalized architecture specification and database schema.',
            }
        )

        # Approval Request for doc2 (Approved)
        Approval.objects.get_or_create(
            document=doc2,
            defaults={
                'requested_by': admin_user,
                'reviewed_by': client_user,
                'status': 'APPROVED',
                'comments': 'Approved by Alex Johnson. SLA terms accepted.',
                'reviewed_at': timezone.now() - timedelta(days=10),
            }
        )

        # ─────────────────────────────────────────────────────────────
        # 6. SUPPORT TICKETS & COMMENTS
        # ─────────────────────────────────────────────────────────────
        t1, _ = Ticket.objects.get_or_create(
            title='Need assistance with API webhook integration',
            client=apex_client,
            project=p1,
            defaults={
                'description': 'We are configuring the webhook endpoint on our staging server but encountering 403 Forbidden errors when receiving payload events.',
                'status': 'IN_PROGRESS',
                'priority': 'HIGH',
                'created_by': client_user,
                'assigned_to': emp_user,
            }
        )
        TicketComment.objects.get_or_create(
            ticket=t1,
            author=client_user,
            content='Here is our callback endpoint: https://staging.apexinnovations.example.com/api/webhooks/',
        )
        TicketComment.objects.get_or_create(
            ticket=t1,
            author=emp_user,
            content='Thank you Alex! Please verify that your bearer secret matches the token displayed under Organization Settings -> Integrations.',
        )

        Ticket.objects.get_or_create(
            title='Request additional portal seat for technical lead',
            client=apex_client,
            defaults={
                'description': 'Please provision access for our incoming lead architect so they can monitor deliverables and participate in weekly reviews.',
                'status': 'OPEN',
                'priority': 'MEDIUM',
                'created_by': client_user,
            }
        )

        Ticket.objects.get_or_create(
            title='Billing clarification for Q3 deliverables',
            client=uits_client,
            project=p3,
            defaults={
                'description': 'Requesting itemized breakdown of milestones delivered during the month of September.',
                'status': 'RESOLVED',
                'priority': 'LOW',
                'created_by': uits_user,
                'assigned_to': emp_user,
            }
        )

        # ─────────────────────────────────────────────────────────────
        # 7. COMMUNICATIONS: MEETINGS, ANNOUNCEMENTS, NOTIFICATIONS
        # ─────────────────────────────────────────────────────────────
        # Meetings
        meet1, _ = Meeting.objects.get_or_create(
            title='Weekly Sprint Review & Roadmap Alignment',
            project=p1,
            defaults={
                'meeting_date': timezone.now() + timedelta(days=1, hours=3),
                'agenda': '1. Review Phase 3 milestone progress\n2. Inspect approval turnaround times\n3. Plan Phase 4 deployment schedule',
                'minutes': 'Action items: David Staff to finish support ticket comment threads; Alex Johnson to review pending design approval.',
            }
        )
        meet1.participants.set([admin_user, emp_user, client_user])

        meet2, _ = Meeting.objects.get_or_create(
            title='Project Kickoff: Cloud Migration',
            project=p2,
            defaults={
                'meeting_date': timezone.now() + timedelta(days=4, hours=2),
                'agenda': 'Review target VPC topology, IAM permission hierarchy, and failover requirements.',
                'minutes': 'Initial architectural planning session.',
            }
        )
        meet2.participants.set([admin_user, emp_user, client_user])

        meet3, _ = Meeting.objects.get_or_create(
            title='Mobile Companion App - Store Review Walkthrough',
            project=p3,
            defaults={
                'meeting_date': timezone.now() + timedelta(days=2, hours=5),
                'agenda': 'Review app screenshots, privacy policy disclosures, and test account provisioning for Apple reviewers.',
                'minutes': 'Pre-submission review session.',
            }
        )
        meet3.participants.set([admin_user, emp_user, uits_user])

        # Announcements
        Announcement.objects.get_or_create(
            title='PortalHQ System Maintenance Scheduled',
            created_by=admin_user,
            defaults={
                'content': 'Please note that PortalHQ will undergo routine performance optimizations on Sunday between 02:00 UTC and 03:00 UTC. No downtime is expected.',
                'target_audience': 'ALL',
            }
        )

        Announcement.objects.get_or_create(
            title='New Client Onboarding Guidelines',
            created_by=admin_user,
            defaults={
                'content': 'All staff members: please review the updated SOP for provisioning client credentials and attaching company projects in the Admin portal.',
                'target_audience': 'EMPLOYEES',
            }
        )

        Announcement.objects.get_or_create(
            title='Welcome to the PortalHQ Client Workspace',
            created_by=admin_user,
            defaults={
                'content': 'Welcome to your dedicated client portal. Here you can track active milestones, review deliverables, request approvals, and communicate with your project team in real time.',
                'target_audience': 'CLIENTS',
            }
        )

        # In-app Notifications
        Notification.objects.get_or_create(
            recipient=client_user,
            title='Approval Required',
            defaults={
                'message': "The document 'PortalHQ Technical Architecture Specification v1.2' is waiting for your review.",
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            recipient=emp_user,
            title='New Ticket Assignment',
            defaults={
                'message': "You were assigned to Ticket #1: 'Need assistance with API webhook integration'.",
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            recipient=admin_user,
            title='New Client Partner Onboarded',
            defaults={
                'message': "Client partner 'UITS Tech Systems' (Elena Rostova) was successfully onboarded.",
                'is_read': True,
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded full testing data across all portals!'))
