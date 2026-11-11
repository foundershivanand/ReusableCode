import hmac
import hashlib

class ArtifactSigningManager:
    @staticmethod
    def sign_artifact(artifact_bytes: bytes, signing_key: str) -> str:
        return hmac.new(signing_key.encode(), artifact_bytes, hashlib.sha256).hexdigest()

    @staticmethod
    def verify_artifact(artifact_bytes: bytes, signature: str, signing_key: str) -> bool:
        expected = ArtifactSigningManager.sign_artifact(artifact_bytes, signing_key)
        return hmac.compare_digest(expected, signature)
