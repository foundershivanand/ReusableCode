import base64
import json

class PaginationGuard:
    MAX_LIMIT = 100
    DEFAULT_LIMIT = 20

    @classmethod
    def sanitize_limit(cls, requested_limit: int) -> int:
        if requested_limit <= 0:
            return cls.DEFAULT_LIMIT
        return min(requested_limit, cls.MAX_LIMIT)

    @staticmethod
    def encode_cursor(record_id: str, sort_val: any) -> str:
        payload = json.dumps({"id": record_id, "sort": sort_val})
        return base64.urlsafe_b64encode(payload.encode()).decode()
