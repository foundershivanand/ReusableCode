#!/usr/bin/env python3
class DependencyPolicy:
    ALLOWED_LICENSES = {"MIT", "Apache-2.0", "BSD-2-Clause", "BSD-3-Clause"}

    @classmethod
    def evaluate_package(cls, license_spdx: str, days_since_last_update: int) -> bool:
        if license_spdx not in cls.ALLOWED_LICENSES:
            return False
        if days_since_last_update > 365:
            return False # Stale package
        return True
