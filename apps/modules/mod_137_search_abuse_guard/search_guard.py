class SearchAbuseGuard:
    MAX_QUERY_LEN = 120

    @classmethod
    def validate_search_query(cls, query: str) -> dict:
        if len(query) > cls.MAX_QUERY_LEN:
            return {"valid": False, "error": "Query too long"}
        if query.count("*") > 3 or query.count("%") > 3:
            return {"valid": False, "error": "Excessive wildcard characters"}
        return {"valid": True, "error": None}
