import re

class OutputShaper:
    SENSITIVE_KEYS = {"password", "password_hash", "token", "secret", "aws_secret", "stripe_key", "internal_id"}

    @classmethod
    def shape_response(cls, data: any) -> any:
        if isinstance(data, dict):
            clean = {}
            for k, v in data.items():
                if k in cls.SENSITIVE_KEYS:
                    continue
                clean[k] = cls.shape_response(v)
            return clean
        elif isinstance(data, list):
            return [cls.shape_response(x) for x in data]
        return data
