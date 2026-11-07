# ===== FILE EXPLANATION =====
# API views for the accounts app.
# These views handle user authentication (login, logout)
# and secure user management (listing team members, promoting/demoting, password resets).
# Everything includes beginner-friendly comments and enterprise security best practices.

import random
from rest_framework import status, generics, exceptions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.throttling import AnonRateThrottle

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
)
from apps.accounts.permissions import IsAdmin


class LoginRateThrottle(AnonRateThrottle):
    """
    Brute-force protection:
    Limits unauthenticated login attempts to 5 per minute per IP address.
    Stops automated password guessing bots in their tracks.
    """
    rate = '5/minute'


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates a user and returns JWT access + refresh tokens.
    Protected by rate-limiting and OWASP-compliant error handling.
    """
    permission_classes = [AllowAny]
    throttle_classes = [LoginRateThrottle]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
        }, status=status.HTTP_200_OK)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logs out the user by blacklisting their refresh token.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'detail': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response(
                {'message': 'Logged out successfully.'},
                status=status.HTTP_200_OK
            )
        except TokenError:
            return Response(
                {'detail': 'Token is invalid or already expired.'},
                status=status.HTTP_400_BAD_REQUEST
            )


class MeView(APIView):
    """
    GET   /api/auth/me/ — Get current logged-in user profile.
    PATCH /api/auth/me/ — Update current user's personal details (name, phone).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        # Users cannot change their own role or active status
        data = request.data.copy()
        data.pop('role', None)
        data.pop('is_active', None)
        data.pop('is_staff', None)
        data.pop('is_superuser', None)

        serializer = UserSerializer(request.user, data=data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Allows any logged-in user to change their own password.
    Requires verifying the old password for security.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({'message': 'Password changed successfully.'})


class UserListView(generics.ListCreateAPIView):
    """
    GET  /api/auth/users/ — Returns a list of all users. Admin only.
    POST /api/auth/users/ — Creates a new team member or client account. Admin only.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all().order_by('-date_joined')

    def create(self, request, *args, **kwargs):
        role = request.data.get('role', 'EMPLOYEE')

        # SECURITY RULE: Only the Master Admin can create another Administrator
        if role == 'ADMIN' and not request.user.is_master_admin:
            return Response(
                {'detail': 'Only the Master Admin can create new Administrators.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # If no password provided, auto-generate a friendly temporary password
        password = request.data.get('password')
        if not password:
            password = f"Portal#{random.randint(1000, 9999)}"

        serializer = RegisterSerializer(data={
            'email': request.data.get('email'),
            'full_name': request.data.get('full_name'),
            'phone': request.data.get('phone', ''),
            'role': role,
            'password': password
        })

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # If creating an admin, mark staff access
        if role == 'ADMIN':
            user.is_staff = True
            user.save()

        return Response({
            'user': UserSerializer(user).data,
            'temp_password': password,
            'message': f"Account for {user.full_name} created successfully!"
        }, status=status.HTTP_201_CREATED)


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/users/<id>/ — View details.
    PATCH  /api/auth/users/<id>/ — Update user role or profile.
    DELETE /api/auth/users/<id>/ — Delete user account.
    """
    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()

    def perform_destroy(self, instance):
        # SECURITY RULE: Master Admin can NEVER be deleted
        if instance.is_master_admin:
            raise exceptions.PermissionDenied("The Master Admin account is permanently protected and cannot be deleted.")

        # SECURITY RULE: Regular admins cannot delete other admins
        if instance.role == 'ADMIN' and not self.request.user.is_master_admin:
            raise exceptions.PermissionDenied("Only the Master Admin can delete other Administrators.")

        instance.delete()

    def perform_update(self, serializer):
        instance = self.get_object()
        new_role = serializer.validated_data.get('role')

        # SECURITY RULE: Master Admin can NEVER be demoted
        if instance.is_master_admin and new_role and new_role != 'ADMIN':
            raise exceptions.PermissionDenied("The Master Admin account cannot be demoted.")

        # SECURITY RULE: Only Master Admin can promote someone to ADMIN or demote an ADMIN
        if new_role and new_role != instance.role:
            if (new_role == 'ADMIN' or instance.role == 'ADMIN') and not self.request.user.is_master_admin:
                raise exceptions.PermissionDenied("Only the Master Admin can assign or revoke Administrator privileges.")

        user = serializer.save()
        if user.role == 'ADMIN':
            user.is_staff = True
            user.save()


class AdminResetPasswordView(APIView):
    """
    POST /api/auth/users/<id>/reset-password/
    Allows an Admin to reset a user's password and receive a temporary password
    to copy and share with the user directly.
    """
    permission_classes = [IsAuthenticated, IsAdmin]

    def post(self, request, pk):
        try:
            target_user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response({'detail': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

        # SECURITY RULE: Only Master Admin can reset the Master Admin's password
        if target_user.is_master_admin and not request.user.is_master_admin:
            return Response(
                {'detail': 'Only the Master Admin can reset the Master Admin password.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # SECURITY RULE: Regular admins cannot reset other Admins' passwords
        if target_user.role == 'ADMIN' and not request.user.is_master_admin and target_user != request.user:
            return Response(
                {'detail': 'Only the Master Admin can reset Administrator passwords.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Custom password or generate a clean temporary one (e.g. Portal#8492)
        temp_password = request.data.get('password')
        if not temp_password or len(temp_password) < 8:
            temp_password = f"Portal#{random.randint(1000, 9999)}"

        target_user.set_password(temp_password)
        target_user.save()

        return Response({
            'message': f"Password for {target_user.full_name} has been reset.",
            'email': target_user.email,
            'temp_password': temp_password
        }, status=status.HTTP_200_OK)
