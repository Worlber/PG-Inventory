from django.contrib import admin

from .models import ProbeLog


@admin.register(ProbeLog)
class ProbeLogAdmin(admin.ModelAdmin):
    list_display = ("instance", "success", "message", "created_at")
    list_filter = ("success",)
    readonly_fields = ("instance", "success", "message", "created_at")
