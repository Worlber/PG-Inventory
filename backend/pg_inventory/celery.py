import os
from celery import Celery
from celery.signals import worker_ready

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "pg_inventory.settings.development")

app = Celery("pg_inventory")
app.config_from_object("django.conf:settings", namespace="CELERY")
app.autodiscover_tasks()


@worker_ready.connect
def probe_on_startup(sender, **kwargs):
    """Probe all instances immediately when the Celery worker starts."""
    app.send_task("apps.monitoring.tasks.poll_all_instances")
