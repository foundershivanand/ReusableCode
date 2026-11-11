#!/usr/bin/env python3
import uuid

class SyntheticDataGenerator:
    @staticmethod
    def generate_mock_user() -> dict:
        uid = str(uuid.uuid4())[:8]
        return {
            "id": f"user_mock_{uid}",
            "email": f"mock.{uid}@example.internal",
            "name": f"Synthetic User {uid}",
            "subscription": "pro"
        }
