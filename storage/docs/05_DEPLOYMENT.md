# 05 — File Storage Deployment & Bucket Configuration

1. **S3 / R2 Bucket CORS Configuration**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["PUT", "GET", "HEAD"],
       "AllowedOrigins": ["https://app.yourdomain.com"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```
2. **Lifecycle Policies**:
   - Set 7-day expiration on incomplete multipart uploads (`AbortIncompleteMultipartUpload`).
   - Automatically purge files marked `deleted_at` after a 30-day retention window.
