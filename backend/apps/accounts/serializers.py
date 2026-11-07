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
    Used when returning user details in API responses.
    Password is excluded from output for security.
    """
    is_master_admin = serializers.BooleanField(read_only=True)

    class Meta:
        model = User
        fields = [
            'id', 'email', 'full_name', 'role',
            'phone', 'is_active', 'is_staff', 'is_superuser', 'is_master_admin', 'date_joined'
        ]
        # These fields are returned but cannot be changed via this serializer
        read_only_fields = ['id', 'date_joined', 'is_staff', 'is_superuser', 'is_master_admin']


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
