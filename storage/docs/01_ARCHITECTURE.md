# 01 — File Storage & Media Processing Architecture

## 1. System Overview
The File Storage module provides a secure, provider-agnostic asset storage and media management pipeline. It completely isolates file transfers from web server memory by utilizing **presigned direct uploads and downloads** backed by:
- AWS S3 / MinIO
- Cloudflare R2 (zero egress fees)
- UploadThing

## 2. Storage Key Design & Isolation
User-supplied filenames are **never** used as filesystem or object storage paths. The engine generates internal object keys:
`tenants/${tenantId}/files/${fileId}.${extension}`
This design guarantees:
- Absolute tenant isolation at the object key prefix level.
- Elimination of path traversal attacks (`../`, `\`, null bytes).
- Prevention of accidental file overwrites when two users upload files with identical names.

## 3. Malware Scanning & Asynchronous State Machine
Files progress through a strict security lifecycle:
- `UPLOADING`: Presigned URL issued; client uploading directly to bucket.
- `SCANNING`: Upload complete; asynchronous antivirus worker (e.g. ClamAV / AWS GuardDuty) inspecting bytes.
- `SAFE`: Clean scan; file authorized for download; quota incremented.
- `REJECTED`: Malicious signature detected; object immediately purged from storage.
Untrusted uploads are **never** made downloadable until the scan finishes and the status transitions to `SAFE`.
