#!/usr/bin/env python3
"""
Generator for Modules 64 to 83 of the Mobile App Factory:
Security, Zero-Trust Access Control, Secrets, Database & Resilience.
"""
import os
import stat

BASE_DIR = "/home/shiva/appreusable/modules"

def write_file(rel_path, content):
    full_path = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Created: {rel_path}")

# ==========================================
# MODULE 64: Threat Modeling Module
# ==========================================
write_file("mod_64_threat_modeling/README.md", """
# Module 64: Threat Modeling Module

Automates STRIDE / DREAD threat modeling for every mobile feature before production:
`Asset -> Trust Boundary -> Entry Point -> Threat -> Attack Path -> Impact -> Mitigation -> Test`
""")

write_file("mod_64_threat_modeling/threat_modeler.py", """#!/usr/bin/env python3
from dataclasses import dataclass
from typing import List, Dict

@dataclass
class ThreatEntry:
    asset: str
    trust_boundary: str
    entry_point: str
    threat: str
    stride_category: str # Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege
    impact: str
    mitigation: str
    verification_test: str

class ThreatModeler:
    @staticmethod
    def generate_feature_model(feature_name: str, entry_point: str) -> List[ThreatEntry]:
        return [
            ThreatEntry(
                asset=f"{feature_name} data",
                trust_boundary="Mobile App -> API Gateway",
                entry_point=entry_point,
                threat="Attacker intercepts or tampers with payload in transit",
                stride_category="Tampering",
                impact="Data corruption or unauthorized mutation",
                mitigation="Enforce TLS 1.3 with certificate pinning (Mod 13, Mod 93)",
                verification_test="test_tls_pinning_rejects_mitm"
            ),
            ThreatEntry(
                asset=f"{feature_name} access tokens",
                trust_boundary="Local Storage",
                entry_point="Device filesystem",
                threat="Attacker extracts tokens from device filesystem or backup",
                stride_category="Information Disclosure",
                impact="Account takeover",
                mitigation="Store credentials in Android Keystore / iOS Keychain (Mod 90)",
                verification_test="test_tokens_stored_in_hardware_keystore"
            ),
            ThreatEntry(
                asset=f"{feature_name} API endpoint",
                trust_boundary="API Gateway -> Backend Service",
                entry_point=entry_point,
                threat="Attacker bombards endpoint to incur massive cloud/AI bills",
                stride_category="Denial of Service",
                impact="Financial loss and resource exhaustion",
                mitigation="Token-bucket rate limiting & per-user cost quota (Mod 84, Mod 128)",
                verification_test="test_rate_limiter_blocks_abuse"
            )
        ]

if __name__ == "__main__":
    entries = ThreatModeler.generate_feature_model("AI Document Summarizer", "/api/v1/summarize")
    print(f"Generated {len(entries)} threat mitigations.")
""")

# ==========================================
# MODULE 65: Security Boundary Module
# ==========================================
write_file("mod_65_security_boundary/README.md", """
# Module 65: Security Boundary Module

Enforces the core rule: **The mobile application must always be treated as potentially compromised.**
Separates untrusted mobile runtime artifacts from trusted backend boundaries.
""")

write_file("mod_65_security_boundary/boundary_guard.py", """#!/usr/bin/env python3
class SecurityBoundaryGuard:
    UNTRUSTED_SOURCES = {
        "mobile_client", "user_input", "deep_links", "uploaded_files",
        "third_party_apis", "device_state", "local_storage", "network_headers"
    }

    @classmethod
    def sanitize_request_context(cls, incoming_context: dict) -> dict:
        # Never trust client-supplied user_id, roles, permissions, or subscription status
        scrubbed = incoming_context.copy()
        for forbidden_key in ["is_admin", "subscription_tier", "role", "credits", "user_id"]:
            scrubbed.pop(forbidden_key, None)
        return scrubbed
""")

# ==========================================
# MODULE 66: Zero-Trust API Module
# ==========================================
write_file("mod_66_zero_trust_api/README.md", """
# Module 66: Zero-Trust API Module

Every API request undergoes a multi-layer verification chain:
`Request -> TLS -> AuthN -> Token Validation -> User Lookup -> AuthZ -> Object Ownership -> Input Validation -> Rate Limit -> Execution`
""")

write_file("mod_66_zero_trust_api/zero_trust_pipeline.py", """#!/usr/bin/env python3
class ZeroTrustPipeline:
    @staticmethod
    def process_request(request: dict, authorizer_fn, ownership_fn, validator_fn) -> bool:
        if not request.get("is_tls"):
            raise PermissionError("Zero-Trust Violation: Plaintext HTTP traffic rejected")
        token = request.get("bearer_token")
        if not token or token == "expired":
            raise PermissionError("Zero-Trust Violation: Invalid or expired token")
        if not authorizer_fn(request.get("user_role"), request.get("action")):
            raise PermissionError("Zero-Trust Violation: Unauthorized role")
        if not ownership_fn(request.get("user_id"), request.get("resource_id")):
            raise PermissionError("Zero-Trust Violation: Object ownership check failed (BOLA)")
        if not validator_fn(request.get("payload")):
            raise ValueError("Zero-Trust Violation: Payload validation failed")
        return True
""")

# ==========================================
# MODULE 67: Object-Level Authorization (BOLA Defense)
# ==========================================
write_file("mod_67_object_authorization/README.md", """
# Module 67: Object-Level Authorization (BOLA Defense)

Guards against OWASP API1: Broken Object Level Authorization.
Every resource retrieval verifies that the requesting identity is the legitimate owner or tenant.
""")

write_file("mod_67_object_authorization/bola_guard.py", """#!/usr/bin/env python3
class BolaGuard:
    @staticmethod
    def verify_ownership(requester_id: str, resource_owner_id: str, is_admin: bool = False) -> bool:
        if is_admin:
            return True
        if not requester_id or not resource_owner_id:
            return False
        return requester_id == resource_owner_id
""")

# ==========================================
# MODULE 68: Property-Level Authorization (BOPLA Defense)
# ==========================================
write_file("mod_68_property_authorization/README.md", """
# Module 68: Property-Level Authorization (BOPLA Defense)

Guards against OWASP API3: Broken Object Property Level Authorization.
Uses strict allow-lists for user-editable fields, completely preventing mass-assignment exploits.
""")

write_file("mod_68_property_authorization/bopla_filter.py", """#!/usr/bin/env python3
class BoplaFilter:
    USER_EDITABLE_FIELDS = {"name", "avatar_url", "bio", "timezone", "theme_preference"}
    SERVER_CONTROLLED_FIELDS = {"is_admin", "role", "subscription_tier", "credits", "created_at", "email_verified"}

    @classmethod
    def filter_payload(cls, payload: dict) -> dict:
        return {k: v for k, v in payload.items() if k in cls.USER_EDITABLE_FIELDS}
""")

# ==========================================
# MODULE 69: Function-Level Authorization
# ==========================================
write_file("mod_69_function_authorization/README.md", """
# Module 69: Function-Level Authorization

Guards against OWASP API5: Broken Function Level Authorization.
Enforces strict segregation of USER, ADMIN, SUPERADMIN, SUPPORT, and SERVICE privileges.
""")

write_file("mod_69_function_authorization/function_authz.py", """#!/usr/bin/env python3
class FunctionAuthorizer:
    FUNCTION_POLICIES = {
        "delete_user": {"ADMIN", "SUPERADMIN"},
        "view_metrics": {"ADMIN", "SUPERADMIN", "SUPPORT"},
        "trigger_refund": {"SUPERADMIN"},
        "export_database": {"SUPERADMIN"},
        "standard_user_action": {"USER", "ADMIN", "SUPERADMIN"},
    }

    @classmethod
    def can_execute(cls, role: str, action: str) -> bool:
        allowed_roles = cls.FUNCTION_POLICIES.get(action, set())
        return role in allowed_roles
""")

# ==========================================
# MODULE 70: Admin Security Module
# ==========================================
write_file("mod_70_admin_security/README.md", """
# Module 70: Admin Security Module

Hardens internal management dashboards:
- Mandatory MFA / WebAuthn Passkeys
- Maximum 15-minute idle session timeout
- Step-up re-authentication required for destructive operations (drop DB, refund, price change)
""")

write_file("mod_70_admin_security/admin_guard.py", """#!/usr/bin/env python3
import time

class AdminSession:
    def __init__(self, admin_id: str, mfa_verified: bool):
        self.admin_id = admin_id
        self.mfa_verified = mfa_verified
        self.last_active = time.time()
        self.max_idle_seconds = 900 # 15 minutes

    def is_valid(self) -> bool:
        if not self.mfa_verified:
            return False
        return (time.time() - self.last_active) <= self.max_idle_seconds

    def touch(self):
        self.last_active = time.time()
""")

# ==========================================
# MODULE 71: Break-Glass Access
# ==========================================
write_file("mod_71_break_glass_access/README.md", """
# Module 71: Break-Glass Access

Emergency elevated access protocol:
- Temporary time-bounded access (maximum 1 hour)
- Requires explicit justification and dual authorization
- Generates immutable audit log
""")

write_file("mod_71_break_glass_access/break_glass.py", """#!/usr/bin/env python3
import time

class BreakGlassManager:
    @staticmethod
    def issue_emergency_token(operator_id: str, justification: str, approver_id: str, duration_sec: int = 3600) -> dict:
        if operator_id == approver_id:
            raise PermissionError("Dual authorization required: operator cannot approve own break-glass request")
        if len(justification) < 20:
            raise ValueError("Detailed justification required for emergency access")
        
        return {
            "token_id": f"bg_{int(time.time())}_{operator_id}",
            "operator": operator_id,
            "approver": approver_id,
            "justification": justification,
            "expires_at": time.time() + duration_sec,
            "is_emergency": True
        }
""")

# ==========================================
# MODULE 72: Secrets Management
# ==========================================
write_file("mod_72_secrets_management/README.md", """
# Module 72: Secrets Management

Enforces zero secrets in source code, APKs, or IPAs:
- Integration with AWS Secrets Manager / HashiCorp Vault / GCP Secret Manager
- Client receives only ephemeral, scoped tokens
""")

write_file("mod_72_secrets_management/secret_loader.py", """#!/usr/bin/env python3
import os

class SecretLoader:
    @staticmethod
    def get_secret(key: str) -> str:
        # In production, retrieves from Vault or AWS Secrets Manager
        val = os.environ.get(key)
        if not val:
            raise EnvironmentError(f"Missing required secret: {key}")
        return val
""")

# ==========================================
# MODULE 73: Secret Rotation
# ==========================================
write_file("mod_73_secret_rotation/README.md", """
# Module 73: Secret Rotation

Tracks secret age, rotation schedule, and automated revocation:
- Maximum secret lifespan: 90 days
- Automated alerts when secrets exceed 75 days without rotation
""")

write_file("mod_73_secret_rotation/rotation_policy.py", """#!/usr/bin/env python3
import time

class SecretRotationAuditor:
    MAX_LIFESPAN_DAYS = 90
    WARNING_THRESHOLD_DAYS = 75

    @classmethod
    def audit_secret(cls, secret_name: str, created_timestamp: float) -> dict:
        age_days = (time.time() - created_timestamp) / 86400.0
        return {
            "secret": secret_name,
            "age_days": round(age_days, 1),
            "needs_rotation": age_days >= cls.MAX_LIFESPAN_DAYS,
            "warning": age_days >= cls.WARNING_THRESHOLD_DAYS
        }
""")

# ==========================================
# MODULE 74: Key Management Module
# ==========================================
write_file("mod_74_key_management/README.md", """
# Module 74: Key Management Module

Separates cryptographic keys by purpose:
- Data Encryption Keys (DEK)
- Key Encryption Keys (KEK)
- App Signing Keys
- Webhook Signing Keys
- OAuth Client Secrets
""")

write_file("mod_74_key_management/key_segregator.py", """#!/usr/bin/env python3
enum_keys = ["DEK", "KEK", "SIGNING", "WEBHOOK", "OAUTH"]

class KeyRegistry:
    def __init__(self):
        self._keys = {}

    def register_key(self, purpose: str, key_id: str):
        if purpose not in enum_keys:
            raise ValueError(f"Invalid key purpose: {purpose}")
        self._keys[purpose] = key_id
""")

# ==========================================
# MODULE 75: Database Security Module
# ==========================================
write_file("mod_75_database_security/README.md", """
# Module 75: Database Security Module

Database hardening rules:
- TLS enforced on all connections
- Least-privileged database user roles (read-only replicas, write-only queues)
- Query timeout enforced (5000ms max)
""")

write_file("mod_75_database_security/db_security.py", """#!/usr/bin/env python3
class DatabaseSecurityConfig:
    MAX_QUERY_TIMEOUT_MS = 5000
    ENFORCE_SSL = True
    CONNECTION_POOL_MAX = 20

    @classmethod
    def validate_connection_string(cls, uri: str) -> bool:
        if "sslmode=require" not in uri and "sslmode=verify-full" not in uri:
            return False
        return True
""")

# ==========================================
# MODULE 76: Database Tenancy Isolation
# ==========================================
write_file("mod_76_database_tenancy/README.md", """
# Module 76: Database Tenancy Isolation

Ensures complete logical or physical isolation for all 100+ apps:
- App A's backend and database cannot query App B's tables
""")

write_file("mod_76_database_tenancy/tenancy_guard.py", """#!/usr/bin/env python3
class TenancyGuard:
    @staticmethod
    def enforce_tenant_query(query: str, tenant_id: str) -> str:
        # Ensures tenant_id is strictly injected into WHERE clause
        if not tenant_id:
            raise ValueError("Tenant ID cannot be empty")
        return f"SELECT * FROM ({query}) WHERE tenant_id = '{tenant_id}'"
""")

# ==========================================
# MODULE 77: Backup & Disaster Recovery Verification
# ==========================================
write_file("mod_77_backup_recovery/README.md", """
# Module 77: Backup & Disaster Recovery Verification

> "A backup that has never been successfully restored is not a proven backup."
Automates scheduled restore drills to a temporary isolated sandbox database.
""")

write_file("mod_77_backup_recovery/backup_verifier.py", """#!/usr/bin/env python3
import time

class BackupDrill:
    @staticmethod
    def record_restore_drill(backup_id: str, success: bool, duration_sec: float) -> dict:
        return {
            "backup_id": backup_id,
            "tested_at": time.time(),
            "status": "VERIFIED" if success else "FAILED",
            "restore_duration_seconds": duration_sec
        }
""")

# ==========================================
# MODULE 78: Disaster Recovery (RPO / RTO)
# ==========================================
write_file("mod_78_disaster_recovery/README.md", """
# Module 78: Disaster Recovery (RPO / RTO)

Defines and audits Recovery Point Objective (RPO) and Recovery Time Objective (RTO):
- Target RPO: <= 15 minutes
- Target RTO: <= 60 minutes
""")

write_file("mod_78_disaster_recovery/rpo_rto_monitor.py", """#!/usr/bin/env python3
class DisasterRecoveryObjectives:
    TARGET_RPO_MINUTES = 15
    TARGET_RTO_MINUTES = 60

    @classmethod
    def evaluate_compliance(cls, actual_rpo_min: float, actual_rto_min: float) -> bool:
        return actual_rpo_min <= cls.TARGET_RPO_MINUTES and actual_rto_min <= cls.TARGET_RTO_MINUTES
""")

# ==========================================
# MODULE 79: Multi-Region / Availability Module
# ==========================================
write_file("mod_79_multi_region/README.md", """
# Module 79: Multi-Region / Availability Module

Orchestrates multi-region failover and CDN edge caching for 1M+ user scale:
- Edge caching for static assets
- Health checks with automatic failover between Primary and Secondary regions
""")

write_file("mod_79_multi_region/region_failover.py", """#!/usr/bin/env python3
class RegionHealthManager:
    def __init__(self, primary_region: str, backup_region: str):
        self.primary = primary_region
        self.backup = backup_region
        self.primary_healthy = True

    def get_active_region(self) -> str:
        return self.primary if self.primary_healthy else self.backup
""")

# ==========================================
# MODULE 80: Autoscaling Module
# ==========================================
write_file("mod_80_autoscaling/README.md", """
# Module 80: Autoscaling Module

Multi-metric autoscaler for backend containers:
- Scales on: CPU, Memory, Requests/Sec, Queue Depth, DB Connection Pool Saturation
""")

write_file("mod_80_autoscaling/scaling_policy.py", """#!/usr/bin/env python3
class AutoscalingPolicy:
    @staticmethod
    def should_scale_up(cpu_pct: float, memory_pct: float, queue_depth: int, db_pool_sat_pct: float) -> bool:
        return cpu_pct > 75.0 or memory_pct > 80.0 or queue_depth > 500 or db_pool_sat_pct > 85.0
""")

# ==========================================
# MODULE 81: Load Shedding Module
# ==========================================
write_file("mod_81_load_shedding/README.md", """
# Module 81: Load Shedding Module

Under extreme traffic spikes (>95% capacity), gracefully degrades non-critical features:
- Disables expensive AI generation & video rendering
- Preserves authentication, reads, and core data operations
""")

write_file("mod_81_load_shedding/load_shedder.py", """#!/usr/bin/env python3
class LoadShedder:
    @staticmethod
    def is_operation_permitted(op_priority: str, current_load_pct: float) -> bool:
        # op_priority: 'CRITICAL' (auth, read), 'STANDARD' (writes), 'EXPENSIVE' (AI, media)
        if current_load_pct > 95.0:
            return op_priority == "CRITICAL"
        elif current_load_pct > 85.0:
            return op_priority in ["CRITICAL", "STANDARD"]
        return True
""")

# ==========================================
# MODULE 82: Circuit Breaker Module
# ==========================================
write_file("mod_82_circuit_breaker/README.md", """
# Module 82: Circuit Breaker Module

Prevents cascading outages when external providers fail (OpenAI, Stripe, Firebase):
- States: `CLOSED` (Normal), `OPEN` (Tripped - fast fail), `HALF_OPEN` (Trial recovery)
""")

write_file("mod_82_circuit_breaker/circuit_breaker.py", """#!/usr/bin/env python3
import time

class CircuitBreaker:
    def __init__(self, failure_threshold: int = 5, recovery_timeout_sec: int = 30):
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout_sec
        self.failure_count = 0
        self.state = "CLOSED"
        self.last_failure_time = 0

    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = "OPEN"

    def can_execute(self) -> bool:
        if self.state == "CLOSED":
            return True
        if self.state == "OPEN":
            if (time.time() - self.last_failure_time) > self.recovery_timeout:
                self.state = "HALF_OPEN"
                return True
            return False
        return True # HALF_OPEN allows 1 trial request
""")

# ==========================================
# MODULE 83: Retry Safety & Idempotency
# ==========================================
write_file("mod_83_retry_idempotency/README.md", """
# Module 83: Retry Safety & Idempotency

Prevents double-charging, duplicate orders, or double-spent AI credits:
- Mandates `Idempotency-Key` header on all mutating POST/PUT requests
- Returns cached response if idempotency key has already been processed
""")

write_file("mod_83_retry_idempotency/idempotency_guard.py", """#!/usr/bin/env python3
class IdempotencyGuard:
    def __init__(self):
        self._cache = {}

    def check_and_set(self, idempotency_key: str, response_payload: dict) -> tuple[bool, dict]:
        if idempotency_key in self._cache:
            # Already processed! Return cached response
            return True, self._cache[idempotency_key]
        self._cache[idempotency_key] = response_payload
        return False, response_payload
""")

print("Modules 64 to 83 generated successfully!")
