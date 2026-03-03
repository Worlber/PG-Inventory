from django.urls import path

from . import views

urlpatterns = [
    path("login/", views.LoginView.as_view(), name="login"),
    path("verify-otp/", views.OTPVerifyView.as_view(), name="verify-otp"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("user/", views.CurrentUserView.as_view(), name="current-user"),
    path("otp/setup/", views.OTPSetupView.as_view(), name="otp-setup"),
    path("otp/enable/", views.OTPEnableView.as_view(), name="otp-enable"),
    path("otp/disable/", views.OTPDisableView.as_view(), name="otp-disable"),
    # User management (admin)
    path("users/", views.UserListCreateView.as_view(), name="user-list"),
    path("users/<int:pk>/", views.UserDetailView.as_view(), name="user-detail"),
    path("users/<int:pk>/reset-password/", views.UserResetPasswordView.as_view(), name="user-reset-password"),
    path("users/<int:pk>/disable-otp/", views.UserDisableOTPView.as_view(), name="user-disable-otp"),
]
