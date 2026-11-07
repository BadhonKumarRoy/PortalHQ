# ===== FILE EXPLANATION =====
# Serializers for the accounts app.
# Serializers convert Python objects (database models) to JSON (for API responses)
# and JSON back to Python objects (for saving to the database).
# Think of them as a "translator" between your database and your API.

from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User


class UserSerializer(serializers.ModelSerializer):
    """
    Full serializer for the User model.
    Used when returning user details in API responses and updating user accounts.
    Password is excluded from output for security.
    """
    is_master_admin = serializers.BooleanField(read_only=True)
    company_name = serializers.CharField(required=False, allow_blank=True, allow_null=True, write_only=True)
    client_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'phone', 'is_active', 'is_staff', 'is_superuser', 'is_master_admin',
            'company_name', 'client_id', 'date_joined'
        ]
        # These fields are returned but cannot be changed directly via basic user fields
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser', 'is_master_admin', 'client_id']

    def get_client_id(self, obj):
        profile = obj.get_client_profile() if hasattr(obj, 'get_client_profile') else getattr(obj, 'client_profile', None)
        return profile.id if profile else None

    def to_representation(self, instance):
        """Include the linked client's company name and client_id in the serialized output."""
        data = super().to_representation(instance)
        profile = instance.get_client_profile() if hasattr(instance, 'get_client_profile') else getattr(instance, 'client_profile', None)
        data['company_name'] = profile.company_name if profile else ''
        data['client_id'] = profile.id if profile else None
        return data

    def update(self, instance, validated_data):
        company_name = validated_data.pop('company_name', None)
        user = super().update(instance, validated_data)

        # Synchronize Client profile if this user has role CLIENT or has a linked client profile
        if user.role == 'CLIENT' or hasattr(user, 'client_profile') or (hasattr(user, 'get_client_profile') and user.get_client_profile()):
            from apps.clients.models import Client
            client = user.get_client_profile() if hasattr(user, 'get_client_profile') else getattr(user, 'client_profile', None)
            if client:
                client.name = user.full_name
                # Avoid email clash on Client
                if not Client.objects.filter(email__iexact=user.email).exclude(pk=client.pk).exists():
                    client.email = user.email
                if user.phone is not None:
                    client.phone = user.phone
                if company_name is not None and str(company_name).strip():
                    client.company_name = str(company_name).strip()
                client.status = 'ACTIVE' if user.is_active else 'INACTIVE'
                if client.user_account != user:
                    client.user_account = user
                client.save()
            elif user.role == 'CLIENT':
                comp = str(company_name).strip() if (company_name and str(company_name).strip()) else f"{user.full_name}'s Organization"
                Client.objects.create(
                    name=user.full_name,
                    company_name=comp,
                    email=user.email,
                    phone=user.phone or '',
                    status='ACTIVE' if user.is_active else 'INACTIVE',
                    user_account=user
                )
        return user


class RegisterSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new user account.
    Only admins can call the register endpoint.
    Password is write-only (never sent back in responses).
    """

    # write_only=True means the password will never appear in API responses
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ['email', 'full_name', 'password', 'role', 'phone']

    def create(self, validated_data):
        """
        Create a new user, ensuring the password is properly hashed.
        We use create_user() so Django hashes the password automatically.
        """
        # Extract password separately since it needs special handling
        password = validated_data.pop('password')

        # Create the user with our custom manager (which hashes the password)
        user = User.objects.create_user(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    """
    Serializer for the login endpoint.
    Accepts email and password, validates them, and returns the user.
    """

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)  # Never echo the password back

    def validate(self, data):
        """
        Check that the email and password are correct.
        Raises a validation error if credentials are invalid.

        Args:
            data (dict): Contains 'email' and 'password'.

        Returns:
            dict: The validated data with the user object added.
        """
        email = data.get('email')
        password = data.get('password')

        # Try to find a user with this email
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            # OWASP standard: Generic error message prevents email enumeration
            raise serializers.ValidationError('Invalid email or password.')

        # Check the password
        if not user.check_password(password):
            raise serializers.ValidationError('Invalid email or password.')

        # Check if the account is active
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated. Please contact your administrator.')

        # Attach the user to validated_data so the view can access it
        data['user'] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for changing the logged-in user's password.
    Requires the old password for security verification.
    """

    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        """
        Verify the new passwords match and the old password is correct.

        Args:
            data (dict): Contains old_password, new_password, confirm_password.

        Returns:
            dict: Validated data if everything checks out.
        """
        # Make sure new_password and confirm_password match
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError('New passwords do not match.')

        return data

    def validate_old_password(self, value):
        """
        Make sure the old password the user provided is correct.
        The 'request' is accessed via the serializer context.
        """
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Your current password is incorrect.')
        return value


class TokenResponseSerializer(serializers.Serializer):
    """
    Serializer for the response returned after a successful login.
    Combines the JWT tokens with the user's basic information.
    """
    access = serializers.CharField()   # JWT access token
    refresh = serializers.CharField()  # JWT refresh token
    user = UserSerializer()            # User details nested inside
