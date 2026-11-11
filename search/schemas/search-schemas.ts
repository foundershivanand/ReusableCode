import { z } from "zod";

export const CommandCategorySchema = z.enum([
  "NAVIGATION",
  "ACTIONS",
  "WORKSPACE",
  "SETTINGS",
  "SEARCH_RESULT"
]);
export type CommandCategory = z.infer<typeof CommandCategorySchema>;

export const CommandItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  category: CommandCategorySchema,
  shortcut: z.string().optional(), // e.g. "G D", "Cmd+B"
  requiredPermissions: z.array(z.string()).default([]),
  requiredRoles: z.array(z.string()).default([]),
  isDestructive: z.boolean().default(false), // requires confirmation dialog
  action: z.string().optional(), // action identifier or URL
  metadata: z.record(z.string(), z.any()).default({})
});
export type CommandItem = z.input<typeof CommandItemSchema>;

export const SearchDocumentSchema = z.object({
  id: z.string().min(1),
  tenantId: z.string().min(1),
  type: z.string().min(1), // e.g. "PROJECT", "INVOICE", "USER", "DOCUMENT"
  title: z.string().min(1),
  content: z.string(),
  url: z.string().min(1),
  allowedRoles: z.array(z.string()).default([]), // empty = all tenant members
  allowedUserIds: z.array(z.string()).default([]),
  isDeleted: z.boolean().default(false),
  indexVersion: z.number().int().default(1),
  updatedAt: z.date().default(() => new Date())
});
export type SearchDocument = z.input<typeof SearchDocumentSchema>;

export const SearchQueryInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  userRoles: z.array(z.string()).default([]),
  query: z.string().max(200), // Protect against query abuse / DOS
  typeFilter: z.string().optional(),
  limit: z.number().int().min(1).max(50).default(20)
});
export type SearchQueryInput = z.input<typeof SearchQueryInputSchema>;

export const SearchResultItemSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  snippet: z.string(),
  url: z.string()
});
export type SearchResultItem = z.infer<typeof SearchResultItemSchema>;

export const ReindexProgressSchema = z.object({
  jobId: z.string(),
  tenantId: z.string(),
  totalDocuments: z.number().int(),
  processedDocuments: z.number().int(),
  failedDocuments: z.number().int(),
  status: z.enum(["QUEUED", "RUNNING", "COMPLETED", "FAILED"]),
  startedAt: z.date(),
  completedAt: z.date().optional()
});
export type ReindexProgress = z.infer<typeof ReindexProgressSchema>;
