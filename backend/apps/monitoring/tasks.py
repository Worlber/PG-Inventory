import logging
import time
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)

# Number of consecutive probe failures before marking an instance as DOWN
FAILURE_THRESHOLD = 3

# Minimum interval between probes for the same instance (seconds)
MIN_PROBE_INTERVAL = 90  # 1.5 minutes


@shared_task
def poll_all_instances():
    """Periodic task: probe all PG instances for status and metadata."""
    from apps.inventory.models import DatabaseInfo, DatabaseUser, PostgreSQLInstance
    from apps.monitoring.models import ProbeLog
    from apps.monitoring.services import PGConnectorService

    pg_service = PGConnectorService()
    now = timezone.now()
    cutoff = now - timedelta(seconds=MIN_PROBE_INTERVAL)

    for instance in PostgreSQLInstance.objects.all():
        # Skip instances that were successfully probed recently
        if instance.last_checked and instance.last_checked > cutoff and instance.is_up:
            continue

        try:
            result = pg_service.probe_instance(
                host=instance.ip_address,
                port=instance.port,
                username=instance.username,
                password=instance.password,
                db_name=instance.db_name,
            )

            # Retry once if probe failed
            if not result["is_up"]:
                time.sleep(2)
                result = pg_service.probe_instance(
                    host=instance.ip_address,
                    port=instance.port,
                    username=instance.username,
                    password=instance.password,
                    db_name=instance.db_name,
                )

            if result["is_up"]:
                # Probe succeeded — reset failures, update all cached data
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
                # Probe failed — increment failures, only mark DOWN after threshold
                instance.consecutive_failures += 1
                instance.last_checked = now
                update_fields = ["consecutive_failures", "last_checked"]

                if instance.consecutive_failures >= FAILURE_THRESHOLD:
                    instance.is_up = False
                    update_fields.append("is_up")

                instance.save(update_fields=update_fields)

            ProbeLog.objects.create(
                instance=instance,
                success=result["is_up"],
                message=result.get("error", "OK"),
            )

        except Exception as e:
            logger.error("Error polling instance %s: %s", instance, e)
            instance.consecutive_failures += 1
            instance.last_checked = now
            update_fields = ["consecutive_failures", "last_checked"]

            if instance.consecutive_failures >= FAILURE_THRESHOLD:
                instance.is_up = False
                update_fields.append("is_up")

            instance.save(update_fields=update_fields)
            ProbeLog.objects.create(instance=instance, success=False, message=str(e))


@shared_task
def poll_patroni_clusters():
    """Periodic task: poll Patroni API for cluster member roles."""
    from apps.inventory.models import HAGroup
    from apps.monitoring.services import PatroniService

    patroni_service = PatroniService()

    for ha_group in HAGroup.objects.prefetch_related("instances").all():
        instances = list(ha_group.instances.all())
        if not instances:
            continue

        # Try to get cluster status from any member
        cluster_data = None
        for inst in instances:
            cluster_data = patroni_service.get_cluster_status(
                host=inst.ip_address,
                port=ha_group.patroni_port,
            )
            if cluster_data:
                break

        if not cluster_data:
            continue

        # Update member roles from Patroni response (only update role, not is_up)
        members = {m["host"]: m for m in cluster_data.get("members", [])}
        for inst in instances:
            member = members.get(inst.ip_address)
            if member:
                inst.role = member.get("role", "unknown")
                member_state = member.get("state", "")
                if member_state in ("running", "streaming"):
                    # running = leader, streaming = replica — both are healthy
                    inst.is_up = True
                    inst.consecutive_failures = 0
                inst.last_checked = timezone.now()
                inst.save(update_fields=["role", "is_up", "consecutive_failures", "last_checked"])


@shared_task
def probe_single_instance(instance_id):
    """On-demand probe for a single instance."""
    from apps.inventory.models import DatabaseInfo, DatabaseUser, PostgreSQLInstance
    from apps.monitoring.models import ProbeLog
    from apps.monitoring.services import PGConnectorService

    try:
        instance = PostgreSQLInstance.objects.get(id=instance_id)
    except PostgreSQLInstance.DoesNotExist:
        return

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

        seen_dbs = set()
        for db_data in result.get("databases", []):
            DatabaseInfo.objects.update_or_create(
                instance=instance,
                name=db_data["name"],
                defaults={"size_bytes": db_data["size_bytes"]},
            )
            seen_dbs.add(db_data["name"])
        DatabaseInfo.objects.filter(instance=instance).exclude(name__in=seen_dbs).delete()

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

        if instance.consecutive_failures >= FAILURE_THRESHOLD:
            instance.is_up = False
            update_fields.append("is_up")

        instance.save(update_fields=update_fields)

    ProbeLog.objects.create(
        instance=instance,
        success=result["is_up"],
        message=result.get("error", "OK"),
    )


@shared_task
def cleanup_old_probe_logs():
    """Delete probe logs older than 30 days."""
    from apps.monitoring.models import ProbeLog

    cutoff = timezone.now() - timedelta(days=30)
    deleted, _ = ProbeLog.objects.filter(created_at__lt=cutoff).delete()
    logger.info("Deleted %d old probe log entries", deleted)
