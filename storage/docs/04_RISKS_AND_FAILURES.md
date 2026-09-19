# 04 — File Storage Risks & Recovery

1. **Orphan Storage Accumulation**:
   - Scenario A: Presigned URL created in DB, but client closes tab before uploading.
   - Scenario B: Direct upload succeeds to S3, but network drops before DB record completes.
   - Recovery: `cleanupOrphanUploads()` background cron checks files older than 1 hour, reconciling database entries with storage provider reality.
2. **Malicious Zero-Day Uploads**:
   - Asynchronous scanner holds files in `SCANNING` until verified clean.
   - In case of delayed detection, admin `deleteFile()` instantly purges the file and revokes active signed URLs.
