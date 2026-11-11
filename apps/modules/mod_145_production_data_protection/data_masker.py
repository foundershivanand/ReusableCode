import hashlib

class ProductionDataMasker:
    @staticmethod
    def mask_email(email: str) -> str:
        if "@" not in email:
            return "***"
        user, domain = email.split("@", 1)
        masked_user = user[0] + "***" if len(user) > 1 else "***"
        return f"{masked_user}@{domain}"

    @staticmethod
    def pseudonymize(identifier: str) -> str:
        return hashlib.sha256(f"salt:{identifier}".encode()).hexdigest()[:16]
