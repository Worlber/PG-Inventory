from .base import *  # noqa: F401, F403

DEBUG = False

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
X_FRAME_OPTIONS = "DENY"

# Ensure AES key is set in production
assert AES_ENCRYPTION_KEY, "AES_ENCRYPTION_KEY must be set in production"  # noqa: F405
