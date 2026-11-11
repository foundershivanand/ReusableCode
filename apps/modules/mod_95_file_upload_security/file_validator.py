class FileUploadValidator:
    MAGIC_HEADERS = {
        "jpg": b"\xff\xd8\xff",
        "png": b"\x89PNG\r\n\x1a\n",
        "pdf": b"%PDF-",
        "webp": b"RIFF"
    }

    @classmethod
    def validate_file(cls, filename: str, content: bytes, max_bytes: int = 10485760) -> dict:
        if len(content) > max_bytes:
            return {"is_valid": False, "error": "File size exceeds limit"}
        ext = filename.split(".")[-1].lower() if "." in filename else ""
        expected_magic = cls.MAGIC_HEADERS.get(ext)
        if expected_magic and not content.startswith(expected_magic):
            return {"is_valid": False, "error": "MIME magic header mismatch (potential polyglot file)"}
        return {"is_valid": True, "error": None}
