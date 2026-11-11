from enum import Enum
from typing import Dict

class DataSensitivity(Enum):
    PUBLIC = "PUBLIC"
    INTERNAL = "INTERNAL"
    CONFIDENTIAL = "CONFIDENTIAL"
    RESTRICTED = "RESTRICTED"

class DataClassifier:
    CLASSIFICATIONS = {
        "user_id": DataSensitivity.INTERNAL,
        "email": DataSensitivity.RESTRICTED,
        "password_hash": DataSensitivity.RESTRICTED,
        "app_version": DataSensitivity.PUBLIC,
        "invoice_total": DataSensitivity.CONFIDENTIAL
    }

    @classmethod
    def classify_field(cls, field_name: str) -> DataSensitivity:
        return cls.CLASSIFICATIONS.get(field_name, DataSensitivity.INTERNAL)
