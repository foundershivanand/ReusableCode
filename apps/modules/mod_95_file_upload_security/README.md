# Module 95: File-Upload Security Module

Never trusts extension or `Content-Type`:
- Inspects magic bytes (JPEG: `FF D8 FF`, PNG: `89 50 4E 47`, PDF: `25 50 44 46`)
- Generates randomized UUID filenames
- Direct upload via presigned S3/GCS URLs with 15-minute expiration
