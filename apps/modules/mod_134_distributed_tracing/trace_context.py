#!/usr/bin/env python3
import uuid

class TraceContext:
    @staticmethod
    def generate_trace_id() -> str:
        return uuid.uuid4().hex
