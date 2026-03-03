from django.urls import path

from . import views

urlpatterns = [
    path("inventory/", views.ExportInventoryView.as_view(), name="export-inventory"),
    path("instances/<int:pk>/databases/", views.ExportInstanceDatabasesView.as_view(), name="export-databases"),
    path("instances/<int:pk>/users/", views.ExportInstanceUsersView.as_view(), name="export-users"),
]
