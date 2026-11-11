import hashlib
import tarfile
import io
import os
from typing import Dict, Tuple

class ReproducibleBuildVerifier:
    """Verifies deterministic, bit-for-bit reproducible builds by stripping non-deterministic metadata."""

    @staticmethod
    def normalize_tarball(file_entries: Dict[str, bytes]) -> bytes:
        """Creates a deterministic tarball with zeroed timestamps, sorted entries, and uniform permissions."""
        buf = io.BytesIO()
        with tarfile.open(fileobj=buf, mode="w:gz", format=tarfile.PAX_FORMAT) as tar:
            for name in sorted(file_entries.keys()):
                data = file_entries[name]
                info = tarfile.TarInfo(name=name)
                info.size = len(data)
                info.mtime = 0 # Epoch zero
                info.uid = 0
                info.gid = 0
                info.uname = "root"
                info.gname = "root"
                info.mode = 0o644 if not name.endswith(".sh") else 0o755
                tar.addfile(info, io.BytesIO(data))
        return buf.getvalue()

    @classmethod
    def verify_reproducibility(cls, build_a_bytes: bytes, build_b_bytes: bytes) -> Tuple[bool, str, str]:
        hash_a = hashlib.sha256(build_a_bytes).hexdigest()
        hash_b = hashlib.sha256(build_b_bytes).hexdigest()
        is_reproducible = hash_a == hash_b
        return is_reproducible, hash_a, hash_b
