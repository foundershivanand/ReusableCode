"""
Module 68: Golden Evaluation Datasets and Test Cases
"""

import json
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TestCase(BaseModel):
    case_id: str
    description: str
    input_prompt: str
    expected_tool_calls: List[str] = Field(default_factory=list)
    expected_output_keywords: List[str] = Field(default_factory=list)
    forbidden_output_keywords: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class GoldenDataset(BaseModel):
    dataset_id: str
    agent_target: str
    version: str = "1.0"
    test_cases: List[TestCase] = Field(default_factory=list)

    def save_to_file(self, file_path: str) -> None:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(self.model_dump_json(indent=2))

    @classmethod
    def load_from_file(cls, file_path: str) -> "GoldenDataset":
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls(**data)
