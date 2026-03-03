from django.urls import path

from . import views

urlpatterns = [
    path("applications/", views.ApplicationListCreateView.as_view(), name="application-list"),
    path("applications/<int:pk>/", views.ApplicationDetailView.as_view(), name="application-detail"),
    path("instances/", views.InstanceListCreateView.as_view(), name="instance-list"),
    path("instances/<int:pk>/", views.InstanceDetailView.as_view(), name="instance-detail"),
    path("instances/<int:pk>/databases/", views.InstanceDatabasesView.as_view(), name="instance-databases"),
    path("instances/<int:pk>/users/", views.InstanceUsersView.as_view(), name="instance-users"),
    path("ha-groups/", views.HAGroupListCreateView.as_view(), name="hagroup-list"),
    path("ha-groups/<int:pk>/", views.HAGroupDetailView.as_view(), name="hagroup-detail"),
    path("search/", views.GlobalSearchView.as_view(), name="global-search"),
    path("dashboard/stats/", views.DashboardStatsView.as_view(), name="dashboard-stats"),
]
