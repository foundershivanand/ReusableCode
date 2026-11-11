class ExpandContractMigration:
    """Expand-and-Contract Zero-Downtime Migration Pattern"""
    PHASES = [
        "1_EXPAND_SCHEMA",     # Add nullable new columns
        "2_DUAL_WRITE",        # App writes to both old and new columns
        "3_BACKFILL",          # Migrate historic data in background
        "4_READ_NEW",          # App switches reads to new column
        "5_CONTRACT_CLEANUP"   # Drop deprecated old column
    ]

    @classmethod
    def get_phases(cls) -> list:
        return cls.PHASES.copy()
