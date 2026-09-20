# Turso File Storage (Code & PDF Repository)

A production-grade, reusable storage solution powered by [Turso](https://turso.tech/) (libSQL / SQLite) for storing code files, PDFs, and documents with simple username/password authentication.

## Features

- 🗄️ **Turso & libSQL Native**: Works seamlessly with Turso Cloud (`libsql://...`) and local SQLite/libSQL files (`file:turso_files.db`).
- 📄 **Code & PDF Storage**:
  - Code & text files (`.ts`, `.tsx`, `.json`, `.sql`, `.md`, etc.) stored as UTF-8 text with full-text search capability.
  - PDF & binary files (`.pdf`, images, etc.) stored as binary BLOBs with exact byte parity and streaming downloads.
- ⚡ **Incremental Ingestion**: Scans the workspace, hashes contents via SHA256, and skips unchanged files for ultra-fast syncs.
- 🔐 **Simple Username & Password Auth**:
  - Configurable via `.env` (`ADMIN_USERNAME` and `ADMIN_PASSWORD`).
  - Supports HTTP Basic Auth (`Authorization: Basic base64(user:pass)`).
  - Supports Bearer session tokens via `POST /api/login`.
  - Supports browser cookies for web dashboard access.
- 🖥️ **Interactive Web UI**:
  - Real-time search by path, name, or extension.
  - Category filters: Code, PDFs, Documents, Images.
  - Code viewer with line numbers and copy-to-clipboard.
  - Embedded PDF previewer & direct file downloads.
  - "Sync Codebase" button to trigger one-click ingestion.
  - Drag-and-drop or file picker upload.
- 🔌 **Storage Module Adapter**: Implements `StorageProvider` in `storage/providers/turso-adapter.ts` for drop-in reuse across any product.

---

## Configuration

Create a `.env` file in the project root:

```env
# Turso Database URL
# For Turso Cloud:
TURSO_DATABASE_URL=libsql://your-db-name-your-org.turso.io
TURSO_AUTH_TOKEN=your-turso-auth-token

# For Local Development / Testing:
# TURSO_DATABASE_URL=file:turso_files.db
# TURSO_AUTH_TOKEN=

# Simple Username & Password
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123

# Server Port
PORT=3000
```

---

## Quick Start Commands

### 1. Ingest Code Files & PDFs into Turso
```bash
# Scan and ingest all files into Turso
pnpm turso:ingest
```

### 2. Start the Web UI & REST API Server
```bash
pnpm turso:serve
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Username**: `admin`
- **Password**: `admin123`

### 3. View Storage Statistics
```bash
pnpm turso:stats
```

### 4. List Stored Files in Terminal
```bash
pnpm turso:list 50
```

---

## REST API Reference

All protected endpoints accept either:
- Header: `Authorization: Basic <base64(user:pass)>`
- Header: `Authorization: Bearer <token>`
- Cookie: `auth_token=<token>`
- Query string: `?token=<token>` (for iframe / PDF downloads)

### `POST /api/login`
Authenticate with username and password.
- **Body**: `{ "username": "admin", "password": "admin123" }`
- **Response**: `{ "success": true, "token": "...", "username": "admin" }`

### `GET /api/stats`
Get overall storage metrics and breakdown by category.
- **Response**:
  ```json
  {
    "totalFiles": 128,
    "totalSizeBytes": 4512000,
    "categoryBreakdown": {
      "code": 110,
      "pdf": 2,
      "document": 16
    }
  }
  ```

### `GET /api/files`
Query stored files with optional filters.
- **Query Parameters**:
  - `search`: search substring in path/filename
  - `category`: `code`, `pdf`, `document`, `image`, `data`, `other`
  - `extension`: e.g. `.ts` or `pdf`
  - `limit`: number of results (default 50)
  - `offset`: pagination offset
- **Response**: `{ "files": [...], "total": 128, "limit": 50, "offset": 0 }`

### `GET /api/files/:id`
Get file metadata and text content (for code/docs).

### `GET /api/files/:id/download`
Stream the raw file content with appropriate `Content-Type` (e.g. `application/pdf` for PDFs, `text/typescript` for TypeScript).

### `POST /api/sync`
Trigger re-scanning and ingestion of the workspace directory.

### `POST /api/upload`
Upload a new code file or PDF.
- **Supports**: `multipart/form-data` with fields `path` and `file`.
- **Supports**: `application/json` with `{ "path": "...", "contentText": "..." }` or `{ "path": "...", "contentBase64": "...", "mimeType": "..." }`.

---

## Programmatic Usage (`StorageProvider` Adapter)

```typescript
import { TursoStorageAdapter } from "./storage/providers/turso-adapter.js";

const storage = new TursoStorageAdapter();
await storage.initialize();

// Store a code file or PDF
await storage.storeFile("reports/summary.pdf", pdfBuffer, "application/pdf");

// Check if file exists
const exists = await storage.objectExists("reports/summary.pdf");

// Get presigned download URL
const downloadUrl = await storage.getPresignedDownloadUrl({
  storageKey: "reports/summary.pdf"
});

// Retrieve file directly
const file = await storage.retrieveFile("reports/summary.pdf");
console.log(file.size_bytes, file.sha256);
```
