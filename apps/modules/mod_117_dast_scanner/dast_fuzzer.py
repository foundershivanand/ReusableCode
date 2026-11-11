class DastFuzzerEngine:
    PAYLOADS = [
        "' OR '1'='1",
        "../../../../etc/passwd",
        "<script>alert(1)</script>",
        "${7*7}"
    ]

    @classmethod
    def get_fuzz_payloads(cls) -> list:
        return cls.PAYLOADS
