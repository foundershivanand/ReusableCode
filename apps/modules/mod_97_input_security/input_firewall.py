#!/usr/bin/env python3
import re

class InputFirewall:
    PATH_TRAVERSAL_PATTERN = re.compile(r"\.\./|\.\.\\")
    COMMAND_INJECTION_PATTERN = re.compile(r"[;&|`$><]")
    PROMPT_INJECTION_KEYWORDS = ["ignore previous instructions", "system prompt", "developer mode"]

    @classmethod
    def sanitize_input(cls, text: str) -> dict:
        lower = text.lower()
        return {
            "has_path_traversal": bool(cls.PATH_TRAVERSAL_PATTERN.search(text)),
            "has_command_chars": bool(cls.COMMAND_INJECTION_PATTERN.search(text)),
            "has_prompt_injection": any(kw in lower for kw in cls.PROMPT_INJECTION_KEYWORDS),
            "is_clean": not (bool(cls.PATH_TRAVERSAL_PATTERN.search(text)) or any(kw in lower for kw in cls.PROMPT_INJECTION_KEYWORDS))
        }
