import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { URL } from "node:url";
import { getConfig } from "./config.ts";
import { TursoStorageService } from "./service.ts";
import {
  authenticateRequest,
  verifyCredentials,
  generateToken,
  verifyToken,
} from "./auth.ts";
import { ingestDirectory } from "./ingest.ts";

const service = new TursoStorageService();

function parseCookies(cookieHeader?: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const key = parts.shift()?.trim();
    if (key) {
      list[key] = decodeURIComponent(parts.join("=").trim());
    }
  });
  return list;
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendUnauthorized(res: ServerResponse): void {
  sendJson(res, 401, { error: "Unauthorized. Please provide valid credentials." });
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function parseMultipart(
  body: Buffer,
  boundary: string
): { fields: Record<string, string>; files: Array<{ name: string; filename: string; contentType: string; data: Buffer }> } {
  const fields: Record<string, string> = {};
  const files: Array<{ name: string; filename: string; contentType: string; data: Buffer }> = [];

  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = body.indexOf(boundaryBuffer);

  while (start !== -1) {
    const nextStart = body.indexOf(boundaryBuffer, start + boundaryBuffer.length);
    if (nextStart === -1) break;

    const part = body.subarray(start + boundaryBuffer.length, nextStart);
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));

    if (headerEnd !== -1) {
      const headerStr = part.subarray(0, headerEnd).toString("utf-8");
      // Skip the \r\n\r\n at the beginning and the \r\n at the end
      let data = part.subarray(headerEnd + 4);
      if (data.subarray(data.length - 2).toString() === "\r\n") {
        data = data.subarray(0, data.length - 2);
      }

      const dispositionMatch = headerStr.match(/Content-Disposition:\s*form-data;\s*name="([^"]+)"(?:;\s*filename="([^"]+)")?/i);
      if (dispositionMatch) {
        const fieldName = dispositionMatch[1];
        const filename = dispositionMatch[2];

        if (filename) {
          const typeMatch = headerStr.match(/Content-Type:\s*([^\r\n]+)/i);
          const contentType = typeMatch ? typeMatch[1].trim() : "application/octet-stream";
          files.push({ name: fieldName, filename, contentType, data });
        } else {
          fields[fieldName] = data.toString("utf-8");
        }
      }
    }

    start = nextStart;
  }

  return { fields, files };
}

export function createTursoStorageServer() {
  return createServer(async (req, res) => {
    const config = getConfig();
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;

    // CORS headers for local/cross-origin development
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // Serve Frontend Static UI
    if (pathname === "/" || pathname === "/index.html") {
      const indexPath = resolve(import.meta.dirname || process.cwd(), "public/index.html");
      if (existsSync(indexPath)) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(readFileSync(indexPath));
        return;
      }
    }

    // Public / Authentication Endpoint: POST /api/login
    if (pathname === "/api/login" && req.method === "POST") {
      try {
        const raw = await readBody(req);
        const { username, password } = JSON.parse(raw.toString("utf-8"));

        if (verifyCredentials(username, password)) {
          const token = generateToken(username);
          res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
          sendJson(res, 200, { success: true, token, username });
        } else {
          sendJson(res, 401, { error: "Invalid username or password" });
        }
      } catch (err: any) {
        sendJson(res, 400, { error: "Malformed login request: " + err.message });
      }
      return;
    }

    // Public / Logout Endpoint: POST /api/logout
    if (pathname === "/api/logout" && req.method === "POST") {
      res.setHeader("Set-Cookie", "auth_token=; Path=/; Max-Age=0");
      sendJson(res, 200, { success: true });
      return;
    }

    // Protected Endpoints - Verify Auth (Bearer, Basic, Cookie, or Query Token for downloads)
    let auth = authenticateRequest(req);
    if (!auth.authenticated) {
      const queryToken = parsedUrl.searchParams.get("token");
      if (queryToken) {
        auth = verifyToken(queryToken);
      }
    }

    if (!auth.authenticated) {
      sendUnauthorized(res);
      return;
    }

    // API: GET /api/stats
    if (pathname === "/api/stats" && req.method === "GET") {
      try {
        const stats = await service.getStats();
        sendJson(res, 200, stats);
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // API: GET /api/files
    if (pathname === "/api/files" && req.method === "GET") {
      try {
        const search = parsedUrl.searchParams.get("search") || undefined;
        const category = parsedUrl.searchParams.get("category") || undefined;
        const extension = parsedUrl.searchParams.get("extension") || undefined;
        const limit = parseInt(parsedUrl.searchParams.get("limit") || "50", 10);
        const offset = parseInt(parsedUrl.searchParams.get("offset") || "0", 10);

        const data = await service.listFiles({ search, category, extension, limit, offset });
        sendJson(res, 200, data);
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // API: GET /api/files/:id/download
    const downloadMatch = pathname.match(/^\/api\/files\/([^/]+)\/download$/);
    if (downloadMatch && req.method === "GET") {
      try {
        const fileId = downloadMatch[1];
        const record = await service.getFileById(fileId);
        if (!record) {
          sendJson(res, 404, { error: "File not found" });
          return;
        }

        res.setHeader("Content-Type", record.mime_type || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${record.name}"`);

        if (record.is_binary && record.content_blob) {
          res.writeHead(200);
          res.end(record.content_blob);
        } else {
          res.writeHead(200);
          res.end(record.content_text || "");
        }
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // API: GET /api/files/:id
    const fileMatch = pathname.match(/^\/api\/files\/([^/]+)$/);
    if (fileMatch && req.method === "GET") {
      try {
        const fileId = fileMatch[1];
        const record = await service.getFileById(fileId);
        if (!record) {
          sendJson(res, 404, { error: "File not found" });
          return;
        }

        // Return record without large blob to prevent JSON serialization bloat
        sendJson(res, 200, {
          id: record.id,
          path: record.path,
          name: record.name,
          extension: record.extension,
          mime_type: record.mime_type,
          category: record.category,
          size_bytes: record.size_bytes,
          sha256: record.sha256,
          is_binary: Boolean(record.is_binary),
          content_text: record.content_text,
          metadata: record.metadata,
          created_at: record.created_at,
          updated_at: record.updated_at,
        });
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // API: POST /api/sync (Ingest local directory)
    if (pathname === "/api/sync" && req.method === "POST") {
      try {
        const rootDir = process.cwd();
        const result = await ingestDirectory({ rootDir }, service);
        sendJson(res, 200, { success: true, result });
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    // API: POST /api/upload
    if (pathname === "/api/upload" && req.method === "POST") {
      try {
        const contentType = req.headers["content-type"] || "";
        const bodyBuffer = await readBody(req);

        let path = "";
        let buffer: Buffer = Buffer.alloc(0);
        let customMime: string | undefined;

        if (contentType.includes("multipart/form-data")) {
          const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
          if (!boundary) {
            sendJson(res, 400, { error: "Missing multipart boundary" });
            return;
          }

          const { fields, files } = parseMultipart(bodyBuffer, boundary);
          if (files.length === 0) {
            sendJson(res, 400, { error: "No file uploaded" });
            return;
          }

          const uploadedFile = files[0];
          path = fields["path"] || uploadedFile.filename;
          buffer = uploadedFile.data;
          customMime = uploadedFile.contentType;
        } else if (contentType.includes("application/json")) {
          const json = JSON.parse(bodyBuffer.toString("utf-8"));
          path = json.path;
          if (json.contentBase64) {
            buffer = Buffer.from(json.contentBase64, "base64");
          } else if (json.contentText) {
            buffer = Buffer.from(json.contentText, "utf-8");
          }
          customMime = json.mimeType;
        } else {
          sendJson(res, 400, { error: "Unsupported Content-Type for upload" });
          return;
        }

        if (!path || buffer.length === 0) {
          sendJson(res, 400, { error: "File path and content are required" });
          return;
        }

        const resData = await service.upsertFile({
          path,
          buffer,
          customMimeType: customMime,
        });

        sendJson(res, 200, { success: true, file: resData });
      } catch (err: any) {
        sendJson(res, 500, { error: err.message });
      }
      return;
    }

    sendJson(res, 404, { error: "Not Found" });
  });
}

export async function startServer(port?: number): Promise<void> {
  const config = getConfig();
  const serverPort = port || config.port;
  await service.initialize();

  const server = createTursoStorageServer();
  server.listen(serverPort, config.host, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Turso File Storage Service running!`);
    console.log(`   - URL: http://localhost:${serverPort}`);
    console.log(`   - Database: ${config.databaseUrl}`);
    console.log(`   - Auth: Username='${config.adminUsername}' Password='${config.adminPassword}'`);
    console.log(`======================================================\n`);
  });
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith("server.ts")) {
  startServer().catch((err) => {
    console.error("Failed to start Turso storage server:", err);
    process.exit(1);
  });
}
