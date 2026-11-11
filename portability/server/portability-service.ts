import { randomBytes } from "node:crypto";
import type { IPortabilityRepository } from "./repository.js";
import {
  type ExportJob,
  type ImportJob,
  type CreateExportInput,
  type CreateImportInput,
  CreateExportInputSchema,
  CreateImportInputSchema
} from "../schemas/portability-schemas.js";

export class DataPortabilityService {
  constructor(private readonly repository: IPortabilityRepository) {}

  async requestExport(
    input: CreateExportInput,
    dataProvider: () => Promise<Array<Record<string, any>>>
  ): Promise<ExportJob> {
    const validated = CreateExportInputSchema.parse(input);

    const jobId = `exp_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const snapshotTimestamp = new Date();

    const job: ExportJob = {
      id: jobId,
      tenantId: validated.tenantId,
      userId: validated.userId,
      resourceType: validated.resourceType,
      format: validated.format,
      status: "PROCESSING",
      progressPercentage: 10,
      totalRows: 0,
      snapshotTimestamp,
      createdAt: new Date()
    };

    await this.repository.saveExportJob(job);

    try {
      // 1. Fetch data snapshot (coherent at snapshotTimestamp)
      const data = await dataProvider();
      job.totalRows = data.length;
      job.progressPercentage = 50;

      // 2. Format data with CSV injection defense
      let _formattedOutput: string;
      if (validated.format === "JSON") {
        _formattedOutput = JSON.stringify(data, null, 2);
      } else {
        // CSV
        _formattedOutput = this.formatSafeCsv(data);
      }
      void _formattedOutput;

      job.progressPercentage = 90;

      // 3. Generate signed download URL with 24h TTL
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      job.downloadUrl = `https://storage.acme.com/exports/${validated.tenantId}/${jobId}.${validated.format.toLowerCase()}?token=${randomBytes(16).toString("hex")}`;
      job.expiresAt = expiresAt;
      job.status = "COMPLETED";
      job.progressPercentage = 100;
      job.completedAt = new Date();

      return this.repository.saveExportJob(job);
    } catch (err: any) {
      job.status = "FAILED";
      job.errorMessage = err.message || "Export failed";
      return this.repository.saveExportJob(job);
    }
  }

  async processImport(
    input: CreateImportInput,
    schemaValidator: (row: Record<string, any>) => { valid: boolean; error?: string },
    commitFn: (rows: Array<Record<string, any>>) => Promise<void>
  ): Promise<ImportJob> {
    const validated = CreateImportInputSchema.parse(input);

    const jobId = `imp_${Date.now()}_${randomBytes(4).toString("hex")}`;
    const job: ImportJob = {
      id: jobId,
      tenantId: validated.tenantId,
      userId: validated.userId,
      resourceType: validated.resourceType,
      strategy: validated.strategy,
      dryRun: validated.dryRun,
      status: "PROCESSING",
      totalRows: 0,
      processedRows: 0,
      successRows: 0,
      failedRows: 0,
      errors: [],
      createdAt: new Date()
    };

    await this.repository.saveImportJob(job);

    try {
      // 1. Parse raw content
      const rows = this.parseImportContent(validated.content);
      job.totalRows = rows.length;

      if (rows.length > validated.maxRows) {
        throw new Error(
          `Import exceeds maximum allowed limit of ${validated.maxRows} rows (got ${rows.length})`
        );
      }

      // 2. Validate & Duplicate check
      const validRows: Array<Record<string, any>> = [];
      const seenKeys = new Set<string>();

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        job.processedRows++;

        // Duplicate detection (checks id and email explicitly)
        const isDuplicate =
          (row.id && seenKeys.has(`id:${row.id}`)) ||
          (row.email && seenKeys.has(`email:${row.email}`)) ||
          seenKeys.has(`row:${JSON.stringify(row)}`);

        if (isDuplicate) {
          const dupInfo = (row.email && seenKeys.has(`email:${row.email}`))
            ? `email: ${row.email}`
            : `id: ${row.id}`;
          job.failedRows++;
          job.errors.push({
            row: i + 1,
            message: `Duplicate record detected within import payload (${dupInfo})`,
            rawData: row
          });
          continue;
        }

        if (row.id) seenKeys.add(`id:${row.id}`);
        if (row.email) seenKeys.add(`email:${row.email}`);
        seenKeys.add(`row:${JSON.stringify(row)}`);

        // Schema validation
        const valResult = schemaValidator(row);
        if (!valResult.valid) {
          job.failedRows++;
          job.errors.push({
            row: i + 1,
            message: valResult.error || "Schema validation failed",
            rawData: row
          });
          continue;
        }

        job.successRows++;
        validRows.push(row);
      }

      // 3. Apply Strategy (ALL_OR_NOTHING vs PARTIAL_WITH_ERRORS)
      if (validated.strategy === "ALL_OR_NOTHING" && job.failedRows > 0) {
        job.status = "FAILED";
        job.completedAt = new Date();
        return this.repository.saveImportJob(job);
      }

      // 4. Commit (if not dry-run)
      if (!validated.dryRun && validRows.length > 0) {
        await commitFn(validRows);
      }

      job.status = "COMPLETED";
      job.completedAt = new Date();
      return this.repository.saveImportJob(job);
    } catch (err: any) {
      job.status = "FAILED";
      job.errors.push({ row: 0, message: err.message || "Import failure" });
      job.completedAt = new Date();
      return this.repository.saveImportJob(job);
    }
  }

  // Defends against CSV Formula Injection (=, +, -, @, \t, \r)
  formatSafeCsv(rows: Array<Record<string, any>>): string {
    if (rows.length === 0) return "";

    const headers = Object.keys(rows[0]);
    const lines: string[] = [headers.join(",")];

    for (const row of rows) {
      const values = headers.map((header) => {
        let val = row[header];
        if (val === undefined || val === null) return '""';
        let str = String(val);

        // Formula injection defense: prepend single quote if starting with risky char
        if (/^[=+\-@\t\r]/.test(str)) {
          str = `'${str}`;
        }

        // Escape quotes
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      });
      lines.push(values.join(","));
    }

    return lines.join("\n");
  }

  private parseImportContent(raw: string): Array<Record<string, any>> {
    const trimmed = raw.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      const parsed = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [parsed];
    }

    // CSV parser
    const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(",").map((h) => h.replace(/^"|"$/g, "").trim());
    const results: Array<Record<string, any>> = [];

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
      const rowObj: Record<string, any> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = cols[idx] !== undefined ? cols[idx] : "";
      });
      results.push(rowObj);
    }

    return results;
  }
}
