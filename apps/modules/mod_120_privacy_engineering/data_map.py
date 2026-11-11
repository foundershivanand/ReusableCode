#!/usr/bin/env python3
class DataMapEntry:
    def __init__(self, data_item: str, purpose: str, storage: str, retention_days: int):
        self.data_item = data_item
        self.purpose = purpose
        self.storage = storage
        self.retention_days = retention_days
