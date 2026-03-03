from django.urls import path

from . import views

urlpatterns = [
    path("patroni-clusters/", views.PatroniClusterListView.as_view(), name="patroni-cluster-list"),
    path("patroni-clusters/<int:pk>/", views.PatroniClusterDetailView.as_view(), name="patroni-cluster-detail"),
    path("refresh/<int:instance_id>/", views.RefreshInstanceView.as_view(), name="refresh-instance"),
    path("refresh-all/", views.RefreshAllInstancesView.as_view(), name="refresh-all-instances"),
]
