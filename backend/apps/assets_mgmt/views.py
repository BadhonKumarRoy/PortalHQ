"""
Views for Asset Management.
Provides CRUD operations for assets with role-based filtering.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Asset
from .serializers import AssetSerializer

class AssetViewSet(viewsets.ModelViewSet):
    serializer_class = AssetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if getattr(user, 'role', '') == 'ADMIN':
            return Asset.objects.all().order_by('-created_at')
        elif getattr(user, 'role', '') == 'EMPLOYEE':
            return Asset.objects.filter(assigned_to=user).order_by('-created_at')
        elif getattr(user, 'role', '') == 'CLIENT':
            client_profile = getattr(user, 'client_profile', None)
            if client_profile:
                return Asset.objects.filter(client=client_profile).order_by('-created_at')
            return Asset.objects.none()
        return Asset.objects.all()
