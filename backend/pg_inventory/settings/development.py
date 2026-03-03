from .base import *  # noqa: F401, F403

DEBUG = True

# In development, allow all hosts
ALLOWED_HOSTS = ["*"]

# Use console email backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Generate a default AES key for development if not set
import base64
import os

if not AES_ENCRYPTION_KEY:  # noqa: F405
    AES_ENCRYPTION_KEY = base64.b64encode(os.urandom(32)).decode()  # noqa: F811
