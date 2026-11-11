class AiAgentTeamOrchestrator:
    AGENTS = [
        "ProductAgent",     # Generates PRD & user stories
        "ArchitectAgent",   # Generates OpenAPI & DB schema
        "FlutterAgent",     # Generates Flutter UI & client code
        "BackendAgent",     # Generates FastAPI & isolated migrations
        "QaSecurityAgent"   # Runs SAST, MASVS & security scorecard
    ]

    @classmethod
    def get_agent_team(cls) -> list:
        return cls.AGENTS
