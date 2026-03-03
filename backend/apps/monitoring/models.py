from django.db import models


class ProbeLog(models.Model):
    """Log of monitoring probe attempts."""
    instance = models.ForeignKey(
        "inventory.PostgreSQLInstance",
        on_delete=models.CASCADE,
        related_name="probe_logs",
    )
    success = models.BooleanField()
    message = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["-created_at"]),
        ]
