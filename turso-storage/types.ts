export type FileCategory = "code" | "pdf" | "document" | "image" | "data" | "other";

export interface StoredFileRecord {
  id: string;
  path: string;
  name: string;
  extension: string;
  mime_type: string;
  category: FileCategory;
  size_bytes: number;
  sha256: string;
  is_binary: number; // 0 or 1
  content_text?: string | null;
  content_blob?: Buffer | null;
  metadata?: string | null;
  created_at: string;
  updated_at: string;
}

export interface FileSummary {
  id: string;
  path: string;
  name: string;
  extension: string;
  mime_type: string;
  category: FileCategory;
  size_bytes: number;
  sha256: string;
  is_binary: boolean;
  created_at: string;
  updated_at: string;
}

export interface IngestOptions {
  rootDir: string;
  force?: boolean;
  batchSize?: number;
  customIgnorePatterns?: string[];
  onProgress?: (progress: { current: number; total: number; path: string; status: string }) => void;
}

export interface IngestResult {
  totalScanned: number;
  inserted: number;
  updated: number;
  skipped: number;
  failed: number;
  totalBytes: number;
  durationMs: number;
  categoryBreakdown: Record<string, number>;
  errors: Array<{ path: string; error: string }>;
}

export interface FileQueryOptions {
  search?: string;
  category?: string;
  extension?: string;
  limit?: number;
  offset?: number;
  sortBy?: "path" | "name" | "size_bytes" | "updated_at";
  sortOrder?: "ASC" | "DESC";
}
