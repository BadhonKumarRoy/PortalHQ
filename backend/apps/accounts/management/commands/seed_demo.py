"""
Command to seed initial team members and realistic testing data:
- Team Members & Roles (1 Clean Account per Member):
  - Badhon -> Master Admin (badhon@portalhq.com, Pass: admin123)
  - Raghib -> Organization Admin (raghib@portalhq.com, Pass: admin123)
  - Khadija -> Employee / Staff (khadija@portalhq.com, Pass: emp123)
  - Zulkijlee -> Client (zulkijlee@client.com, Pass: client123, Apex Innovations Ltd.)
  - Elena Rostova -> Client (uits@client.com, Pass: client123, UITS Tech Systems)
- Projects:
  - Enterprise PortalHQ Modernization (Active, Milestones, Tasks - Assigned to Khadija)
  - Cloud Infrastructure Migration (Planned - Assigned to Khadija)
  - Mobile Client Companion App (Under Review - Assigned to Khadija)
- Milestones & Actionable Tasks
- Support Tickets & Real-Time Comments (Zulkijlee & Khadija)
- Documents & Approval Requests (Uploaded by Khadija, reviewed by Zulkijlee)
- Communication: Meetings, Announcements, and System Notifications
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
    help = 'Seeds team members (Badhon, Raghib, Khadija, Zulkijlee) and comprehensive testing entries without duplicates'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Starting PortalHQ demo database seeding with team members...'))

        # ─────────────────────────────────────────────────────────────
        # 1. CLEAN UP LEGACY DUPLICATE ACCOUNTS
        # ─────────────────────────────────────────────────────────────
        User.objects.filter(email__in=['admin@portalhq.com', 'employee@portalhq.com', 'client@portalhq.com']).delete()

        # ─────────────────────────────────────────────────────────────
        # 2. TEAM MEMBERS & CORE USERS (1 PER PERSON)
        # ─────────────────────────────────────────────────────────────
        # 2.1 Badhon - Master Admin
        badhon_user, _ = User.objects.get_or_create(
            email='badhon@portalhq.com',
            defaults={
                'full_name': 'Badhon',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        badhon_user.full_name = 'Badhon'
        badhon_user.role = 'ADMIN'
        badhon_user.is_staff = True
        badhon_user.is_superuser = True
        badhon_user.set_password('admin123')
        badhon_user.save()
        self.stdout.write(self.style.SUCCESS('Configured Master Admin: Badhon (badhon@portalhq.com, Pass: admin123)'))

        # 2.2 Raghib - Organization Admin
        raghib_user, _ = User.objects.get_or_create(
            email='raghib@portalhq.com',
            defaults={
                'full_name': 'Raghib',
                'role': 'ADMIN',
                'is_staff': True,
                'is_superuser': False,
            }
        )
        raghib_user.full_name = 'Raghib'
        raghib_user.role = 'ADMIN'
        raghib_user.is_staff = True
        raghib_user.set_password('admin123')
        raghib_user.save()
        self.stdout.write(self.style.SUCCESS('Configured Admin: Raghib (raghib@portalhq.com, Pass: admin123)'))

        # 2.3 Khadija - Employee / Staff Member
        khadija_user, _ = User.objects.get_or_create(
            email='khadija@portalhq.com',
            defaults={
                'full_name': 'Khadija',
                'role': 'EMPLOYEE',
                'is_staff': True,
            }
        )
        khadija_user.full_name = 'Khadija'
        khadija_user.role = 'EMPLOYEE'
        khadija_user.is_staff = True
        khadija_user.set_password('emp123')
        khadija_user.save()
        self.stdout.write(self.style.SUCCESS('Configured Employee: Khadija (khadija@portalhq.com, Pass: emp123)'))

        # 2.4 Zulkijlee - Client (Apex Innovations Ltd.)
        zulkijlee_user, _ = User.objects.get_or_create(
            email='zulkijlee@client.com',
            defaults={
                'full_name': 'Zulkijlee',
                'role': 'CLIENT',
            }
        )
        zulkijlee_user.full_name = 'Zulkijlee'
        zulkijlee_user.role = 'CLIENT'
        zulkijlee_user.set_password('client123')
        zulkijlee_user.save()
        self.stdout.write(self.style.SUCCESS('Configured Client: Zulkijlee (zulkijlee@client.com, Pass: client123)'))

        # 2.5 Client 2 - Elena Rostova (UITS Tech Systems)
        uits_user, _ = User.objects.get_or_create(
            email='uits@client.com',
            defaults={
                'full_name': 'Elena Rostova',
                'role': 'CLIENT',
            }
        )
        uits_user.set_password('client123')
        uits_user.save()

        # ─────────────────────────────────────────────────────────────
        # 3. CLIENT PROFILES
        # ─────────────────────────────────────────────────────────────
        # Clean up any legacy client record with old email
        Client.objects.filter(email='client@portalhq.com').delete()

        apex_client, _ = Client.objects.get_or_create(
            email='zulkijlee@client.com',
            defaults={
                'name': 'Zulkijlee',
                'company_name': 'Apex Innovations Ltd.',
                'phone': '+1 (555) 019-2834',
                'address': '742 Evergreen Terrace, Suite 400, Springfield',
                'status': 'ACTIVE',
                'industry': 'Financial Technology',
                'website': 'https://apexinnovations.example.com',
                'notes': 'Key enterprise account with Zulkijlee. Focus on portal automation and security compliance.',
                'user_account': zulkijlee_user,
            }
        )
        apex_client.name = 'Zulkijlee'
        apex_client.user_account = zulkijlee_user
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
        # 4. PROJECTS & ASSIGNED STAFF (KHADIJA)
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
                'created_by': badhon_user,
            }
        )
        p1.assigned_employees.set([khadija_user])

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
                'created_by': badhon_user,
            }
        )
        p2.assigned_employees.set([khadija_user])

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
                'created_by': raghib_user,
            }
        )
        p3.assigned_employees.set([khadija_user])

        # ─────────────────────────────────────────────────────────────
        # 5. MILESTONES & TASKS
        # ─────────────────────────────────────────────────────────────
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
            defaults={'is_done': True, 'assigned_to': khadija_user, 'due_date': today - timedelta(days=20)}
        )
        Task.objects.get_or_create(
            milestone=m1,
            title='Design high-fidelity Figma prototypes for Admin & Client',
            defaults={'is_done': True, 'assigned_to': khadija_user, 'due_date': today - timedelta(days=16)}
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
            defaults={'is_done': True, 'assigned_to': khadija_user, 'due_date': today - timedelta(days=5)}
        )
        Task.objects.get_or_create(
            milestone=m2,
            title='Build document library and portal access visibility switch',
            defaults={'is_done': True, 'assigned_to': khadija_user, 'due_date': today - timedelta(days=3)}
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
            defaults={'is_done': True, 'assigned_to': khadija_user, 'due_date': today + timedelta(days=2)}
        )
        Task.objects.get_or_create(
            milestone=m3,
            title='Create interactive support ticket thread discussion',
            defaults={'is_done': False, 'assigned_to': khadija_user, 'due_date': today + timedelta(days=6)}
        )
        Task.objects.get_or_create(
            milestone=m3,
            title='Perform client acceptance testing and security scan',
            defaults={'is_done': False, 'assigned_to': khadija_user, 'due_date': today + timedelta(days=10)}
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
            defaults={'is_done': False, 'assigned_to': khadija_user, 'due_date': today + timedelta(days=30)}
        )
        Task.objects.get_or_create(
            milestone=m4,
            title='Deliver portal training manual and administrator credentials',
            defaults={'is_done': False, 'assigned_to': khadija_user, 'due_date': today + timedelta(days=38)}
        )

        # ─────────────────────────────────────────────────────────────
        # 6. DOCUMENTS & APPROVAL REQUESTS
        # ─────────────────────────────────────────────────────────────
        doc1, _ = Document.objects.get_or_create(
            title='PortalHQ Technical Architecture Specification v1.2',
            project=p1,
            client=apex_client,
            defaults={
                'category': 'DELIVERABLE',
                'version': '1.2',
                'uploaded_by': khadija_user,
                'is_shared_with_client': True,
            }
        )
        if not doc1.file:
            doc1.file.save(
                'PortalHQ_Architecture_v1.2.txt',
                ContentFile(b'PortalHQ Technical Architecture Specification v1.2\nAuthor: Khadija\nClient: Zulkijlee (Apex Innovations)\nStatus: Pending Review\n'),
                save=True
            )

        doc2, _ = Document.objects.get_or_create(
            title='Master Service Agreement & SLA 2026',
            project=p1,
            client=apex_client,
            defaults={
                'category': 'CONTRACT',
                'version': '1.0',
                'uploaded_by': badhon_user,
                'is_shared_with_client': True,
            }
        )
        if not doc2.file:
            doc2.file.save(
                'MSA_SLA_2026.txt',
                ContentFile(b'Master Service Agreement & SLA 2026\nMaster Admin: Badhon\nClient: Zulkijlee (Apex Innovations Ltd.)\n'),
                save=True
            )

        # Approval Request for doc1 (Pending review by Zulkijlee)
        Approval.objects.get_or_create(
            document=doc1,
            defaults={
                'requested_by': khadija_user,
                'status': 'PENDING',
                'comments': 'Please review and approve the finalized architecture specification and database schema.',
            }
        )

        # Approval Request for doc2 (Approved by Zulkijlee)
        Approval.objects.get_or_create(
            document=doc2,
            defaults={
                'requested_by': badhon_user,
                'reviewed_by': zulkijlee_user,
                'status': 'APPROVED',
                'comments': 'Approved by Zulkijlee. SLA terms accepted.',
                'reviewed_at': timezone.now() - timedelta(days=10),
            }
        )

        # ─────────────────────────────────────────────────────────────
        # 7. SUPPORT TICKETS & COMMENTS (ZULKIJLEE & KHADIJA)
        # ─────────────────────────────────────────────────────────────
        t1, _ = Ticket.objects.get_or_create(
            title='Need assistance with API webhook integration',
            client=apex_client,
            project=p1,
            defaults={
                'description': 'We are configuring the webhook endpoint on our staging server but encountering 403 Forbidden errors when receiving payload events.',
                'status': 'IN_PROGRESS',
                'priority': 'HIGH',
                'created_by': zulkijlee_user,
                'assigned_to': khadija_user,
            }
        )
        TicketComment.objects.get_or_create(
            ticket=t1,
            author=zulkijlee_user,
            content='Here is our staging callback URL: https://staging.apexinnovations.example.com/api/webhooks/',
        )
        TicketComment.objects.get_or_create(
            ticket=t1,
            author=khadija_user,
            content='Hi Zulkijlee! Khadija here from the delivery team. Please verify that your bearer secret matches the secret key in your organization settings.',
        )

        Ticket.objects.get_or_create(
            title='Request additional portal seat for technical lead',
            client=apex_client,
            defaults={
                'description': 'Please provision access for our incoming lead architect so they can monitor deliverables and participate in weekly reviews.',
                'status': 'OPEN',
                'priority': 'MEDIUM',
                'created_by': zulkijlee_user,
            }
        )

        # ─────────────────────────────────────────────────────────────
        # 8. COMMUNICATIONS: MEETINGS, ANNOUNCEMENTS, NOTIFICATIONS
        # ─────────────────────────────────────────────────────────────
        meet1, _ = Meeting.objects.get_or_create(
            title='Weekly Sprint Review & Roadmap Alignment',
            project=p1,
            defaults={
                'meeting_date': timezone.now() + timedelta(days=1, hours=3),
                'agenda': '1. Review Phase 3 milestone progress\n2. Inspect approval turnaround times\n3. Plan Phase 4 deployment schedule',
                'minutes': 'Action items: Khadija to complete ticket comments; Zulkijlee to review pending architecture approval.',
            }
        )
        meet1.participants.set([badhon_user, raghib_user, khadija_user, zulkijlee_user])

        meet2, _ = Meeting.objects.get_or_create(
            title='Project Kickoff: Cloud Migration',
            project=p2,
            defaults={
                'meeting_date': timezone.now() + timedelta(days=4, hours=2),
                'agenda': 'Review target VPC topology, IAM permission hierarchy, and failover requirements.',
                'minutes': 'Initial architectural planning session with Badhon and Raghib.',
            }
        )
        meet2.participants.set([badhon_user, raghib_user, khadija_user, zulkijlee_user])

        # Announcements
        Announcement.objects.get_or_create(
            title='PortalHQ System Maintenance Scheduled',
            created_by=badhon_user,
            defaults={
                'content': 'Please note that PortalHQ will undergo routine performance optimizations on Sunday between 02:00 UTC and 03:00 UTC. No downtime is expected.',
                'target_audience': 'ALL',
            }
        )

        Announcement.objects.get_or_create(
            title='Delivery Guidelines & SOP',
            created_by=raghib_user,
            defaults={
                'content': 'Staff team: please review the updated SOP for milestone deliverables and task assignment tracking in the portal.',
                'target_audience': 'EMPLOYEES',
            }
        )

        Announcement.objects.get_or_create(
            title='Welcome to the PortalHQ Client Workspace',
            created_by=badhon_user,
            defaults={
                'content': 'Welcome Zulkijlee and the Apex Innovations team. Here you can track active milestones, review deliverables, request approvals, and communicate with your project team in real time.',
                'target_audience': 'CLIENTS',
            }
        )

        # Notifications
        Notification.objects.get_or_create(
            recipient=zulkijlee_user,
            title='Approval Required',
            defaults={
                'message': "The document 'PortalHQ Technical Architecture Specification v1.2' uploaded by Khadija is waiting for your review.",
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            recipient=khadija_user,
            title='New Ticket Assignment',
            defaults={
                'message': "Khadija, you were assigned to Ticket #1 from Zulkijlee: 'Need assistance with API webhook integration'.",
                'is_read': False,
            }
        )

        Notification.objects.get_or_create(
            recipient=badhon_user,
            title='Master Admin Dashboard Online',
            defaults={
                'message': "Welcome Badhon. All systems, audit logs, and team members (Raghib, Khadija, Zulkijlee) are active and synced.",
                'is_read': True,
            }
        )

        self.stdout.write(self.style.SUCCESS('Successfully seeded team members: Badhon (Master Admin), Raghib (Admin), Khadija (Employee), Zulkijlee (Client)!'))
