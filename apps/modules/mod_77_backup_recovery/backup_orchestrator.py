#!/usr/bin/env python3
import time
from dataclasses import dataclass

@dataclass
class BackupSnapshot:
    backup_id: str
    tenant_id: str
    created_at: float
    size_bytes: int
    is_encrypted: bool
    storage_uri: str

class BackupOrchestrator:
    def __init__(self):
        self.snapshots = []
        self.restore_drill_history = []

    def register_snapshot(self, snapshot: BackupSnapshot):
        if not snapshot.is_encrypted:
            raise ValueError("Unencrypted backups are prohibited by security policy")
        self.snapshots.append(snapshot)

    def execute_restore_drill(self, snapshot_id: str, sandbox_db_fn) -> dict:
        start = time.perf_counter()
        success = sandbox_db_fn(snapshot_id)
        duration = time.perf_counter() - start

        result = {
            "snapshot_id": snapshot_id,
            "timestamp": time.time(),
            "status": "RESTORED_SUCCESSFULLY" if success else "FAILED",
            "restore_duration_sec": round(duration, 3)
        }
        self.restore_drill_history.append(result)
        return result
