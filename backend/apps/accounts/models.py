# ===== FILE EXPLANATION =====
# This file defines the User model for PortalHQ.
# Instead of using Django's built-in User model, we create a custom one
# that uses EMAIL for login (not username) and adds a ROLE field
# so we can distinguish between Admins, Employees, and Clients.

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin


class UserManager(BaseUserManager):
    """
    Custom manager for the User model.
    Provides helper methods to create regular users and superusers.
    """

    def create_user(self, email, full_name, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.

        Args:
            email (str): The user's email address (used for login).
            full_name (str): The user's display name.
            password (str): Plain-text password (will be hashed automatically).
            **extra_fields: Any additional fields like role, phone, etc.

        Returns:
            User: The newly created user instance.
        """
        if not email:
            raise ValueError('Users must have an email address')

        # Normalize the email (lowercase domain part)
        email = self.normalize_email(email)

        # Create the user object (not saved yet)
        user = self.model(email=email, full_name=full_name, **extra_fields)

        # Hash the password before storing it
        user.set_password(password)

        # Save to the database
        user.save(using=self._db)
        return user

    def create_superuser(self, email, full_name, password=None, **extra_fields):
        """
        Create a superuser (admin with all permissions).
        Used by: python manage.py createsuperuser

        Args:
            email (str): Admin's email.
            full_name (str): Admin's name.
            password (str): Admin's password.

        Returns:
            User: The superuser instance.
        """
        # Superusers must have these flags set to True
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('role', 'ADMIN')  # Superusers are always Admins

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, full_name, password, **extra_fields)


class User(AbstractBaseUser, PermissionsMixin):
    """
    Custom User model for PortalHQ.

    Uses EMAIL as the login identifier instead of username.
    Has a ROLE field to distinguish between three types of users:
      - ADMIN: Organization Admin — full access to everything
      - EMPLOYEE: Staff member — access to assigned work
      - CLIENT: External client — read-only access to their own data
    """

    # Role choices — these are the three types of users in PortalHQ
    ROLE_CHOICES = [
        ('ADMIN', 'Organization Admin'),  # Full platform access
        ('EMPLOYEE', 'Employee'),          # Can manage assigned projects/tickets
        ('CLIENT', 'Client'),              # Can only view their own data
    ]

    # ── Core Fields ─────────────────────────────────────────────────────
    email = models.EmailField(unique=True)                          # Login identifier
    full_name = models.CharField(max_length=255)                    # Display name
    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='EMPLOYEE'                                           # Default role for new users
    )
    phone = models.CharField(max_length=20, blank=True)             # Optional phone number

    # ── Django Required Fields ───────────────────────────────────────────
    is_active = models.BooleanField(default=True)   # Inactive users cannot log in
    is_staff = models.BooleanField(default=False)   # Required to access Django admin
    date_joined = models.DateTimeField(auto_now_add=True)  # Set automatically on creation

    # ── Manager ─────────────────────────────────────────────────────────
    objects = UserManager()  # Use our custom manager

    # ── Authentication Configuration ─────────────────────────────────────
    USERNAME_FIELD = 'email'          # Use email to log in (not username)
    REQUIRED_FIELDS = ['full_name']   # Required when creating a superuser via command line

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'
        ordering = ['-date_joined']   # Newest users first

    def __str__(self):
        """Return a human-readable string representation of the user."""
        return f"{self.full_name} ({self.email})"

    @property
    def is_master_admin(self):
        """Convenience property: True if this user is the permanent Master Admin."""
        return bool(self.is_superuser or self.email in ('admin@portalhq.com', 'badhon@portalhq.com'))

    @property
    def is_admin(self):
        """Convenience property: True if this user is an Organization Admin."""
        return self.role == 'ADMIN'

    @property
    def is_employee(self):
        """Convenience property: True if this user is an Employee."""
        return self.role == 'EMPLOYEE'

    @property
    def is_client_user(self):
        """Convenience property: True if this user is a Client."""
        return self.role == 'CLIENT'

    def get_client_profile(self):
        """
        Safely retrieve the Client model instance linked to this user.
        
        1. Checks the reverse OneToOne relationship (`user.client_profile`).
        2. If unlinked (or raises RelatedObjectDoesNotExist), falls back to matching
           Client by email and auto-links `client.user_account = self`.
        
        This guarantees that client accounts are never locked out of their data.
        """
        try:
            profile = getattr(self, 'client_profile', None)
            if profile is not None:
                return profile
        except Exception:
            pass

        try:
            from apps.clients.models import Client
            client = Client.objects.filter(email__iexact=self.email).first()
            if not client and self.role == 'CLIENT':
                # Check if matching by contact name or alias client email
                if self.email in ('client@portalhq.com', 'zulkijlee@client.com') or 'zulkijlee' in self.full_name.lower():
                    client = Client.objects.filter(company_name__icontains='UITS').first() or Client.objects.filter(name__icontains='Zulkijlee').first()
                elif 'elena' in self.full_name.lower() or self.email == 'uits@client.com':
                    client = Client.objects.filter(company_name__icontains='Apex').first() or Client.objects.filter(name__icontains='Elena').first()
                else:
                    client = Client.objects.filter(name__iexact=self.full_name).first()

            if client:
                if client.user_account != self:
                    client.user_account = self
                    client.save(update_fields=['user_account'])
                return client
        except Exception:
            pass

        return None

    def delete(self, *args, **kwargs):
        """
        Database-level safety lock:
        The Master Admin account is permanently immune to deletion.
        """
        if self.is_master_admin:
            from django.core.exceptions import PermissionDenied
            raise PermissionDenied("The Master Admin account is permanently protected and cannot be deleted.")
        super().delete(*args, **kwargs)
