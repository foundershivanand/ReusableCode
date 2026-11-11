from typing import Optional

class BolaGuard:
    """OWASP API1:2023 Broken Object Level Authorization (BOLA) Guard"""
    @staticmethod
    def verify_ownership(
        resource_owner_id: str,
        requester_user_id: str,
        is_admin: bool = False,
        tenant_id: Optional[str] = None,
        resource_tenant_id: Optional[str] = None
    ) -> bool:
        if is_admin:
            # Even admins must match tenant boundary if multi-tenant
            if tenant_id and resource_tenant_id:
                return tenant_id == resource_tenant_id
            return True

        if tenant_id and resource_tenant_id and tenant_id != resource_tenant_id:
            return False

        return resource_owner_id == requester_user_id
