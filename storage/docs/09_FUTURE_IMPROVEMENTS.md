# 09 — File Storage Future Improvements

1. **Automatic Image Optimization Pipeline**:
   - Serverless worker with `sharp` to automatically generate WebP/AVIF variants and responsive thumbnail sets (`128x128`, `512x512`, `1024x1024`).
2. **Video Transcoding**:
   - HLS/DASH adaptive bitrate streaming pipeline backed by AWS MediaConvert or Cloudflare Stream.
