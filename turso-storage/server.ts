import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { resolve, normalize, basename } from "node:path";
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
import { shouldIgnore } from "./utils.ts";

const service = new TursoStorageService();

// Simple in-memory sliding-window rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, limit: number = 10, windowMs: number = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count++;
  return true;
}

function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string") {
    return forwarded.split(",")[0].trim();
  }
  return req.socket.remoteAddress || "127.0.0.1";
}

function sendJson(res: ServerResponse, statusCode: number, data: unknown): void {
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
}

function sendError(res: ServerResponse, statusCode: number, message: string, rawError?: any): void {
  const isProd = process.env.NODE_ENV === "production";
  if (rawError) {
    console.error(`[Server Error ${statusCode}]`, rawError);
  }
  sendJson(res, statusCode, {
    error: isProd && statusCode === 500 ? "Internal Server Error" : message,
  });
}

function sendUnauthorized(res: ServerResponse): void {
  sendJson(res, 401, { error: "Unauthorized. Please provide valid credentials." });
}

async function readBody(req: IncomingMessage, maxBytes: number = 30 * 1024 * 1024): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let received = 0;

    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > maxBytes) {
        req.destroy();
        reject(new Error(`Payload exceeds maximum size limit of ${maxBytes / 1024 / 1024}MB`));
        return;
      }
      chunks.push(Buffer.from(chunk));
    });

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

// Security headers applied to all responses
function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; frame-src 'self'; object-src 'self';"
  );
  if (process.env.NODE_ENV === "production") {
    res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
}

const FAVICON_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00d2ff"/><stop offset="100%" stop-color="#3a7bd5"/></linearGradient></defs><rect width="100" height="100" rx="20" fill="url(#g)"/><text x="50%" y="65%" text-anchor="middle" fill="#ffffff" font-family="system-ui,sans-serif" font-size="52" font-weight="bold">T</text></svg>`
);

export function createTursoStorageServer() {
  return createServer(async (req, res) => {
    applySecurityHeaders(res);

    const config = getConfig();
    const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = parsedUrl.pathname;
    const clientIp = getClientIp(req);

    // Restricted CORS: only allow origin if explicitly matched or same-origin
    const origin = req.headers.origin;
    const allowedOrigin = process.env.ALLOWED_ORIGIN || `http://${req.headers.host || "localhost"}`;
    if (origin && (origin === allowedOrigin || origin.startsWith("http://localhost:") || origin.startsWith("http://127.0.0.1:"))) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Access-Control-Allow-Credentials", "true");
    }
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // SEO: robots.txt
    if (pathname === "/robots.txt" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("User-agent: *\nDisallow: /api/\nAllow: /\nSitemap: /sitemap.xml\n");
      return;
    }

    // SEO: sitemap.xml
    if (pathname === "/sitemap.xml" && req.method === "GET") {
      const host = req.headers.host || "localhost:3000";
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${host}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
      res.writeHead(200, { "Content-Type": "application/xml; charset=utf-8" });
      res.end(sitemap);
      return;
    }

    // Favicon
    if (pathname === "/favicon.ico" || pathname === "/favicon.svg") {
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
      res.end(FAVICON_SVG);
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

    // Rate-limited Login: POST /api/login
    if (pathname === "/api/login" && req.method === "POST") {
      if (!checkRateLimit(clientIp, 5, 60000)) {
        sendError(res, 429, "Too many login attempts. Please wait 1 minute before trying again.");
        return;
      }

      try {
        const raw = await readBody(req, 1024 * 1024);
        const { username, password, bot_field } = JSON.parse(raw.toString("utf-8"));

        // Bot / Honeypot detection
        if (bot_field) {
          sendError(res, 400, "Bot activity detected.");
          return;
        }

        if (verifyCredentials(username, password)) {
          const token = generateToken(username);
          res.setHeader("Set-Cookie", `auth_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`);
          sendJson(res, 200, { success: true, token, username });
        } else {
          sendError(res, 401, "Invalid username or password");
        }
      } catch (err: any) {
        sendError(res, 400, "Malformed login request", err);
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
        sendError(res, 500, "Failed to retrieve statistics", err);
      }
      return;
    }

    // API: GET /api/files
    if (pathname === "/api/files" && req.method === "GET") {
      try {
        const search = parsedUrl.searchParams.get("search") || undefined;
        const category = parsedUrl.searchParams.get("category") || undefined;
        const extension = parsedUrl.searchParams.get("extension") || undefined;
        const limit = Math.min(100, Math.max(1, parseInt(parsedUrl.searchParams.get("limit") || "50", 10)));
        const offset = Math.max(0, parseInt(parsedUrl.searchParams.get("offset") || "0", 10));

        const data = await service.listFiles({ search, category, extension, limit, offset });
        sendJson(res, 200, data);
      } catch (err: any) {
        sendError(res, 500, "Failed to list files", err);
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
          sendError(res, 404, "File not found");
          return;
        }

        res.setHeader("Content-Type", record.mime_type || "application/octet-stream");
        res.setHeader("Content-Disposition", `inline; filename="${basename(record.name)}"`);

        if (record.is_binary && record.content_blob) {
          res.writeHead(200);
          res.end(record.content_blob);
        } else {
          res.writeHead(200);
          res.end(record.content_text || "");
        }
      } catch (err: any) {
        sendError(res, 500, "Failed to download file", err);
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
          sendError(res, 404, "File not found");
          return;
        }

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
        sendError(res, 500, "Failed to get file details", err);
      }
      return;
    }

    // API: POST /api/sync (Ingest local directory)
    if (pathname === "/api/sync" && req.method === "POST") {
      if (!checkRateLimit(clientIp, 3, 60000)) {
        sendError(res, 429, "Sync rate limit exceeded. Please wait a moment.");
        return;
      }

      try {
        const rootDir = process.cwd();
        const result = await ingestDirectory({ rootDir }, service);
        sendJson(res, 200, { success: true, result });
      } catch (err: any) {
        sendError(res, 500, "Sync operation failed", err);
      }
      return;
    }

    // API: POST /api/upload (Secure file upload with path traversal protection)
    if (pathname === "/api/upload" && req.method === "POST") {
      if (!checkRateLimit(clientIp, 30, 60000)) {
        sendError(res, 429, "Upload rate limit exceeded. Please slow down.");
        return;
      }

      try {
        const contentType = req.headers["content-type"] || "";
        const bodyBuffer = await readBody(req, 30 * 1024 * 1024); // 30MB limit

        let targetPath = "";
        let buffer: Buffer = Buffer.alloc(0);
        let customMime: string | undefined;

        if (contentType.includes("multipart/form-data")) {
          const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          const boundary = boundaryMatch ? boundaryMatch[1] || boundaryMatch[2] : null;
          if (!boundary) {
            sendError(res, 400, "Missing multipart boundary");
            return;
          }

          const { fields, files } = parseMultipart(bodyBuffer, boundary);
          if (files.length === 0) {
            sendError(res, 400, "No file uploaded");
            return;
          }

          const uploadedFile = files[0];
          targetPath = fields["path"] || uploadedFile.filename;
          buffer = uploadedFile.data;
          customMime = uploadedFile.contentType;
        } else if (contentType.includes("application/json")) {
          const json = JSON.parse(bodyBuffer.toString("utf-8"));
          targetPath = json.path;
          if (json.contentBase64) {
            buffer = Buffer.from(json.contentBase64, "base64");
          } else if (json.contentText) {
            buffer = Buffer.from(json.contentText, "utf-8");
          }
          customMime = json.mimeType;
        } else {
          sendError(res, 400, "Unsupported Content-Type for upload");
          return;
        }

        // Security check: Path traversal prevention & secret file blocking
        const cleanPath = normalize(targetPath).replace(/^[\\/]+/, "");
        if (cleanPath.includes("..") || cleanPath.startsWith("/") || shouldIgnore(cleanPath)) {
          sendError(res, 403, "Forbidden: Invalid or restricted file path.");
          return;
        }

        if (buffer.length === 0) {
          sendError(res, 400, "File content cannot be empty");
          return;
        }

        const resData = await service.upsertFile({
          path: cleanPath,
          buffer,
          customMimeType: customMime,
        });

        sendJson(res, 200, { success: true, file: resData });
      } catch (err: any) {
        sendError(res, 500, "Failed to upload file", err);
      }
      return;
    }

    // Custom 404 Page
    const acceptHeader = req.headers["accept"] || "";
    if (acceptHeader.includes("text/html")) {
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><title>404 - Page Not Found</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { background: #090d16; color: #f3f4f6; font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; }
    .box { padding: 2rem; border: 1px solid #1f2937; border-radius: 12px; background: #111827; max-width: 400px; }
    h1 { color: #38bdf8; font-size: 3rem; margin: 0; }
    p { color: #9ca3af; margin: 1rem 0 1.5rem; }
    a { display: inline-block; padding: 0.6rem 1.2rem; background: #38bdf8; color: #000; text-decoration: none; border-radius: 8px; font-weight: 600; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <h2>Page Not Found</h2>
    <p>The file or route you are looking for does not exist.</p>
    <a href="/">Back to Dashboard</a>
  </div>
</body>
</html>`);
    } else {
      sendError(res, 404, "Not Found");
    }
  });
}

export async function startServer(port?: number): Promise<void> {
  const config = getConfig();
  const serverPort = port || config.port;
  await service.initialize();

  const server = createTursoStorageServer();
  server.listen(serverPort, config.host, () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Turso File Storage Service running securely!`);
    console.log(`   - URL: http://localhost:${serverPort}`);
    console.log(`   - Database: ${config.databaseUrl}`);
    console.log(`   - Auth: Username='${config.adminUsername}'`);
    console.log(`   - Security Headers: Enabled`);
    console.log(`   - Rate Limiting: Active`);
    console.log(`   - Secret File Upload Protection: Active`);
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
