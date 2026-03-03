from django.db.models import Q
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminOrReadOnly

from .models import Application, DatabaseInfo, DatabaseUser, HAGroup, PostgreSQLInstance
from .serializers import (
    ApplicationDetailSerializer,
    ApplicationSerializer,
    DatabaseInfoSerializer,
    DatabaseUserSerializer,
    HAGroupSerializer,
    PostgreSQLInstanceDetailSerializer,
    PostgreSQLInstanceSerializer,
    PostgreSQLInstanceSummarySerializer,
)


class ApplicationListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Application.objects.all().order_by("-created_at")
    serializer_class = ApplicationSerializer
    filterset_fields = ["name"]
    search_fields = ["name", "description"]


class ApplicationDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Application.objects.prefetch_related("pg_instances")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return ApplicationDetailSerializer
        return ApplicationSerializer


class InstanceListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = PostgreSQLInstance.objects.select_related("application", "ha_group").order_by("-created_at")
    serializer_class = PostgreSQLInstanceSerializer
    filterset_fields = ["environment", "application", "ha_group", "is_up", "role"]
    search_fields = ["hostname", "ip_address"]

    def perform_create(self, serializer):
        instance = serializer.save()
        # Run probe synchronously so the response has live status
        from apps.monitoring.services import PGConnectorService
        from django.utils import timezone
        from apps.inventory.models import DatabaseInfo, DatabaseUser

        pg_service = PGConnectorService()
        result = pg_service.probe_instance(
            host=instance.ip_address,
            port=instance.port,
            username=instance.username,
            password=instance.password,
            db_name=instance.db_name,
        )
        instance.is_up = result["is_up"]
        instance.pg_version = result.get("pg_version", "")
        instance.os_version = result.get("os_version", "")
        if result.get("ram_mb"):
            instance.ram_mb = result["ram_mb"]
        if result.get("cpu_count"):
            instance.cpu_count = result["cpu_count"]
        instance.last_checked = timezone.now()
        instance.save(update_fields=[
            "is_up", "pg_version", "os_version", "ram_mb", "cpu_count", "last_checked",
        ])

        if result["is_up"]:
            for db_data in result.get("databases", []):
                DatabaseInfo.objects.update_or_create(
                    instance=instance, name=db_data["name"],
                    defaults={"size_bytes": db_data["size_bytes"]},
                )
            for user_data in result.get("users", []):
                DatabaseUser.objects.update_or_create(
                    instance=instance, username=user_data["username"],
                    defaults={
                        "is_superuser": user_data["is_superuser"],
                        "can_login": user_data["can_login"],
                        "permissions": user_data["permissions"],
                    },
                )


class InstanceDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = PostgreSQLInstance.objects.select_related("application", "ha_group").prefetch_related("databases", "db_users")

    def get_serializer_class(self):
        if self.request.method == "GET":
            return PostgreSQLInstanceDetailSerializer
        return PostgreSQLInstanceSerializer


class InstanceDatabasesView(generics.ListAPIView):
    serializer_class = DatabaseInfoSerializer

    def get_queryset(self):
        return DatabaseInfo.objects.filter(instance_id=self.kwargs["pk"]).order_by("-size_bytes")


class InstanceUsersView(generics.ListAPIView):
    serializer_class = DatabaseUserSerializer

    def get_queryset(self):
        return DatabaseUser.objects.filter(instance_id=self.kwargs["pk"]).order_by("username")


class HAGroupListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = HAGroup.objects.all().order_by("name")
    serializer_class = HAGroupSerializer


class HAGroupDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAdminOrReadOnly]
    queryset = HAGroup.objects.all()
    serializer_class = HAGroupSerializer


class GlobalSearchView(APIView):
    def get(self, request):
        q = request.query_params.get("q", "").strip()
        if len(q) < 2:
            return Response([])

        results = []

        # Search instances by hostname or IP
        instances = PostgreSQLInstance.objects.filter(
            Q(hostname__icontains=q) | Q(ip_address__icontains=q)
        )[:10]
        for inst in instances:
            results.append({
                "type": "instance",
                "id": inst.id,
                "label": inst.hostname,
                "detail": f"{inst.ip_address} - {inst.get_environment_display()}",
            })

        # Search database names
        databases = DatabaseInfo.objects.filter(
            name__icontains=q
        ).select_related("instance")[:10]
        for db in databases:
            results.append({
                "type": "database",
                "id": db.instance.id,
                "label": db.name,
                "detail": f"on {db.instance.hostname}",
            })

        # Search usernames
        users = DatabaseUser.objects.filter(
            username__icontains=q
        ).select_related("instance")[:10]
        for u in users:
            results.append({
                "type": "user",
                "id": u.instance.id,
                "label": u.username,
                "detail": f"on {u.instance.hostname}",
            })

        return Response(results)


class DashboardStatsView(APIView):
    def get(self, request):
        total_instances = PostgreSQLInstance.objects.count()
        up_instances = PostgreSQLInstance.objects.filter(is_up=True).count()
        total_apps = Application.objects.count()
        total_ha_groups = HAGroup.objects.count()

        env_counts = {}
        for env_choice in PostgreSQLInstance._meta.get_field("environment").choices:
            env_counts[env_choice[0]] = PostgreSQLInstance.objects.filter(
                environment=env_choice[0]
            ).count()

        return Response({
            "total_instances": total_instances,
            "up_instances": up_instances,
            "down_instances": total_instances - up_instances,
            "total_applications": total_apps,
            "total_ha_groups": total_ha_groups,
            "environment_counts": env_counts,
        })
