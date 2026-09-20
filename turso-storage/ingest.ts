import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { TursoStorageService } from "./service.ts";
import { scanDirectory } from "./utils.ts";
import type { IngestOptions, IngestResult } from "./types.ts";

export async function ingestDirectory(
  options: IngestOptions,
  service?: TursoStorageService
): Promise<IngestResult> {
  const rootDir = resolve(options.rootDir);
  const storage = service || new TursoStorageService();
  await storage.initialize();

  const startTime = Date.now();
  console.log(`[turso-ingest] Scanning directory: ${rootDir}`);
  const relativeFiles = scanDirectory(rootDir, options.customIgnorePatterns);
  console.log(`[turso-ingest] Found ${relativeFiles.length} files to process.`);

  const result: IngestResult = {
    totalScanned: relativeFiles.length,
    inserted: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    totalBytes: 0,
    durationMs: 0,
    categoryBreakdown: {},
    errors: [],
  };

  let current = 0;
  for (const relPath of relativeFiles) {
    current++;
    const fullPath = `${rootDir}/${relPath}`;

    try {
      const stats = statSync(fullPath);
      // Skip files larger than 25MB to prevent memory/statement limit issues with Turso
      if (stats.size > 25 * 1024 * 1024) {
        console.warn(`[turso-ingest] Skipping file larger than 25MB: ${relPath} (${stats.size} bytes)`);
        result.skipped++;
        continue;
      }

      const buffer = readFileSync(fullPath);
      const res = await storage.upsertFile({
        path: relPath,
        buffer,
      });

      result.totalBytes += buffer.length;

      if (res.status === "inserted") {
        result.inserted++;
      } else if (res.status === "updated") {
        result.updated++;
      } else {
        result.skipped++;
      }

      if (options.onProgress && current % 25 === 0) {
        options.onProgress({
          current,
          total: relativeFiles.length,
          path: relPath,
          status: res.status,
        });
      }
    } catch (err: any) {
      result.failed++;
      result.errors.push({
        path: relPath,
        error: err?.message || String(err),
      });
      console.error(`[turso-ingest] Error processing ${relPath}:`, err?.message || err);
    }
  }

  result.durationMs = Date.now() - startTime;
  const finalStats = await storage.getStats();
  result.categoryBreakdown = finalStats.categoryBreakdown;

  console.log(`[turso-ingest] Completed in ${(result.durationMs / 1000).toFixed(2)}s:`);
  console.log(`  - Inserted: ${result.inserted}`);
  console.log(`  - Updated: ${result.updated}`);
  console.log(`  - Skipped (unchanged): ${result.skipped}`);
  console.log(`  - Failed: ${result.failed}`);
  console.log(`  - Total size: ${(result.totalBytes / (1024 * 1024)).toFixed(2)} MB`);

  return result;
}
