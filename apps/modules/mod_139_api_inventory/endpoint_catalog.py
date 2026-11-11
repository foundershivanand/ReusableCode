#!/usr/bin/env python3
class EndpointCatalog:
    def __init__(self):
        self.registered_endpoints = set()

    def register(self, method: str, path: str):
        self.registered_endpoints.add(f"{method.upper()}:{path}")

    def is_shadow_endpoint(self, method: str, path: str) -> bool:
        return f"{method.upper()}:{path}" not in self.registered_endpoints
