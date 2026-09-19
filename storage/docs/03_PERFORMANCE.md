# 03 — File Storage Performance & Streaming

## 1. Direct-to-Storage Architecture
Large media files (up to 50MB–5GB) never pass through application server memory. The client uploads directly to S3 / Cloudflare R2 via presigned PUT requests. This ensures web server CPU and RAM remain unimpacted during heavy upload spikes.

## 2. Range Requests & Streaming
Media previews and video playback leverage HTTP range requests (`Range: bytes=0-1048575`), enabling instant playback without downloading the entire asset.
