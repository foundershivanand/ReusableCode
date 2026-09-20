import { createHash } from "node:crypto";
import { extname, basename, relative } from "node:path";
import { statSync, readdirSync, readFileSync } from "node:fs";
import type { FileCategory } from "./types.ts";

const CODE_EXTENSIONS = new Set([
  ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
  ".json", ".jsonc", ".sql", ".html", ".css", ".scss", ".sass", ".less",
  ".py", ".sh", ".bash", ".zsh", ".yaml", ".yml", ".toml", ".xml",
  ".rs", ".go", ".java", ".c", ".cpp", ".h", ".hpp", ".cs", ".php", ".rb",
  ".vue", ".svelte", ".astro", ".graphql", ".gql", ".proto", ".env.example",
  ".gitignore", ".dockerignore", ".eslintrc", ".prettierrc"
]);

const DOCUMENT_EXTENSIONS = new Set([
  ".md", ".markdown", ".txt", ".rst", ".adoc", ".rtf", ".csv", ".tsv", ".log"
]);

const IMAGE_EXTENSIONS = new Set([
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".ico", ".bmp", ".tiff"
]);

const DATA_EXTENSIONS = new Set([
  ".parquet", ".arrow", ".sqlite", ".db", ".avro", ".bin"
]);

const MIME_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".ts": "application/typescript",
  ".tsx": "text/typescript-jsx",
  ".js": "application/javascript",
  ".jsx": "text/javascript-jsx",
  ".mjs": "application/javascript",
  ".cjs": "application/javascript",
  ".json": "application/json",
  ".sql": "application/sql",
  ".html": "text/html",
  ".css": "text/css",
  ".md": "text/markdown",
  ".markdown": "text/markdown",
  ".txt": "text/plain",
  ".yaml": "text/yaml",
  ".yml": "text/yaml",
  ".xml": "application/xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".csv": "text/csv",
};

export const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  ".git",
  ".pnpm-store",
  ".turbo",
  ".next",
  "dist",
  "build",
  "coverage",
  ".system_generated",
  ".gemini",
  ".env",
  ".env.local",
  ".env.production",
  ".env.development",
  ".env.test",
  "*.db",
  "*.db-journal",
  "*.db-wal",
  "*.db-shm",
  "*.key",
  "*.pem",
  "*.crt",
  "*.cert",
  "id_rsa",
  "id_ed25519",
  "credentials.json",
  "local.db",
  "turso_files.db",
  "pnpm-lock.yaml",
  "package-lock.json",
];

export function determineCategory(filePath: string, ext: string): FileCategory {
  const lowerExt = ext.toLowerCase();
  const name = basename(filePath).toLowerCase();

  if (lowerExt === ".pdf") {
    return "pdf";
  }
  if (CODE_EXTENSIONS.has(lowerExt) || name === "dockerfile" || name === "makefile" || name === "license") {
    return "code";
  }
  if (DOCUMENT_EXTENSIONS.has(lowerExt)) {
    return "document";
  }
  if (IMAGE_EXTENSIONS.has(lowerExt)) {
    return "image";
  }
  if (DATA_EXTENSIONS.has(lowerExt)) {
    return "data";
  }
  return "other";
}

export function determineMimeType(filePath: string, ext: string, isBinary: boolean): string {
  const lowerExt = ext.toLowerCase();
  if (MIME_TYPES[lowerExt]) {
    return MIME_TYPES[lowerExt];
  }
  return isBinary ? "application/octet-stream" : "text/plain; charset=utf-8";
}

export function isBufferBinary(buffer: Buffer): boolean {
  // Check the first 8000 bytes for null bytes (standard heuristic used by git/grep)
  const length = Math.min(buffer.length, 8000);
  for (let i = 0; i < length; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}

export function computeSha256(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export function shouldIgnore(relativePath: string, customIgnorePatterns: string[] = []): boolean {
  const parts = relativePath.split("/");
  const patterns = [...DEFAULT_IGNORE_PATTERNS, ...customIgnorePatterns];

  for (const part of parts) {
    // Specifically block any .env files unless explicitly .env.example
    if (part.startsWith(".env") && part !== ".env.example") {
      return true;
    }

    for (const pattern of patterns) {
      if (pattern.startsWith("*.")) {
        const ext = pattern.slice(1);
        if (part.endsWith(ext)) return true;
      } else if (part === pattern) {
        return true;
      }
    }
  }
  return false;
}

export function scanDirectory(
  rootDir: string,
  customIgnorePatterns: string[] = []
): string[] {
  const results: string[] = [];

  function traverse(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${currentDir}/${entry.name}`;
      const relPath = relative(rootDir, fullPath);

      if (shouldIgnore(relPath, customIgnorePatterns)) {
        continue;
      }

      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (entry.isFile()) {
        results.push(relPath);
      }
    }
  }

  traverse(rootDir);
  return results;
}
