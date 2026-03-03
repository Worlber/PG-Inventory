from rest_framework import serializers

from .models import Application, DatabaseInfo, DatabaseUser, HAGroup, PostgreSQLInstance


class HAGroupSerializer(serializers.ModelSerializer):
    instance_count = serializers.IntegerField(source="instances.count", read_only=True)

    class Meta:
        model = HAGroup
        fields = ["id", "name", "patroni_port", "instance_count", "created_at"]


class DatabaseInfoSerializer(serializers.ModelSerializer):
    size_display = serializers.SerializerMethodField()

    class Meta:
        model = DatabaseInfo
        fields = ["id", "name", "size_bytes", "size_display", "last_seen"]

    def get_size_display(self, obj):
        size = obj.size_bytes
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} PB"


class DatabaseUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatabaseUser
        fields = ["id", "username", "is_superuser", "can_login", "permissions", "last_seen"]


class PostgreSQLInstanceSummarySerializer(serializers.ModelSerializer):
    application_name = serializers.CharField(source="application.name", read_only=True, default=None)
    ha_group_name = serializers.CharField(source="ha_group.name", read_only=True, default=None)

    class Meta:
        model = PostgreSQLInstance
        fields = [
            "id", "hostname", "ip_address", "port", "environment",
            "application", "application_name", "ha_enabled",
            "ha_group", "ha_group_name",
            "is_up", "role", "pg_version", "last_checked",
        ]


class PostgreSQLInstanceSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    application_name = serializers.CharField(source="application.name", read_only=True, default=None)
    ha_group_name = serializers.CharField(source="ha_group.name", read_only=True, default=None)

    class Meta:
        model = PostgreSQLInstance
        fields = [
            "id", "hostname", "ip_address", "port", "username", "password",
            "db_name", "environment", "application", "application_name",
            "ha_enabled", "ha_group", "ha_group_name",
            "is_up", "role", "pg_version", "os_version",
            "ram_mb", "cpu_count", "last_checked",
            "created_at", "updated_at",
        ]
        read_only_fields = [
            "is_up", "role", "pg_version", "os_version",
            "ram_mb", "cpu_count", "last_checked",
            "created_at", "updated_at",
        ]

    def create(self, validated_data):
        raw_password = validated_data.pop("password")
        instance = PostgreSQLInstance(**validated_data)
        instance.password = raw_password
        instance.save()
        return instance

    def update(self, instance, validated_data):
        raw_password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if raw_password:
            instance.password = raw_password
        instance.save()
        return instance


class PostgreSQLInstanceDetailSerializer(PostgreSQLInstanceSerializer):
    databases = DatabaseInfoSerializer(many=True, read_only=True)
    db_users = DatabaseUserSerializer(many=True, read_only=True)

    class Meta(PostgreSQLInstanceSerializer.Meta):
        fields = PostgreSQLInstanceSerializer.Meta.fields + ["databases", "db_users"]


class ApplicationSerializer(serializers.ModelSerializer):
    instance_count = serializers.IntegerField(source="pg_instances.count", read_only=True)

    class Meta:
        model = Application
        fields = ["id", "name", "description", "instance_count", "created_at", "updated_at"]


class ApplicationDetailSerializer(ApplicationSerializer):
    pg_instances = PostgreSQLInstanceSummarySerializer(many=True, read_only=True)

    class Meta(ApplicationSerializer.Meta):
        fields = ApplicationSerializer.Meta.fields + ["pg_instances"]


class SearchResultSerializer(serializers.Serializer):
    type = serializers.CharField()
    id = serializers.IntegerField()
    label = serializers.CharField()
    detail = serializers.CharField()
