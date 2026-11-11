import ipaddress
import urllib.parse

class SsrfFirewall:
    FORBIDDEN_SUBNETS = [
        ipaddress.ip_network("0.0.0.0/8"),
        ipaddress.ip_network("10.0.0.0/8"),
        ipaddress.ip_network("100.64.0.0/10"),     # CGNAT
        ipaddress.ip_network("127.0.0.0/8"),
        ipaddress.ip_network("169.254.0.0/16"),   # AWS/GCP/Azure link-local & metadata
        ipaddress.ip_network("172.16.0.0/12"),
        ipaddress.ip_network("192.168.0.0/16"),
        ipaddress.ip_network("198.18.0.0/15"),    # Benchmark tests
        ipaddress.ip_network("240.0.0.0/4"),      # Reserved
        ipaddress.ip_network("::1/128"),
        ipaddress.ip_network("fc00::/7"),         # Unique local address
        ipaddress.ip_network("fe80::/10"),        # Link-local IPv6
        ipaddress.ip_network("::ffff:0:0/96"),    # IPv4-mapped IPv6
    ]

    @classmethod
    def is_safe_url(cls, url: str) -> bool:
        if not url or "\x00" in url:
            return False
        try:
            parsed = urllib.parse.urlparse(url)
            if parsed.scheme.lower() not in ["http", "https"]:
                return False
            hostname = parsed.hostname
            if not hostname:
                return False

            # Block embedded credentials
            if parsed.username or parsed.password:
                return False

            try:
                ip = ipaddress.ip_address(hostname)
                return not any(ip in subnet for subnet in cls.FORBIDDEN_SUBNETS)
            except ValueError:
                # Hostname check: block localhost, internal metadata, and local domains
                lower_host = hostname.lower()
                forbidden_hosts = {
                    "localhost", "metadata.google.internal", "instance-data",
                    "metadata", "169.254.169.254"
                }
                if lower_host in forbidden_hosts or lower_host.endswith(".local") or lower_host.endswith(".internal"):
                    return False
                return True
        except Exception:
            return False
