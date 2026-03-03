from rest_framework.authentication import SessionAuthentication


class CsrfExemptSessionAuthentication(SessionAuthentication):
    """Session authentication without CSRF enforcement.

    Safe when the API is only accessed via the same-origin SPA proxy
    and not via browser forms from other origins.
    """

    def enforce_csrf(self, request):
        return  # Skip CSRF check
