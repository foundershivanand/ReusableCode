import { randomUUID } from "node:crypto";
import { extname, basename } from "node:path";
import type { Client } from "@libsql/client";
import { getDbClient, initDatabase } from "./db.ts";
import type {
  StoredFileRecord,
  FileSummary,
  FileQueryOptions,
  FileCategory,
} from "./types.ts";
import {
  determineCategory,
  determineMimeType,
  isBufferBinary,
  computeSha256,
} from "./utils.ts";

export class TursoStorageService {
  private db: Client;

  constructor(client?: Client) {
    this.db = client || getDbClient();
  }

  async initialize(): Promise<void> {
    await initDatabase(this.db);
  }

  /**
   * Upsert a file into Turso.
   */
  async upsertFile(params: {
    path: string;
    buffer: Buffer;
    customMimeType?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string; status: "inserted" | "updated" | "skipped"; sha256: string }> {
    const { path, buffer } = params;
    const name = basename(path);
    const extension = extname(path);
    const isBinary = isBufferBinary(buffer);
    const category = determineCategory(path, extension);
    const mimeType = params.customMimeType || determineMimeType(path, extension, isBinary);
    const sizeBytes = buffer.length;
    const sha256 = computeSha256(buffer);
    const now = new Date().toISOString();

    // Check if record exists with the same path
    const existing = await this.db.execute({
      sql: "SELECT id, sha256 FROM turso_files WHERE path = ? LIMIT 1;",
      args: [path],
    });

    if (existing.rows.length > 0) {
      const row = existing.rows[0];
      const existingId = String(row.id);
      const existingSha = String(row.sha256);

      if (existingSha === sha256) {
        return { id: existingId, status: "skipped", sha256 };
      }

      // Update existing record
      const contentText = isBinary ? null : buffer.toString("utf-8");
      const contentBlob = isBinary ? buffer : null;
      const metadataStr = params.metadata ? JSON.stringify(params.metadata) : null;

      await this.db.execute({
        sql: `
          UPDATE turso_files
          SET name = ?, extension = ?, mime_type = ?, category = ?, size_bytes = ?,
              sha256 = ?, is_binary = ?, content_text = ?, content_blob = ?,
              metadata = ?, updated_at = ?
          WHERE id = ?;
        `,
        args: [
          name,
          extension,
          mimeType,
          category,
          sizeBytes,
          sha256,
          isBinary ? 1 : 0,
          contentText,
          contentBlob,
          metadataStr,
          now,
          existingId,
        ],
      });

      return { id: existingId, status: "updated", sha256 };
    }

    // Insert new record
    const id = randomUUID();
    const contentText = isBinary ? null : buffer.toString("utf-8");
    const contentBlob = isBinary ? buffer : null;
    const metadataStr = params.metadata ? JSON.stringify(params.metadata) : null;

    await this.db.execute({
      sql: `
        INSERT INTO turso_files (
          id, path, name, extension, mime_type, category, size_bytes,
          sha256, is_binary, content_text, content_blob, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
      `,
      args: [
        id,
        path,
        name,
        extension,
        mimeType,
        category,
        sizeBytes,
        sha256,
        isBinary ? 1 : 0,
        contentText,
        contentBlob,
        metadataStr,
        now,
        now,
      ],
    });

    return { id, status: "inserted", sha256 };
  }

  /**
   * List files matching query options (without loading heavy contents).
   */
  async listFiles(options: FileQueryOptions = {}): Promise<{
    files: FileSummary[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const {
      search,
      category,
      extension,
      limit = 50,
      offset = 0,
      sortBy = "path",
      sortOrder = "ASC",
    } = options;

    const conditions: string[] = [];
    const args: Array<string | number> = [];

    if (search) {
      conditions.push("(path LIKE ? OR name LIKE ?)");
      args.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      conditions.push("category = ?");
      args.push(category);
    }

    if (extension) {
      const ext = extension.startsWith(".") ? extension : `.${extension}`;
      conditions.push("extension = ?");
      args.push(ext);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    // Total count query
    const countResult = await this.db.execute({
      sql: `SELECT COUNT(*) as count FROM turso_files ${whereClause};`,
      args: [...args],
    });
    const total = Number(countResult.rows[0]?.count || 0);

    // List query
    const validSortCols = ["path", "name", "size_bytes", "updated_at"];
    const col = validSortCols.includes(sortBy) ? sortBy : "path";
    const order = sortOrder.toUpperCase() === "DESC" ? "DESC" : "ASC";

    const listSql = `
      SELECT id, path, name, extension, mime_type, category, size_bytes, sha256, is_binary, created_at, updated_at
      FROM turso_files
      ${whereClause}
      ORDER BY ${col} ${order}
      LIMIT ? OFFSET ?;
    `;

    const listResult = await this.db.execute({
      sql: listSql,
      args: [...args, limit, offset],
    });

    const files: FileSummary[] = listResult.rows.map((row) => ({
      id: String(row.id),
      path: String(row.path),
      name: String(row.name),
      extension: String(row.extension),
      mime_type: String(row.mime_type),
      category: String(row.category) as FileCategory,
      size_bytes: Number(row.size_bytes),
      sha256: String(row.sha256),
      is_binary: Boolean(row.is_binary),
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    }));

    return { files, total, limit, offset };
  }

  /**
   * Get a full file record including content by ID.
   */
  async getFileById(id: string): Promise<StoredFileRecord | null> {
    const result = await this.db.execute({
      sql: "SELECT * FROM turso_files WHERE id = ? LIMIT 1;",
      args: [id],
    });

    if (result.rows.length === 0) return null;
    return this.mapRowToRecord(result.rows[0]);
  }

  /**
   * Get a full file record including content by path.
   */
  async getFileByPath(path: string): Promise<StoredFileRecord | null> {
    const result = await this.db.execute({
      sql: "SELECT * FROM turso_files WHERE path = ? LIMIT 1;",
      args: [path],
    });

    if (result.rows.length === 0) return null;
    return this.mapRowToRecord(result.rows[0]);
  }

  /**
   * Delete a file by ID or path.
   */
  async deleteFile(identifier: { id?: string; path?: string }): Promise<boolean> {
    let sql = "";
    let arg = "";
    if (identifier.id) {
      sql = "DELETE FROM turso_files WHERE id = ?;";
      arg = identifier.id;
    } else if (identifier.path) {
      sql = "DELETE FROM turso_files WHERE path = ?;";
      arg = identifier.path;
    } else {
      return false;
    }

    const res = await this.db.execute({ sql, args: [arg] });
    return res.rowsAffected > 0;
  }

  /**
   * Get storage statistics: total files, total bytes, category breakdown.
   */
  async getStats(): Promise<{
    totalFiles: number;
    totalSizeBytes: number;
    categoryBreakdown: Record<string, number>;
  }> {
    const totalResult = await this.db.execute(
      "SELECT COUNT(*) as total_files, COALESCE(SUM(size_bytes), 0) as total_size FROM turso_files;"
    );
    const totalFiles = Number(totalResult.rows[0]?.total_files || 0);
    const totalSizeBytes = Number(totalResult.rows[0]?.total_size || 0);

    const catResult = await this.db.execute(
      "SELECT category, COUNT(*) as count FROM turso_files GROUP BY category;"
    );

    const categoryBreakdown: Record<string, number> = {};
    for (const row of catResult.rows) {
      categoryBreakdown[String(row.category)] = Number(row.count);
    }

    return {
      totalFiles,
      totalSizeBytes,
      categoryBreakdown,
    };
  }

  private mapRowToRecord(row: Record<string, unknown>): StoredFileRecord {
    let contentBlob: Buffer | null = null;
    if (row.content_blob) {
      if (Buffer.isBuffer(row.content_blob)) {
        contentBlob = row.content_blob;
      } else if (row.content_blob instanceof ArrayBuffer) {
        contentBlob = Buffer.from(row.content_blob);
      } else if (ArrayBuffer.isView(row.content_blob)) {
        contentBlob = Buffer.from(
          row.content_blob.buffer,
          row.content_blob.byteOffset,
          row.content_blob.byteLength
        );
      }
    }

    return {
      id: String(row.id),
      path: String(row.path),
      name: String(row.name),
      extension: String(row.extension),
      mime_type: String(row.mime_type),
      category: String(row.category) as FileCategory,
      size_bytes: Number(row.size_bytes),
      sha256: String(row.sha256),
      is_binary: Number(row.is_binary),
      content_text: row.content_text ? String(row.content_text) : null,
      content_blob: contentBlob,
      metadata: row.metadata ? String(row.metadata) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}
