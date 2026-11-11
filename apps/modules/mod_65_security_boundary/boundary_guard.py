import ipaddress
from typing import Set

class SecurityBoundaryGuard:
    def __init__(self, allowed_cidrs: Set[str], trusted_vpc_ids: Set[str]):
        self.allowed_networks = [ipaddress.ip_network(cidr) for cidr in allowed_cidrs]
        self.trusted_vpc_ids = trusted_vpc_ids

    def is_request_within_boundary(self, client_ip: str, vpc_id: str = "") -> bool:
        if vpc_id and vpc_id in self.trusted_vpc_ids:
            return True
        try:
            ip = ipaddress.ip_address(client_ip)
            return any(ip in net for net in self.allowed_networks)
        except ValueError:
            return False
