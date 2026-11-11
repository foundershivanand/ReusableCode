#!/usr/bin/env python3
import time
import json
import hashlib
from typing import List, Optional

class ImmutableAuditRecord:
    def __init__(
        self,
        who: str,
        what: str,
        target_resource: str,
        result: str,
        ip_address: str,
        correlation_id: str,
        previous_hash: str = ""
    ):
        self.timestamp = time.time()
        self.who = who
        self.what = what
        self.target_resource = target_resource
        self.result = result
        self.ip_address = ip_address
        self.correlation_id = correlation_id
        self.previous_hash = previous_hash
        self.hash = self._calculate_hash()

    def _calculate_hash(self) -> str:
        payload = f"{self.timestamp}:{self.who}:{self.what}:{self.target_resource}:{self.result}:{self.ip_address}:{self.correlation_id}:{self.previous_hash}"
        return hashlib.sha256(payload.encode()).hexdigest()

    def to_dict(self) -> dict:
        return {
            "timestamp": self.timestamp,
            "who": self.who,
            "what": self.what,
            "target_resource": self.target_resource,
            "result": self.result,
            "ip_address": self.ip_address,
            "correlation_id": self.correlation_id,
            "previous_hash": self.previous_hash,
            "hash": self.hash
        }

class ImmutableAuditLog:
    def __init__(self):
        self._chain: List[ImmutableAuditRecord] = []

    def append(self, who: str, what: str, target: str, result: str, ip: str, corr_id: str) -> ImmutableAuditRecord:
        prev_hash = self._chain[-1].hash if self._chain else "0" * 64
        record = ImmutableAuditRecord(who, what, target, result, ip, corr_id, prev_hash)
        self._chain.append(record)
        return record

    def verify_chain_integrity(self) -> bool:
        for i, record in enumerate(self._chain):
            if record.hash != record._calculate_hash():
                return False
            if i > 0 and record.previous_hash != self._chain[i - 1].hash:
                return False
        return True
