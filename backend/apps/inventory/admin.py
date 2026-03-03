from django.contrib import admin

from .models import Application, DatabaseInfo, DatabaseUser, HAGroup, PostgreSQLInstance


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = ("name", "description", "created_at")
    search_fields = ("name",)


@admin.register(HAGroup)
class HAGroupAdmin(admin.ModelAdmin):
    list_display = ("name", "patroni_port", "created_at")
    search_fields = ("name",)


@admin.register(PostgreSQLInstance)
class PostgreSQLInstanceAdmin(admin.ModelAdmin):
    list_display = ("hostname", "ip_address", "port", "environment", "application", "is_up", "role")
    list_filter = ("environment", "is_up", "role", "ha_enabled")
    search_fields = ("hostname", "ip_address")


@admin.register(DatabaseInfo)
class DatabaseInfoAdmin(admin.ModelAdmin):
    list_display = ("name", "instance", "size_bytes", "last_seen")
    search_fields = ("name",)


@admin.register(DatabaseUser)
class DatabaseUserAdmin(admin.ModelAdmin):
    list_display = ("username", "instance", "is_superuser", "can_login")
    search_fields = ("username",)
