import base64

from Crypto.Cipher import AES
from django.conf import settings


def _get_key() -> bytes:
    """Load the 32-byte AES key from settings (base64-encoded in env)."""
    key_b64 = settings.AES_ENCRYPTION_KEY
    key = base64.b64decode(key_b64)
    if len(key) != 32:
        raise ValueError("AES_ENCRYPTION_KEY must be 32 bytes (base64-encoded)")
    return key


def encrypt_value(plaintext: str) -> bytes:
    """Encrypt a string using AES-256-GCM. Returns nonce(16) + tag(16) + ciphertext."""
    key = _get_key()
    cipher = AES.new(key, AES.MODE_GCM)
    ciphertext, tag = cipher.encrypt_and_digest(plaintext.encode("utf-8"))
    return cipher.nonce + tag + ciphertext


def decrypt_value(data: bytes) -> str:
    """Decrypt bytes produced by encrypt_value."""
    key = _get_key()
    nonce = data[:16]
    tag = data[16:32]
    ciphertext = data[32:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=nonce)
    plaintext = cipher.decrypt_and_verify(ciphertext, tag)
    return plaintext.decode("utf-8")
