from django.http import HttpResponse
from rest_framework.views import APIView

from .services import ExportService


class ExportInventoryView(APIView):
    def get(self, request):
        fmt = request.query_params.get("filetype", "xlsx")
        service = ExportService()

        if fmt == "csv":
            output = service.export_full_inventory_csv()
            response = HttpResponse(output.read(), content_type="text/csv")
            response["Content-Disposition"] = 'attachment; filename="pg_inventory.csv"'
            return response

        output = service.export_full_inventory_xlsx()
        response = HttpResponse(
            output.read(),
            content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        )
        response["Content-Disposition"] = 'attachment; filename="pg_inventory.xlsx"'
        return response


class ExportInstanceDatabasesView(APIView):
    def get(self, request, pk):
        fmt = request.query_params.get("filetype", "csv")
        service = ExportService()

        if fmt == "xlsx":
            output = service.export_databases_xlsx(pk)
            response = HttpResponse(
                output.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="databases_{pk}.xlsx"'
        else:
            output = service.export_databases_csv(pk)
            response = HttpResponse(output.read(), content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="databases_{pk}.csv"'

        return response


class ExportInstanceUsersView(APIView):
    def get(self, request, pk):
        fmt = request.query_params.get("filetype", "csv")
        service = ExportService()

        if fmt == "xlsx":
            output = service.export_users_xlsx(pk)
            response = HttpResponse(
                output.read(),
                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            )
            response["Content-Disposition"] = f'attachment; filename="users_{pk}.xlsx"'
        else:
            output = service.export_users_csv(pk)
            response = HttpResponse(output.read(), content_type="text/csv")
            response["Content-Disposition"] = f'attachment; filename="users_{pk}.csv"'

        return response
