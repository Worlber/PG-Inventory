from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "email", "role", "otp_enabled", "is_active")
    list_filter = ("role", "otp_enabled", "is_active")
    fieldsets = BaseUserAdmin.fieldsets + (
        ("PG Inventory", {"fields": ("role", "otp_enabled")}),
    )
