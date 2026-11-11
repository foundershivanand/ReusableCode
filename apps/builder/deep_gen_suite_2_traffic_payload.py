#!/usr/bin/env python3
"""
Deep Generator for Suite 2: Traffic Defense & Payload Protection (Modules 83 - 100)
"""

import os

BASE_DIR = "/home/shiva/appreusable/modules"

def write(rel_path, content):
    p = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated: {rel_path}")

# mod_83_retry_idempotency
write("mod_83_retry_idempotency/idempotency_guard.py", '''
import time
import hashlib
from typing import Dict, Optional, Tuple

class IdempotencyGuard:
    def __init__(self, ttl_seconds: int = 86400):
        self.ttl = ttl_seconds
        self._cache: Dict[str, Tuple[float, dict]] = {}

    def check_and_set(self, idempotency_key: str, response_payload: dict) -> Tuple[bool, Optional[dict]]:
        now = time.time()
        self._cleanup(now)
        if idempotency_key in self._cache:
            _, cached_resp = self._cache[idempotency_key]
            return True, cached_resp # Cached response returned
        self._cache[idempotency_key] = (now, response_payload)
        return False, None

    def _cleanup(self, now: float):
        expired = [k for k, (ts, _) in self._cache.items() if now - ts > self.ttl]
        for k in expired:
            del self._cache[k]
''')

# mod_85_abuse_prevention
write("mod_85_abuse_prevention/abuse_detector.py", '''
import time
from typing import Dict, List

class BehavioralAbuseDetector:
    def __init__(self, action_threshold: int = 20, time_window_sec: int = 10):
        self.threshold = action_threshold
        self.window = time_window_sec
        self.events: Dict[str, List[float]] = {}

    def record_action(self, user_id: str) -> bool:
        now = time.time()
        history = self.events.setdefault(user_id, [])
        history.append(now)
        recent = [t for t in history if now - t <= self.window]
        self.events[user_id] = recent
        return len(recent) > self.threshold # True if abusive
''')

# mod_86_bot_defense
write("mod_86_bot_defense/bot_defense.py", '''
import hashlib
import secrets

class ProofOfWorkBotDefense:
    @staticmethod
    def generate_challenge(difficulty: int = 4) -> dict:
        nonce = secrets.token_hex(16)
        prefix = "0" * difficulty
        return {"challenge": nonce, "difficulty": difficulty, "target_prefix": prefix}

    @staticmethod
    def verify_solution(challenge: str, solution_nonce: str, difficulty: int = 4) -> bool:
        h = hashlib.sha256(f"{challenge}:{solution_nonce}".encode()).hexdigest()
        return h.startswith("0" * difficulty)
''')

# mod_87_replay_protection
write("mod_87_replay_protection/replay_guard.py", '''
import time
from typing import Dict

class ReplayGuard:
    def __init__(self, max_drift_sec: int = 300):
        self.max_drift = max_drift_sec
        self.seen_nonces: Dict[str, float] = {}

    def validate_request(self, nonce: str, timestamp: float) -> bool:
        now = time.time()
        if abs(now - timestamp) > self.max_drift:
            return False # Timestamp drift too high
        if nonce in self.seen_nonces:
            return False # Replay detected
        self.seen_nonces[nonce] = now
        self._prune(now)
        return True

    def _prune(self, now: float):
        expired = [n for n, ts in self.seen_nonces.items() if now - ts > self.max_drift]
        for n in expired:
            del self.seen_nonces[n]
''')

# mod_90_device_secure_storage
write("mod_90_device_secure_storage/lib/mod_90_device_secure_storage.dart", '''
abstract class SecureStorageContract {
  Future<void> writeSecure(String key, String value);
  Future<String?> readSecure(String key);
  Future<void> deleteSecure(String key);
  Future<void> wipeAll();
}

class MockHardwareSecureEnclave implements SecureStorageContract {
  final Map<String, String> _storage = {};

  @override
  Future<void> writeSecure(String key, String value) async {
    _storage[key] = value;
  }

  @override
  Future<String?> readSecure(String key) async {
    return _storage[key];
  }

  @override
  Future<void> deleteSecure(String key) async {
    _storage.remove(key);
  }

  @override
  Future<void> wipeAll() async {
    _storage.clear();
  }
}
''')

# mod_91_app_integrity
write("mod_91_app_integrity/integrity_verifier.py", '''
import time
import json
import hmac
import hashlib

class AppIntegrityVerifier:
    @staticmethod
    def verify_play_integrity_token(token_payload: dict, expected_package: str) -> bool:
        if token_payload.get("requestDetails", {}).get("requestPackageName") != expected_package:
            return False
        app_licensing = token_payload.get("appLicensingVerdict", "")
        app_recognition = token_payload.get("appRecognitionVerdict", "")
        return app_recognition in ["PLAY_RECOGNIZED", "LICENSED"]

    @staticmethod
    def verify_app_attest_statement(attestation: dict, challenge: str) -> bool:
        return attestation.get("valid", False) and attestation.get("challenge") == challenge
''')

# mod_92_tamper_resilience
write("mod_92_tamper_resilience/lib/mod_92_tamper_resilience.dart", '''
class TamperDetector {
  static bool checkRootOrJailbreak({
    bool testKeys = false,
    bool suBinaryPresent = false,
    bool cydiaPresent = false,
  }) {
    return testKeys || suBinaryPresent || cydiaPresent;
  }

  static bool checkDebuggerAttached({bool isAttached = false}) {
    return isAttached;
  }

  static bool isDeviceCompromised({
    bool isRooted = false,
    bool isDebugger = false,
    bool isHooked = false,
  }) {
    return isRooted || isDebugger || isHooked;
  }
}
''')

# mod_93_network_security
write("mod_93_network_security/tls_config.py", '''
class NetworkSecurityPolicy:
    ALLOWED_TLS_VERSIONS = ["TLSv1.2", "TLSv1.3"]
    FORBIDDEN_CIPHERS = [
        "RC4", "DES", "3DES", "MD5", "NULL", "EXPORT"
    ]
    HSTS_HEADER = "max-age=63072000; includeSubDomains; preload"

    @classmethod
    def is_cipher_acceptable(cls, cipher_name: str) -> bool:
        return not any(bad in cipher_name.upper() for bad in cls.FORBIDDEN_CIPHERS)
''')

# mod_94_webhook_security
write("mod_94_webhook_security/webhook_receiver.py", '''
import hmac
import hashlib
import time

class WebhookSecurity:
    @staticmethod
    def verify_signature(
        raw_payload: str,
        received_sig: str,
        secret: str,
        timestamp: int,
        tolerance_sec: int = 300
    ) -> bool:
        now = int(time.time())
        if abs(now - timestamp) > tolerance_sec:
            return False
        signing_payload = f"{timestamp}.{raw_payload}".encode("utf-8")
        expected_sig = hmac.new(secret.encode("utf-8"), signing_payload, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, received_sig)
''')

# mod_95_file_upload_security
write("mod_95_file_upload_security/file_validator.py", '''
class FileUploadValidator:
    MAGIC_HEADERS = {
        "jpg": b"\\xff\\xd8\\xff",
        "png": b"\\x89PNG\\r\\n\\x1a\\n",
        "pdf": b"%PDF-",
        "webp": b"RIFF"
    }

    @classmethod
    def validate_file(cls, filename: str, content: bytes, max_bytes: int = 10485760) -> dict:
        if len(content) > max_bytes:
            return {"is_valid": False, "error": "File size exceeds limit"}
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        expected_magic = cls.MAGIC_HEADERS.get(ext)
        if expected_magic and not content.startswith(expected_magic):
            return {"is_valid": False, "error": "MIME magic header mismatch (potential polyglot file)"}
        return {"is_valid": True, "error": None}
''')

# mod_96_ssrf_protection
write("mod_96_ssrf_protection/ssrf_firewall.py", '''
import ipaddress
import urllib.parse

class SsrfFirewall:
    FORBIDDEN_SUBNETS = [
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("169.254.0.0/16"), # AWS/GCP metadata
        ipaddress.ip_network("::1/128"),
        ipaddress.ip_network("fc00::/7"),
    ]

    @classmethod
    def is_safe_url(cls, url: str) -> bool:
        try:
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme not in ["http", "https"]:
                return False
            hostname = parsed.hostname
            if not hostname:
                return False
            try:
                ip = ipaddress.ip_address(hostname)
                return not any(ip in subnet for subnet in cls.FORBIDDEN_SUBNETS)
            except ValueError:
                # Domain name: in production, DNS resolve and check IP
                return hostname.lower() not in ["localhost", "metadata.google.internal"]
        except Exception:
            return False
''')

# mod_98_output_security
write("mod_98_output_security/output_shaper.py", '''
import re

class OutputShaper:
    SENSITIVE_KEYS = {"password", "password_hash", "token", "secret", "aws_secret", "stripe_key"}

    @classmethod
    def shape_response(cls, data: any) -> any:
        if isinstance(data, dict):
            clean = {}
            for k, v in data.items():
                if k in cls.SENSITIVE_KEYS:
                    continue
                clean[k] = cls.shape_response(v)
            return clean
        elif isinstance(data, list):
            return [cls.shape_response(x) for x in data]
        return data
''')

# mod_99_error_leak_prevention
write("mod_99_error_leak_prevention/error_sanitizer.py", '''
import uuid

class ProductionErrorSanitizer:
    @staticmethod
    def sanitize(exc: Exception) -> dict:
        incident_id = f"err_{uuid.uuid4().hex[:12]}"
        # Conceal internal stack traces, DB connection strings, and server internals
        return {
            "error": "Internal Server Error",
            "code": "GENERIC_ERROR",
            "incident_id": incident_id,
            "message": "An unexpected error occurred. Please contact support with the incident ID."
        }
''')

# mod_100_security_logging
write("mod_100_security_logging/security_logger.py", '''
import json
import time

class SecurityLogger:
    @staticmethod
    def log_event(event_type: str, actor: str, ip: str, outcome: str, details: dict = None) -> str:
        record = {
            "timestamp": time.time(),
            "event_type": event_type,
            "actor": actor,
            "ip": ip,
            "outcome": outcome,
            "details": details or {}
        }
        return json.dumps(record)
''')

print("SUITE 2 COMPLETE: All Traffic Defense & Payload Protection modules generated.")
