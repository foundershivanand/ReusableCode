import os
import re
from typing import List, Dict

class ArchitectureBoundaryLinter:
    """Enforces Clean Architecture layers: Presentation -> Domain <- Data.
    Domain must never import presentation or data layers."""

    @staticmethod
    def lint_imports(layer: str, imported_layers: List[str]) -> bool:
        if layer == "domain":
            return "data" not in imported_layers and "presentation" not in imported_layers
        return True

    @classmethod
    def scan_file_imports(cls, file_path: str, code_content: str) -> List[str]:
        violations = []
        is_domain = "/domain/" in file_path
        if is_domain:
            for line in code_content.splitlines():
                if "import" in line and ("/data/" in line or "/presentation/" in line):
                    violations.append(f"Domain layer violation: {line.strip()}")
        return violations
