import hashlib
from typing import Dict, List

class CellularBlastRadiusController:
    """Partitions apps and tenants into independent isolated cells to limit outage/breach blast radius."""

    TOTAL_CELLS = 8

    @classmethod
    def assign_tenant_to_cell(cls, tenant_id: str) -> int:
        h = int(hashlib.sha256(tenant_id.encode("utf-8")).hexdigest(), 16)
        return (h % cls.TOTAL_CELLS) + 1

    @classmethod
    def get_cell_routing(cls, tenant_id: str) -> dict:
        cell_id = cls.assign_tenant_to_cell(tenant_id)
        return {
            "tenant_id": tenant_id,
            "cell_id": cell_id,
            "cell_endpoint": f"https://cell-{cell_id}.api.factory.internal",
            "is_isolated": True
        }
