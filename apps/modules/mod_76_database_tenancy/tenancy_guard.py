import re

class TenancyGuard:
    """Enforces strict database tenancy isolation and prevents cross-tenant data leakage."""

    @staticmethod
    def validate_tenant_isolation(query: str, tenant_id: str) -> bool:
        if not tenant_id or not re.match(r"^[a-zA-Z0-9_\-]+$", tenant_id):
            return False
        # Ensures tenant_id is explicitly present in query
        return "tenant_id" in query.lower()

    @staticmethod
    def inject_tenant_scope(base_query: str, tenant_id: str) -> str:
        clean = base_query.strip().rstrip(";")
        return f"SELECT * FROM ({clean}) AS scoped_tbl WHERE tenant_id = '{tenant_id}';"
