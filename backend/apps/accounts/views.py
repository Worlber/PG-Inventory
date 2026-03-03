import base64
import io

import pyotp
import qrcode
from django.contrib.auth import login, logout
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from core.permissions import IsAdminUser

from .models import User
from .serializers import (
    LoginSerializer,
    OTPVerifySerializer,
    PasswordResetSerializer,
    UserCreateSerializer,
    UserSerializer,
)


@method_decorator(ensure_csrf_cookie, name="dispatch")
class LoginView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        """Return CSRF cookie so the SPA can make POST requests."""
        return Response({"detail": "CSRF cookie set."})

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        if user.otp_enabled:
            # Store user ID in session for OTP step
            request.session["otp_user_id"] = user.id
            return Response({"otp_required": True})

        login(request, user)
        return Response(UserSerializer(user).data)


class OTPVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        user_id = request.session.get("otp_user_id")
        if not user_id:
            return Response(
                {"detail": "No pending OTP verification."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        totp = pyotp.TOTP(user.otp_secret)
        if not totp.verify(serializer.validated_data["otp_code"]):
            return Response(
                {"detail": "Invalid OTP code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        del request.session["otp_user_id"]
        login(request, user)
        return Response(UserSerializer(user).data)


class LogoutView(APIView):
    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out."})


class CurrentUserView(APIView):
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class OTPSetupView(APIView):
    def post(self, request):
        secret = pyotp.random_base32()
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=request.user.email or request.user.username,
            issuer_name="PG Inventory - Worlber",
        )

        # Generate QR code as base64 image
        img = qrcode.make(provisioning_uri)
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_base64 = base64.b64encode(buffer.getvalue()).decode()

        # Store secret temporarily in session
        request.session["otp_setup_secret"] = secret

        return Response({
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_base64}",
            "provisioning_uri": provisioning_uri,
        })


class OTPEnableView(APIView):
    def post(self, request):
        secret = request.session.get("otp_setup_secret")
        if not secret:
            return Response(
                {"detail": "No OTP setup in progress. Call /api/auth/otp/setup/ first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        totp = pyotp.TOTP(secret)
        if not totp.verify(serializer.validated_data["otp_code"]):
            return Response(
                {"detail": "Invalid OTP code. Please try again."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.otp_secret = secret
        request.user.otp_enabled = True
        request.user.save(update_fields=["otp_secret", "otp_enabled"])
        del request.session["otp_setup_secret"]

        return Response({"detail": "OTP enabled successfully."})


class OTPDisableView(APIView):
    def post(self, request):
        serializer = OTPVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        totp = pyotp.TOTP(request.user.otp_secret)
        if not totp.verify(serializer.validated_data["otp_code"]):
            return Response(
                {"detail": "Invalid OTP code."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        request.user.otp_secret = ""
        request.user.otp_enabled = False
        request.user.save(update_fields=["otp_secret", "otp_enabled"])

        return Response({"detail": "OTP disabled."})


# --- User Management (Admin only) ---


class UserListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all().order_by("-date_joined")

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAdminUser]
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserResetPasswordView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.set_password(serializer.validated_data["new_password"])
        user.save(update_fields=["password"])

        return Response({"detail": "Password reset."})


class UserDisableOTPView(APIView):
    permission_classes = [IsAdminUser]

    def post(self, request, pk):
        try:
            user = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(
                {"detail": "User not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        user.otp_secret = ""
        user.otp_enabled = False
        user.save(update_fields=["otp_secret", "otp_enabled"])

        return Response({"detail": "OTP disabled for user."})
