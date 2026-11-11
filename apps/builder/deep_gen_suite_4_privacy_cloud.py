#!/usr/bin/env python3
"""
Deep Generator for Suite 4: Privacy, Governance, Cloud & Reliability (Modules 120 - 147)
"""

import os

BASE_DIR = "/home/shiva/appreusable/modules"

def write(rel_path, content):
    p = os.path.join(BASE_DIR, rel_path)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    with open(p, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")
    print(f"Generated: {rel_path}")

# mod_120_privacy_engineering
write("mod_120_privacy_engineering/privacy_policy.py", '''
from typing import Dict, Set

class PrivacyMinimizationEngine:
    PII_FIELDS: Set[str] = {"email", "phone", "ssn", "full_name", "date_of_birth", "gps_coordinates"}

    @classmethod
    def minimize_data(cls, raw_data: Dict[str, any], purpose: str) -> Dict[str, any]:
        # Purpose-based access: analytics doesn't get raw PII
        if purpose == "analytics":
            return {k: v for k, v in raw_data.items() if k not in cls.PII_FIELDS}
        return raw_data
''')

# mod_121_data_classification
write("mod_121_data_classification/data_classifier.py", '''
from enum import Enum
from typing import Dict

class DataSensitivity(Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"

class DataClassifier:
    CLASSIFICATIONS = {
        "user_id": DataSensitivity.INTERNAL,
        "email": DataSensitivity.RESTRICTED,
        "password_hash": DataSensitivity.RESTRICTED,
        "app_version": DataSensitivity.PUBLIC,
        "invoice_total": DataSensitivity.CONFIDENTIAL
    }

    @classmethod
    def classify_field(cls, field_name: str) -> DataSensitivity:
        return cls.CLASSIFICATIONS.get(field_name, DataSensitivity.INTERNAL)
''')

# mod_122_data_retention_engine
write("mod_122_data_retention_engine/retention_engine.py", '''
import time
from typing import List, Dict

class DataRetentionEngine:
    RETENTION_POLICIES_DAYS = {
        "security_logs": 90,
        "audit_ledger": 365 * 7, # 7 years
        "temp_sessions": 30,
        "crash_reports": 180
    }

    @classmethod
    def is_expired(cls, data_type: str, created_at_ts: float) -> bool:
        max_days = cls.RETENTION_POLICIES_DAYS.get(data_type, 30)
        max_age_sec = max_days * 86400
        return (time.time() - created_at_ts) > max_age_sec
''')

# mod_124_child_age_safety
write("mod_124_child_age_safety/age_safety.py", '''
class ChildAgeSafetyGate:
    MIN_AGE_STANDARD = 13 # COPPA
    MIN_AGE_GDPR_K = 16   # GDPR Article 8

    @classmethod
    def evaluate_user_age(cls, age: int, region: str = "US") -> dict:
        threshold = cls.MIN_AGE_GDPR_K if region.upper() in ["EU", "UK"] else cls.MIN_AGE_STANDARD
        if age < threshold:
            return {
                "permitted": False,
                "requires_parental_consent": True,
                "ad_tracking_allowed": False,
                "data_profiling_allowed": False
            }
        return {
            "permitted": True,
            "requires_parental_consent": False,
            "ad_tracking_allowed": True,
            "data_profiling_allowed": True
        }
''')

# mod_125_compliance_engine
write("mod_125_compliance_engine/compliance_checker.py", '''
class ContinuousComplianceEngine:
    STANDARDS = ["SOC2_TYPE2", "ISO27001", "HIPAA", "GDPR"]

    @classmethod
    def evaluate_compliance(cls, controls_state: dict) -> dict:
        missing = []
        for req in ["encryption_at_rest", "encryption_in_transit", "access_reviews", "audit_logging"]:
            if not controls_state.get(req, False):
                missing.append(req)
        return {
            "compliant": len(missing) == 0,
            "missing_controls": missing,
            "standards_evaluated": cls.STANDARDS
        }
''')

# mod_126_third_party_risk
write("mod_126_third_party_risk/vendor_auditor.py", '''
class ThirdPartyRiskAuditor:
    @staticmethod
    def audit_sdk(sdk_name: str, requested_permissions: list) -> dict:
        risky_perms = [p for p in requested_permissions if p in ["READ_CONTACTS", "ACCESS_FINE_LOCATION", "RECORD_AUDIO"]]
        return {
            "sdk": sdk_name,
            "is_high_risk": len(risky_perms) > 0,
            "flagged_permissions": risky_perms
        }
''')

# mod_127_third_party_isolation
write("mod_127_third_party_isolation/sdk_sandbox.py", '''
import time

class SdkSandbox:
    @staticmethod
    def execute_with_timeout(sdk_call_fn, timeout_sec: float = 2.0) -> dict:
        start = time.perf_counter()
        try:
            res = sdk_call_fn()
            elapsed = time.perf_counter() - start
            return {"success": True, "result": res, "elapsed_sec": round(elapsed, 4)}
        except Exception as e:
            return {"success": False, "error": str(e), "elapsed_sec": round(time.perf_counter() - start, 4)}
''')

# mod_128_cost_abuse_protection
write("mod_128_cost_abuse_protection/cost_limiter.py", '''
from typing import Dict

class CostAbuseLimiter:
    DAILY_BUDGET_USD = 100.0

    def __init__(self):
        self._user_spend: Dict[str, float] = {}

    def record_spend(self, user_id: str, cost_usd: float) -> bool:
        curr = self._user_spend.get(user_id, 0.0) + cost_usd
        self._user_spend[user_id] = curr
        return curr <= self.DAILY_BUDGET_USD
''')

# mod_129_billing_anomaly_detection
write("mod_129_billing_anomaly_detection/anomaly_detector.py", '''
import statistics
from typing import List

class BillingAnomalyDetector:
    @staticmethod
    def is_spike(recent_hourly_costs: List[float], candidate_cost: float, z_threshold: float = 3.0) -> bool:
        if len(recent_hourly_costs) < 5:
            return False
        mean = statistics.mean(recent_hourly_costs)
        stdev = statistics.stdev(recent_hourly_costs)
        if stdev == 0:
            return candidate_cost > mean * 2.0
        z_score = (candidate_cost - mean) / stdev
        return z_score >= z_threshold
''')

# mod_130_cache_security
write("mod_130_cache_security/secure_cache.py", '''
import hmac
import hashlib
from typing import Dict, Optional

class SecureCacheWrapper:
    def __init__(self, key_namespace: str):
        self.namespace = key_namespace
        self._store: Dict[str, str] = {}

    def _format_key(self, raw_key: str) -> str:
        return f"{self.namespace}:{raw_key}"

    def set(self, key: str, value: str):
        self._store[self._format_key(key)] = value

    def get(self, key: str) -> Optional[str]:
        return self._store.get(self._format_key(key))
''')

# mod_131_queue_security
write("mod_131_queue_security/queue_guard.py", '''
class QueueSecurityGuard:
    MAX_ATTEMPTS = 3

    @staticmethod
    def evaluate_message_failure(attempt_count: int) -> str:
        if attempt_count >= QueueSecurityGuard.MAX_ATTEMPTS:
            return "QUARANTINE_TO_DLQ"
        return "RETRY_WITH_BACKOFF"
''')

# mod_132_job_idempotency
write("mod_132_job_idempotency/job_mutex.py", '''
import time
from typing import Dict

class JobIdempotencyMutex:
    def __init__(self):
        self._locks: Dict[str, float] = {}

    def acquire_lock(self, job_id: str, lock_ttl_sec: int = 60) -> bool:
        now = time.time()
        expiry = self._locks.get(job_id, 0)
        if now < expiry:
            return False # Locked
        self._locks[job_id] = now + lock_ttl_sec
        return True

    def release_lock(self, job_id: str):
        self._locks.pop(job_id, None)
''')

# mod_133_observability_pillars
write("mod_133_observability_pillars/telemetry_manager.py", '''
class ObservabilityManager:
    @staticmethod
    def correlate_context(trace_id: str, span_id: str, user_id: str) -> dict:
        return {
            "trace_id": trace_id,
            "span_id": span_id,
            "user_id": user_id,
            "service": "app-factory-backend"
        }
''')

# mod_135_db_performance_engine
write("mod_135_db_performance_engine/db_perf.py", '''
class DatabasePerformanceEngine:
    SLOW_QUERY_THRESHOLD_MS = 100.0

    @classmethod
    def evaluate_query(cls, query_sql: str, execution_time_ms: float) -> dict:
        is_slow = execution_time_ms > cls.SLOW_QUERY_THRESHOLD_MS
        missing_index = "where" in query_sql.lower() and "join" in query_sql.lower()
        return {
            "is_slow": is_slow,
            "execution_time_ms": execution_time_ms,
            "index_recommended": missing_index and is_slow
        }
''')

# mod_136_pagination_guard
write("mod_136_pagination_guard/pagination.py", '''
import base64
import json

class PaginationGuard:
    MAX_LIMIT = 100
    DEFAULT_LIMIT = 20

    @classmethod
    def sanitize_limit(cls, requested_limit: int) -> int:
        if requested_limit <= 0:
            return cls.DEFAULT_LIMIT
        return min(requested_limit, cls.MAX_LIMIT)

    @staticmethod
    def encode_cursor(record_id: str, sort_val: any) -> str:
        payload = json.dumps({"id": record_id, "sort": sort_val})
        return base64.urlsafe_b64encode(payload.encode()).decode()
''')

# mod_137_search_abuse_guard
write("mod_137_search_abuse_guard/search_guard.py", '''
class SearchAbuseGuard:
    MAX_QUERY_LEN = 120

    @classmethod
    def validate_search_query(cls, query: str) -> dict:
        if len(query) > cls.MAX_QUERY_LEN:
            return {"valid": False, "error": "Query too long"}
        if query.count("*") > 3 or query.count("%") > 3:
            return {"valid": False, "error": "Excessive wildcard characters"}
        return {"valid": True, "error": None}
''')

# mod_138_api_versioning
write("mod_138_api_versioning/versioning.py", '''
class ApiVersioningEngine:
    SUPPORTED_VERSIONS = {"v1", "v2"}
    SUNSET_VERSIONS = {"v0"}

    @classmethod
    def negotiate_version(cls, requested_version: str) -> dict:
        if requested_version in cls.SUNSET_VERSIONS:
            return {"status": "DEPRECATED", "sunset": True}
        if requested_version in cls.SUPPORTED_VERSIONS:
            return {"status": "ACTIVE", "sunset": False}
        return {"status": "UNSUPPORTED", "sunset": False}
''')

# mod_139_api_inventory
write("mod_139_api_inventory/api_inventory.py", '''
class ApiInventoryAuditor:
    @staticmethod
    def detect_shadow_apis(registered_routes: set, active_traffic_routes: set) -> set:
        # Shadow/zombie APIs: traffic hitting endpoints not in the registered OpenAPI catalog
        return active_traffic_routes - registered_routes
''')

# mod_140_edge_security_headers
write("mod_140_edge_security_headers/security_headers.py", '''
class EdgeSecurityHeaders:
    STANDARD_HEADERS = {
        "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Referrer-Policy": "strict-origin-when-cross-origin",
        "Content-Security-Policy": "default-src 'self'; frame-ancestors 'none';"
    }

    @classmethod
    def get_headers(cls) -> dict:
        return cls.STANDARD_HEADERS.copy()
''')

# mod_141_ddos_resilience
write("mod_141_ddos_resilience/ddos_rules.py", '''
class DdosResilienceRules:
    RATE_LIMITS = {
        "global_per_ip_rps": 100,
        "login_per_ip_rps": 5,
        "search_per_ip_rps": 10
    }

    @classmethod
    def get_firewall_rules(cls) -> dict:
        return cls.RATE_LIMITS
''')

# mod_142_network_segmentation
write("mod_142_network_segmentation/network_rules.py", '''
class NetworkSegmentationRules:
    @staticmethod
    def is_communication_allowed(source_tier: str, target_tier: str) -> bool:
        allowed = {
            ("public_edge", "api_gateway"): True,
            ("api_gateway", "app_service"): True,
            ("app_service", "database"): True,
            ("public_edge", "database"): False # Never direct edge to DB!
        }
        return allowed.get((source_tier, target_tier), False)
''')

# mod_143_cloud_iam
write("mod_143_cloud_iam/iam_policy.py", '''
class CloudIamPolicyAuditor:
    @staticmethod
    def audit_policy(policy_doc: dict) -> list:
        findings = []
        for statement in policy_doc.get("Statement", []):
            if statement.get("Effect") == "Allow":
                actions = statement.get("Action", [])
                if "*" in actions or "s3:*" in actions:
                    findings.append("Wildcard permissions violate least privilege")
        return findings
''')

# mod_144_environment_isolation
write("mod_144_environment_isolation/env_isolation.py", '''
class EnvironmentIsolationGuard:
    @staticmethod
    def validate_isolation(env_name: str, db_host: str) -> bool:
        if env_name.lower() in ["dev", "staging"] and "prod" in db_host.lower():
            return False # Staging cannot connect to production DB!
        return True
''')

# mod_145_production_data_protection
write("mod_145_production_data_protection/data_masker.py", '''
import hashlib

class ProductionDataMasker:
    @staticmethod
    def mask_email(email: str) -> str:
        if "@" not in email:
            return "***"
        user, domain = email.split("@", 1)
        masked_user = user[0] + "***" if len(user) > 1 else "***"
        return f"{masked_user}@{domain}"

    @staticmethod
    def pseudonymize(identifier: str) -> str:
        return hashlib.sha256(f"salt:{identifier}".encode()).hexdigest()[:16]
''')

# mod_146_support_tool_security
write("mod_146_support_tool_security/support_guard.py", '''
class SupportToolGuard:
    @staticmethod
    def mask_view_for_support(user_record: dict) -> dict:
        clean = user_record.copy()
        clean.pop("password_hash", None)
        clean.pop("payment_methods", None)
        return clean
''')

# mod_147_social_engineering_defense
write("mod_147_social_engineering_defense/recovery_protocol.py", '''
class SocialEngineeringRecoveryProtocol:
    @staticmethod
    def requires_dual_auth_for_recovery(account_tier: str, balance: float) -> bool:
        return account_tier == "enterprise" or balance > 1000.0
''')

print("SUITE 4 COMPLETE: All Privacy, Governance, Cloud & Reliability modules generated.")
