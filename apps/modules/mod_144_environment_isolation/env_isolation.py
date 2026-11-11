class EnvironmentIsolationGuard:
    @staticmethod
    def validate_isolation(env_name: str, db_host: str) -> bool:
        if env_name.lower() in ["dev", "staging"] and "prod" in db_host.lower():
            return False # Staging cannot connect to production DB!
        return True
