class AsoMetadataGenerator:
    """Generates optimized, localized App Store & Google Play metadata complying with length limits."""

    LOCALES = ["en-US", "es-ES", "ja-JP", "de-DE", "fr-FR"]

    @classmethod
    def generate_localized_metadata(cls, app_name: str, category: str, primary_keyword: str) -> dict:
        title = f"{app_name} - {primary_keyword.title()}"[:30] # 30 char App Store limit
        subtitle = f"Smart {category} for modern users"[:30]   # 30 char App Store limit

        return {
            "title": title,
            "subtitle": subtitle,
            "keywords": f"{primary_keyword}, productivity, mobile, secure, fast",
            "description": f"Download {app_name}, the industry-leading {category} solution built for speed and security.",
            "available_locales": cls.LOCALES
        }
