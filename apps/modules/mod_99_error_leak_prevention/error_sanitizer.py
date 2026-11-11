import uuid

class ProductionErrorSanitizer:
    @staticmethod
    def sanitize(exc: Exception) -> dict:
        incident_id = f"err_{uuid.uuid4().hex[:12]}"
        # Conceal internal stack traces, DB connection strings, and server internals
        return {
            "error": "Internal Server Error",
            "code": "GENERIC_ERROR",
            "incident_id": incident_id,
            "message": "An unexpected error occurred. Please contact support with the incident ID."
        }
