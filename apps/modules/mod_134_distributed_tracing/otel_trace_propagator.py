#!/usr/bin/env python3
import uuid
import os

class OpenTelemetryTracePropagator:
    @staticmethod
    def generate_traceparent() -> str:
        # W3C Trace Context Specification
        version = "00"
        trace_id = uuid.uuid4().hex # 32 hex chars
        parent_id = uuid.uuid4().hex[:16] # 16 hex chars
        trace_flags = "01" # Recorded
        return f"{version}-{trace_id}-{parent_id}-{trace_flags}"

    @staticmethod
    def parse_traceparent(header_value: str) -> dict:
        parts = header_value.split("-")
        if len(parts) != 4:
            return {"valid": False}
        return {
            "valid": True,
            "version": parts[0],
            "trace_id": parts[1],
            "parent_id": parts[2],
            "is_sampled": parts[3] == "01"
        }
