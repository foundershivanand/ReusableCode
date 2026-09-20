#!/usr/bin/env node

import { ingestDirectory } from "./ingest.ts";
import { startServer } from "./server.ts";
import { TursoStorageService } from "./service.ts";
import { getConfig } from "./config.ts";

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || "serve";

  const config = getConfig();

  switch (command) {
    case "ingest":
    case "sync": {
      const targetDir = args[1] || process.cwd();
      console.log(`[CLI] Starting ingestion of ${targetDir} into Turso (${config.databaseUrl})...`);
      const result = await ingestDirectory({
        rootDir: targetDir,
        onProgress: (p) => {
          process.stdout.write(`\r[CLI] Ingesting: ${p.current}/${p.total} (${p.status}) - ${p.path.slice(-40)}`);
        },
      });
      console.log("\n[CLI] Ingestion completed successfully!");
      break;
    }

    case "serve":
    case "start": {
      const port = args[1] ? parseInt(args[1], 10) : config.port;
      await startServer(port);
      break;
    }

    case "stats": {
      const service = new TursoStorageService();
      await service.initialize();
      const stats = await service.getStats();
      console.log("\n=== Turso Storage Statistics ===");
      console.log(`Database: ${config.databaseUrl}`);
      console.log(`Total Files: ${stats.totalFiles.toLocaleString()}`);
      console.log(`Total Size: ${(stats.totalSizeBytes / 1024 / 1024).toFixed(2)} MB (${stats.totalSizeBytes} bytes)`);
      console.log("\nBreakdown by Category:");
      for (const [cat, count] of Object.entries(stats.categoryBreakdown)) {
        console.log(`  - ${cat.toUpperCase()}: ${count}`);
      }
      console.log("================================");
      break;
    }

    case "list": {
      const service = new TursoStorageService();
      await service.initialize();
      const limit = args[1] ? parseInt(args[1], 10) : 30;
      const res = await service.listFiles({ limit });
      console.log(`\n=== Showing first ${res.files.length} of ${res.total} files in Turso ===`);
      for (const f of res.files) {
        const sizeKb = (f.size_bytes / 1024).toFixed(1);
        console.log(`[${f.category.toUpperCase().padEnd(8)}] ${f.path.padEnd(50)} ${sizeKb.padStart(8)} KB`);
      }
      break;
    }

    case "help":
    default: {
      console.log(`
Turso File Storage CLI

Usage:
  node --experimental-strip-types turso-storage/cli.ts <command> [options]

Commands:
  serve [port]       Start the web UI and REST API server (default port: 3000)
  ingest [dir]       Scan and ingest code files, PDFs, and docs into Turso
  stats              Display storage statistics
  list [limit]       List stored files
  help               Show this help message

Environment Variables:
  TURSO_DATABASE_URL  Turso database URL (e.g. libsql://... or file:turso_files.db)
  TURSO_AUTH_TOKEN    Turso authentication token
  ADMIN_USERNAME      Username for authentication (default: admin)
  ADMIN_PASSWORD      Password for authentication (default: admin123)
  PORT                Server port (default: 3000)
      `);
      break;
    }
  }
}

main().catch((err) => {
  console.error("[CLI Error]", err);
  process.exit(1);
});
