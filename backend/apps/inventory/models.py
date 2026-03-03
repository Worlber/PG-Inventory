from django.db import models

from core.encryption import decrypt_value, encrypt_value


class Environment(models.TextChoices):
    DEV = "dev", "Development"
    QA = "qa", "QA"
    PRE_PROD = "pre-prod", "Pre-Production"
    PROD = "prod", "Production"


class Application(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class HAGroup(models.Model):
    name = models.CharField(max_length=255, unique=True)
    patroni_port = models.IntegerField(default=8008)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class PostgreSQLInstance(models.Model):
    hostname = models.CharField(max_length=255)
    ip_address = models.GenericIPAddressField()
    port = models.IntegerField(default=5432)
    username = models.CharField(max_length=128)
    db_name = models.CharField(max_length=255, default="postgres")
    _encrypted_password = models.BinaryField(db_column="encrypted_password")
    environment = models.CharField(max_length=10, choices=Environment.choices)
    application = models.ForeignKey(
        Application,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="pg_instances",
    )
    ha_enabled = models.BooleanField(default=False)
    ha_group = models.ForeignKey(
        HAGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="instances",
    )

    # Cached live-status fields (updated by monitoring tasks)
    is_up = models.BooleanField(default=False)
    role = models.CharField(max_length=20, blank=True, default="unknown")
    pg_version = models.CharField(max_length=50, blank=True, default="")
    os_version = models.CharField(max_length=100, blank=True, default="")
    ram_mb = models.IntegerField(null=True, blank=True)
    cpu_count = models.IntegerField(null=True, blank=True)
    last_checked = models.DateTimeField(null=True, blank=True)
    consecutive_failures = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("ip_address", "port")
        indexes = [
            models.Index(fields=["hostname"]),
            models.Index(fields=["environment"]),
        ]

    @property
    def password(self):
        if self._encrypted_password:
            return decrypt_value(bytes(self._encrypted_password))
        return ""

    @password.setter
    def password(self, raw_password):
        self._encrypted_password = encrypt_value(raw_password)

    def __str__(self):
        return f"{self.hostname} ({self.ip_address}:{self.port})"


class DatabaseInfo(models.Model):
    instance = models.ForeignKey(
        PostgreSQLInstance,
        on_delete=models.CASCADE,
        related_name="databases",
    )
    name = models.CharField(max_length=255)
    size_bytes = models.BigIntegerField(default=0)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("instance", "name")

    def __str__(self):
        return f"{self.name} on {self.instance.hostname}"


class DatabaseUser(models.Model):
    instance = models.ForeignKey(
        PostgreSQLInstance,
        on_delete=models.CASCADE,
        related_name="db_users",
    )
    username = models.CharField(max_length=128)
    is_superuser = models.BooleanField(default=False)
    can_login = models.BooleanField(default=True)
    permissions = models.JSONField(default=list)
    last_seen = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("instance", "username")

    def __str__(self):
        return f"{self.username} on {self.instance.hostname}"
