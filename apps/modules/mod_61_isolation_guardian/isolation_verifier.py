#!/usr/bin/env python3
import os
import sys
import re

class IsolationGuardian:
    @staticmethod
    def audit_app_isolation(apps_dir: str) -> dict:
        violations = []
        app_list = [d for d in os.listdir(apps_dir) if os.path.isdir(os.path.join(apps_dir, d))]

        registered_bundles = set()
        registered_dbs = set()

        for app in app_list:
            app_path = os.path.join(apps_dir, app)
            
            # Check 1: Does app have its own pubspec or config?
            pubspec = os.path.join(app_path, "pubspec.yaml")
            mobile_pubspec = os.path.join(app_path, "mobile", "pubspec.yaml")
            if not os.path.exists(pubspec) and not os.path.exists(mobile_pubspec):
                violations.append(f"App '{app}' is missing its own independent pubspec.yaml")

            # Check 2: Check for cross-app database sharing
            backend_dir = os.path.join(app_path, "backend")
            if os.path.exists(backend_dir):
                for root, _, files in os.walk(backend_dir):
                    for file in files:
                        if file.endswith((".py", ".env", ".json", ".yaml")):
                            content = open(os.path.join(root, file), "r", errors="ignore").read()
                            # Ensure database URL is app-scoped
                            db_matches = re.findall(r"(?:sqlite|postgres|mongodb)://[^\s'\"]+", content)
                            for db in db_matches:
                                if db in registered_dbs:
                                    violations.append(f"App '{app}' shares database URL with another product: {db}")
                                registered_dbs.add(db)

        return {
            "passed": len(violations) == 0,
            "scanned_apps": len(app_list),
            "violations": violations
        }

if __name__ == "__main__":
    apps_directory = "/home/shiva/appreusable/apps"
    result = IsolationGuardian.audit_app_isolation(apps_directory)
    print("Isolation Audit Result:", result)
    sys.exit(0 if result["passed"] else 1)
