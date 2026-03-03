from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        VIEWER = "viewer", "Viewer"

    role = models.CharField(max_length=10, choices=Role.choices, default=Role.VIEWER)
    otp_enabled = models.BooleanField(default=False)
    otp_secret = models.CharField(max_length=255, blank=True, default="")

    class Meta:
        db_table = "auth_user"

    def __str__(self):
        return f"{self.username} ({self.role})"
