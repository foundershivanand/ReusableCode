import os
import base64
import hashlib
from typing import Tuple

class EnvelopeKeyManager:
    """Envelope Encryption Engine: Master Key (KEK) wraps Data Encryption Key (DEK)"""
    def __init__(self, kek_secret: str):
        self.kek = hashlib.sha256(kek_secret.encode()).digest()

    def generate_dek(self) -> Tuple[bytes, bytes]:
        raw_dek = os.urandom(32) # 256-bit AES DEK
        # XOR or mock-wrap for envelope demonstration
        wrapped_dek = bytes(a ^ b for a, b in zip(raw_dek, self.kek))
        return raw_dek, wrapped_dek

    def unwrap_dek(self, wrapped_dek: bytes) -> bytes:
        return bytes(a ^ b for a, b in zip(wrapped_dek, self.kek))
