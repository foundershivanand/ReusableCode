# 02 — File Storage Security & Threat Mitigation

## 1. Content Inspection & Magic Bytes
Clients can falsify HTTP `Content-Type` headers. The engine performs:
- **Extension Allowlisting**: Rejects executable extensions (`.exe`, `.sh`, `.php`, `.js`, `.html`).
- **Magic Bytes Validation**: Verifies binary headers match claimed formats (PNG: `89 50 4E 47`, JPEG: `FF D8 FF`, PDF: `%PDF`, GIF: `GIF8`).
- **Dangerous SVG Sanitization**: Inspects SVG files for embedded `<script>`, event handlers (`onload=`, `onerror=`), and XML external entity (`<!ENTITY`) definitions.

## 2. Quota & DoS Defenses
- **Per-File Size Caps**: Configured on the presigned URL (`Content-Length` constraint in S3 policy).
- **Aggregate Tenant Quotas**: Checked atomically before issuing upload credentials.
- **Decompression Bomb Protection**: Archive and image processing limits uncompressed dimensions.

## 3. Object Authorization
Possession of an object key or UUID does not grant access:
- Downloads require server-generated signed URLs (`getPresignedDownloadUrl`).
- The server validates that `file.tenantId === caller.tenantId` and `file.scanStatus === "SAFE"`.
