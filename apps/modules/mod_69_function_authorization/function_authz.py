from typing import Dict, Set, List

class FunctionAuthorizer:
    """OWASP API5:2023 Broken Function Level Authorization Guard"""
    ROLE_PERMISSIONS: Dict[str, Set[str]] = {
        "viewer": {"read:items", "read:profile"},
        "editor": {"read:items", "read:profile", "write:items", "update:profile"},
        "admin":  {"read:items", "read:profile", "write:items", "update:profile", "delete:items", "manage:users", "view:audit"},
        "superadmin": {"*"}
    }

    @classmethod
    def has_permission(cls, user_roles: List[str], required_permission: str) -> bool:
        for r in user_roles:
            perms = cls.ROLE_PERMISSIONS.get(r, set())
            if "*" in perms or required_permission in perms:
                return True
        return False
