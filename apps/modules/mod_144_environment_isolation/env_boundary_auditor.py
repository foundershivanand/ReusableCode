#!/usr/bin/env python3
class EnvironmentBoundaryAuditor:
    @staticmethod
    def verify_no_cross_contamination(dev_config: dict, prod_config: dict) -> bool:
        # DB URLs, S3 buckets, and Auth domains must be completely disjoint
        for key in ["db_url", "bucket_name", "api_key"]:
            if dev_config.get(key) and dev_config.get(key) == prod_config.get(key):
                return False
        return True
