import { z } from "zod";

export const ExportFormatSchema = z.enum(["JSON", "CSV", "PDF"]);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const JobStatusSchema = z.enum([
  "PENDING",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const ExportJobSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  resourceType: z.string().min(1), // e.g. "PROJECTS", "CUSTOMERS", "INVOICES", "FULL_TENANT"
  format: ExportFormatSchema,
  status: JobStatusSchema.default("PENDING"),
  progressPercentage: z.number().min(0).max(100).default(0),
  totalRows: z.number().int().default(0),
  downloadUrl: z.string().optional(),
  expiresAt: z.date().optional(),
  snapshotTimestamp: z.date().default(() => new Date()),
  errorMessage: z.string().optional(),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional()
});
export type ExportJob = z.infer<typeof ExportJobSchema>;

export const ImportStrategySchema = z.enum(["ALL_OR_NOTHING", "PARTIAL_WITH_ERRORS"]);
export type ImportStrategy = z.infer<typeof ImportStrategySchema>;

export const ImportJobSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  resourceType: z.string().min(1),
  strategy: ImportStrategySchema.default("ALL_OR_NOTHING"),
  dryRun: z.boolean().default(false), // "Validate only" mode
  status: JobStatusSchema.default("PENDING"),
  totalRows: z.number().int().default(0),
  processedRows: z.number().int().default(0),
  successRows: z.number().int().default(0),
  failedRows: z.number().int().default(0),
  errors: z.array(
    z.object({
      row: z.number().int(),
      field: z.string().optional(),
      message: z.string(),
      rawData: z.any().optional()
    })
  ).default([]),
  createdAt: z.date().default(() => new Date()),
  completedAt: z.date().optional()
});
export type ImportJob = z.infer<typeof ImportJobSchema>;

export const CreateExportInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  resourceType: z.string().min(1),
  format: ExportFormatSchema.default("CSV")
});
export type CreateExportInput = z.input<typeof CreateExportInputSchema>;

export const CreateImportInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  resourceType: z.string().min(1),
  strategy: ImportStrategySchema.default("ALL_OR_NOTHING"),
  dryRun: z.boolean().default(false),
  maxRows: z.number().int().min(1).max(50000).default(10000),
  content: z.string().min(1) // raw CSV or JSON text
});
export type CreateImportInput = z.input<typeof CreateImportInputSchema>;
