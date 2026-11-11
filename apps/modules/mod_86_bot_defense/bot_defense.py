import hashlib
import secrets

class ProofOfWorkBotDefense:
    @staticmethod
    def generate_challenge(difficulty: int = 4) -> dict:
        nonce = secrets.token_hex(16)
        prefix = "0" * difficulty
        return {"challenge": nonce, "difficulty": difficulty, "target_prefix": prefix}

    @staticmethod
    def verify_solution(challenge: str, solution_nonce: str, difficulty: int = 4) -> bool:
        h = hashlib.sha256(f"{challenge}:{solution_nonce}".encode()).hexdigest()
        return h.startswith("0" * difficulty)
