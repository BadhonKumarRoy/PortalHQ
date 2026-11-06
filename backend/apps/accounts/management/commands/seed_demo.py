"""
Command to seed initial demo users:
- admin@portalhq.com (Password: admin123) -> Organization Admin
- employee@portalhq.com (Password: emp123) -> Staff / Employee
- client@portalhq.com (Password: client123) -> Client
"""
from django.core.management.base import BaseCommand
from apps.accounts.models import User
from apps.clients.models import Client

class Command(BaseCommand):
    help = 'Seeds initial demo users for testing'

    def handle(self, *args, **options):
        # 1. Admin
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
            self.stdout.write('Admin already exists.')

        # 2. Employee
        emp_user, created = User.objects.get_or_create(
            email='employee@portalhq.com',
            defaults={
                'full_name': 'David Staff',
                'role': 'EMPLOYEE',
            }
        )
        if created:
            emp_user.set_password('emp123')
            emp_user.save()
            self.stdout.write(self.style.SUCCESS('Created Employee: employee@portalhq.com (Pass: emp123)'))

        # 3. Client user + Client profile
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
            Client.objects.get_or_create(
                user_account=client_user,
                defaults={
                    'name': 'Alex Johnson',
                    'company_name': 'Apex Innovations Ltd.',
                    'email': 'client@portalhq.com',
                    'status': 'ACTIVE',
                }
            )
            self.stdout.write(self.style.SUCCESS('Created Client: client@portalhq.com (Pass: client123)'))
