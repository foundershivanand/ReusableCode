import json
import time
from typing import List, Dict

class SbomGenerator:
    @staticmethod
    def generate_cyclonedx_sbom(app_name: str, version: str, dependencies: List[Dict[str, str]]) -> dict:
        return {
            "bomFormat": "CycloneDX",
            "specVersion": "1.5",
            "metadata": {
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "component": {
                    "name": app_name,
                    "version": version,
                    "type": "application"
                }
            },
            "components": [
                {
                    "name": dep["name"],
                    "version": dep["version"],
                    "purl": f"pkg:pub/{dep['name']}@{dep['version']}",
                    "type": "library"
                }
                for dep in dependencies
            ]
        }
