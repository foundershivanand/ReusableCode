#!/usr/bin/env python3
class RollbackManager:
    @staticmethod
    def calculate_rollback_target(history_tags: list) -> str:
        if len(history_tags) < 2:
            raise ValueError("No prior release tag available for rollback")
        return history_tags[-2] # Previous stable tag
