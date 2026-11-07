# ===== FILE EXPLANATION =====
# API views for the accounts app.
# These views handle user authentication (login, logout, register)
# and user management (list users, view/edit a user profile).
# Each view handles HTTP requests and returns JSON responses.

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny

from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.exceptions import TokenError

from apps.accounts.models import User
from apps.accounts.serializers import (
    UserSerializer,
    RegisterSerializer,
    LoginSerializer,
    ChangePasswordSerializer,
)
from apps.accounts.permissions import IsAdmin


class LoginView(APIView):
    """
    POST /api/auth/login/
    Authenticates a user and returns JWT access + refresh tokens.

    Request body:
        { "email": "user@example.com", "password": "secret" }

    Response:
        { "access": "...", "refresh": "...", "user": { ... } }
    """

    # Login doesn't require authentication — anyone can try to log in
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Validate credentials and return JWT tokens on success.
        """
        # Pass the submitted data to the serializer for validation
        serializer = LoginSerializer(data=request.data)

        if not serializer.is_valid():
            # Return validation errors (e.g., wrong password)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # The validated data contains the authenticated user object
        user = serializer.validated_data['user']

        # Generate a JWT refresh token for this user
        refresh = RefreshToken.for_user(user)

        return Response({
            'access': str(refresh.access_token),  # Short-lived token for API calls
            'refresh': str(refresh),               # Long-lived token for getting new access tokens
            'user': UserSerializer(user).data,     # User details
        }, status=status.HTTP_200_OK)


class RegisterView(APIView):
    """
    POST /api/auth/register/
    Allows registering a new user account (public signup for development or admin user creation).
    """
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Create a new user account with the provided details.
        """
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'message': 'Account created successfully!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user': UserSerializer(user).data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    """
    POST /api/auth/logout/
    Logs out the user by blacklisting their refresh token.
    After this, the refresh token cannot be used to get new access tokens.

    Request body:
        { "refresh": "<refresh_token>" }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Blacklist the provided refresh token so it can't be reused.
        """
        refresh_token = request.data.get('refresh')

        if not refresh_token:
            return Response(
                {'error': 'Refresh token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Create a RefreshToken object and blacklist it
            token = RefreshToken(refresh_token)
            token.blacklist()  # Marks this token as invalid in the database
        except TokenError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'message': 'Successfully logged out.'},
            status=status.HTTP_200_OK
        )


class MeView(APIView):
    """
    GET  /api/auth/me/ — Returns the current user's profile.
    PUT  /api/auth/me/ — Updates the current user's profile.
    """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Return the profile of the currently logged-in user.
        The user is determined from the JWT token.
        """
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        """
        Update the current user's profile (full_name, phone).
        Users cannot change their own role via this endpoint.
        """
        # partial=True allows updating just some fields
        serializer = UserSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    POST /api/auth/change-password/
    Allows the logged-in user to change their password.
    Requires the old password for security.

    Request body:
        { "old_password": "...", "new_password": "...", "confirm_password": "..." }
    """

    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Validate old password and set the new one.
        """
        # Pass the request via context so the serializer can access request.user
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Set the new hashed password
        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({'message': 'Password changed successfully.'})


class UserListView(generics.ListAPIView):
    """
    GET /api/auth/users/
    Returns a list of all users. Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()  # Return all users


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/auth/users/<id>/ — Get a specific user's details.
    PUT    /api/auth/users/<id>/ — Update a specific user.
    DELETE /api/auth/users/<id>/ — Delete a specific user.

    Admin only.
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = UserSerializer
    queryset = User.objects.all()
