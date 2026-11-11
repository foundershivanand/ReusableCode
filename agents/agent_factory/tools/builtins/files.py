"""
Module 31: Document & File Processing Tool with Path Traversal Protection
"""

import csv
import io
import json
import os
from pathlib import Path
from typing import Any, Dict, Optional
from pydantic import BaseModel, Field

from agent_factory.core.security import RiskLevel
from agent_factory.tools.base import BaseTool


class FileParseInput(BaseModel):
    file_content: Optional[str] = Field(None, description="Raw text or string representation of file contents")
    file_path: Optional[str] = Field(None, description="Path to file on disk to inspect")
    file_type: str = Field(default="txt", description="File extension / format: 'txt', 'json', 'csv', 'md'")


class FileParseOutput(BaseModel):
    file_type: str
    parsed_data: Any
    summary: str
    error: Optional[str] = None


class FileProcessingTool(BaseTool):
    tool_id = "builtin_file_processing"
    name = "file_processor"
    description = "Parses and extracts structured data from TXT, JSON, CSV, and Markdown files safely."
    risk_level = RiskLevel.LOW
    requires_human_approval = False
    input_schema = FileParseInput
    output_schema = FileParseOutput

    def __init__(self, allowed_base_dir: Optional[str] = None):
        self.allowed_base_dir = Path(allowed_base_dir or "/home/shiva/agentsreusable").resolve()

    def _validate_safe_path(self, file_path_str: str) -> Path:
        """Enforces path containment to prevent ../ directory traversal attacks."""
        resolved = (self.allowed_base_dir / file_path_str).resolve()
        if not resolved.is_relative_to(self.allowed_base_dir):
            raise PermissionError(
                f"Path Traversal Security Alert: Attempted access outside allowed base dir ({resolved})"
            )
        return resolved

    async def execute(self, **kwargs: Any) -> Dict[str, Any]:
        params = self.input_schema(**kwargs)
        ftype = params.file_type.lower()
        content = params.file_content or ""

        # Load from disk if file_path is specified
        if params.file_path:
            try:
                safe_path = self._validate_safe_path(params.file_path)
                if not safe_path.exists():
                    return FileParseOutput(
                        file_type=ftype,
                        parsed_data=None,
                        summary="",
                        error=f"File not found: {params.file_path}"
                    ).model_dump()
                with open(safe_path, "r", encoding="utf-8") as f:
                    content = f.read()
            except Exception as e:
                return FileParseOutput(
                    file_type=ftype,
                    parsed_data=None,
                    summary="",
                    error=f"Security Error reading file: {e}"
                ).model_dump()

        if ftype == "json":
            try:
                data = json.loads(content)
                return FileParseOutput(
                    file_type="json",
                    parsed_data=data,
                    summary=f"Successfully parsed JSON object with {len(data) if isinstance(data, (dict, list)) else 1} entries."
                ).model_dump()
            except Exception as e:
                return FileParseOutput(
                    file_type="json",
                    parsed_data=None,
                    summary=f"Failed to parse JSON: {e}",
                    error=str(e)
                ).model_dump()

        elif ftype == "csv":
            try:
                reader = csv.DictReader(io.StringIO(content))
                rows = list(reader)
                return FileParseOutput(
                    file_type="csv",
                    parsed_data=rows,
                    summary=f"Successfully parsed CSV with {len(rows)} rows."
                ).model_dump()
            except Exception as e:
                return FileParseOutput(
                    file_type="csv",
                    parsed_data=None,
                    summary=f"Failed to parse CSV: {e}",
                    error=str(e)
                ).model_dump()

        return FileParseOutput(
            file_type=ftype,
            parsed_data=content,
            summary=f"Loaded {len(content)} characters of text."
        ).model_dump()
