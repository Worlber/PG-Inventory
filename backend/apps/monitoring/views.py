from concurrent.futures import ThreadPoolExecutor, as_completed

from django.utils import timezone
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.inventory.models import DatabaseInfo, DatabaseUser, HAGroup, PostgreSQLInstance
from apps.inventory.serializers import PostgreSQLInstanceDetailSerializer

from .serializers import PatroniClusterSerializer
from .services import PGConnectorService


class PatroniClusterListView(generics.ListAPIView):
    queryset = HAGroup.objects.prefetch_related("instances").all().order_by("name")
    serializer_class = PatroniClusterSerializer


class PatroniClusterDetailView(generics.RetrieveAPIView):
    queryset = HAGroup.objects.prefetch_related("instances")
    serializer_class = PatroniClusterSerializer


def _probe_and_update(instance):
    """Probe a single instance and update the DB. Used by both single and bulk refresh."""
    pg_service = PGConnectorService()
    result = pg_service.probe_instance(
        host=instance.ip_address,
        port=instance.port,
        username=instance.username,
        password=instance.password,
        db_name=instance.db_name,
    )

    now = timezone.now()

    if result["is_up"]:
        instance.is_up = True
        instance.consecutive_failures = 0
        instance.pg_version = result.get("pg_version", "")
        instance.os_version = result.get("os_version", "")
        if result.get("ram_mb"):
            instance.ram_mb = result["ram_mb"]
        if result.get("cpu_count"):
            instance.cpu_count = result["cpu_count"]
        instance.last_checked = now
        instance.save(update_fields=[
            "is_up", "consecutive_failures", "pg_version",
            "os_version", "ram_mb", "cpu_count", "last_checked",
        ])

        # Update databases
        seen_dbs = set()
        for db_data in result.get("databases", []):
            DatabaseInfo.objects.update_or_create(
                instance=instance,
                name=db_data["name"],
                defaults={"size_bytes": db_data["size_bytes"]},
            )
            seen_dbs.add(db_data["name"])
        DatabaseInfo.objects.filter(instance=instance).exclude(name__in=seen_dbs).delete()

        # Update users
        seen_users = set()
        for user_data in result.get("users", []):
            DatabaseUser.objects.update_or_create(
                instance=instance,
                username=user_data["username"],
                defaults={
                    "is_superuser": user_data["is_superuser"],
                    "can_login": user_data["can_login"],
                    "permissions": user_data["permissions"],
                },
            )
            seen_users.add(user_data["username"])
        DatabaseUser.objects.filter(instance=instance).exclude(username__in=seen_users).delete()
    else:
        instance.consecutive_failures += 1
        instance.last_checked = now
        update_fields = ["consecutive_failures", "last_checked"]
        if instance.consecutive_failures >= 3:
            instance.is_up = False
            update_fields.append("is_up")
        instance.save(update_fields=update_fields)

    return instance.id, result["is_up"]


class RefreshInstanceView(APIView):
    """Synchronous probe — returns updated instance data immediately."""

    def post(self, request, instance_id):
        try:
            instance = PostgreSQLInstance.objects.get(id=instance_id)
        except PostgreSQLInstance.DoesNotExist:
            return Response({"detail": "Instance not found."}, status=status.HTTP_404_NOT_FOUND)

        _probe_and_update(instance)

        instance.refresh_from_db()
        serializer = PostgreSQLInstanceDetailSerializer(instance)
        return Response(serializer.data)


class RefreshAllInstancesView(APIView):
    """Probe ALL instances in parallel and return summary."""

    def post(self, request):
        instances = list(PostgreSQLInstance.objects.all())
        if not instances:
            return Response({"detail": "No instances to probe.", "results": {}})

        results = {}
        # Probe all instances concurrently (max 10 threads)
        with ThreadPoolExecutor(max_workers=min(10, len(instances))) as executor:
            futures = {
                executor.submit(_probe_and_update, inst): inst
                for inst in instances
            }
            for future in as_completed(futures):
                try:
                    inst_id, is_up = future.result()
                    results[inst_id] = is_up
                except Exception:
                    inst = futures[future]
                    results[inst.id] = False

        return Response({"detail": f"Probed {len(results)} instances.", "results": results})
