from rest_framework import serializers

from apps.inventory.models import HAGroup, PostgreSQLInstance
from apps.inventory.serializers import PostgreSQLInstanceSummarySerializer


class PatroniClusterSerializer(serializers.ModelSerializer):
    instances = PostgreSQLInstanceSummarySerializer(many=True, read_only=True)

    class Meta:
        model = HAGroup
        fields = ["id", "name", "patroni_port", "instances", "created_at"]
