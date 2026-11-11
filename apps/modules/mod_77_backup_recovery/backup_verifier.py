#!/usr/bin/env python3
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
