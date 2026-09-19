import { z } from "zod";

export const AIProviderNameSchema = z.enum(["OPENAI", "ANTHROPIC", "GOOGLE", "MOCK"]);
export type AIProviderName = z.infer<typeof AIProviderNameSchema>;

export const PromptRoleSchema = z.enum([
  "SYSTEM",
  "DEVELOPER",
  "TRUSTED_CONTEXT",
  "UNTRUSTED_USER",
  "RETRIEVED_CONTEXT",
  "TOOL_OUTPUT"
]);
export type PromptRole = z.infer<typeof PromptRoleSchema>;

export const PromptMessageSchema = z.object({
  role: PromptRoleSchema,
  content: z.string().min(1),
  name: z.string().optional()
});
export type PromptMessage = z.infer<typeof PromptMessageSchema>;

export const GenerateTextInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  messages: z.array(PromptMessageSchema).min(1),
  model: z.string().min(1).default("gpt-4o"),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(8192).default(2048),
  feature: z.string().default("general"),
  idempotencyKey: z.string().optional()
});
export type GenerateTextInput = z.input<typeof GenerateTextInputSchema>;
export type GenerateTextParsed = z.infer<typeof GenerateTextInputSchema>;


export const TokenUsageSchema = z.object({
  promptTokens: z.number().int().min(0),
  completionTokens: z.number().int().min(0),
  totalTokens: z.number().int().min(0),
  estimatedCostMicroCents: z.number().int().min(0) // 1 cent = 10,000 microcents
});
export type TokenUsage = z.infer<typeof TokenUsageSchema>;

export const GenerateTextResultSchema = z.object({
  id: z.string().min(1),
  provider: AIProviderNameSchema,
  model: z.string(),
  text: z.string(),
  usage: TokenUsageSchema,
  finishReason: z.enum(["STOP", "LENGTH", "CONTENT_FILTER", "TOOL_CALLS"]),
  durationMs: z.number().min(0)
});
export type GenerateTextResult = z.infer<typeof GenerateTextResultSchema>;

export const JobStatusSchema = z.enum([
  "QUEUED",
  "PROCESSING",
  "COMPLETED",
  "FAILED",
  "CANCELLED",
  "DEAD_LETTER"
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const BackgroundJobSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  payload: z.record(z.string(), z.any()),
  status: JobStatusSchema.default("QUEUED"),
  progress: z.number().min(0).max(100).default(0),
  attempts: z.number().int().min(0).default(0),
  maxAttempts: z.number().int().min(1).default(3),
  lastError: z.string().optional(),
  result: z.any().optional(),
  idempotencyKey: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional()
});
export type BackgroundJob = z.infer<typeof BackgroundJobSchema>;

export const AIToolDefinitionSchema = z.object({
  name: z.string().min(1).regex(/^[a-zA-Z0-9_-]+$/),
  description: z.string().min(1),
  parameters: z.record(z.string(), z.any()),
  requiredPermissions: z.array(z.string()).default([])
});
export type AIToolDefinition = z.infer<typeof AIToolDefinitionSchema>;

export const AIToolCallSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  arguments: z.record(z.string(), z.any())
});
export type AIToolCall = z.infer<typeof AIToolCallSchema>;

export const AIToolResultSchema = z.object({
  toolCallId: z.string().min(1),
  name: z.string().min(1),
  output: z.any(),
  isError: z.boolean().default(false)
});
export type AIToolResult = z.infer<typeof AIToolResultSchema>;

export const StreamChunkSchema = z.object({
  id: z.string(),
  deltaText: z.string(),
  finishReason: z.enum(["STOP", "LENGTH", "CONTENT_FILTER", "TOOL_CALLS"]).optional(),
  usage: TokenUsageSchema.optional()
});
export type StreamChunk = z.infer<typeof StreamChunkSchema>;

export const EmbeddingInputSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  texts: z.array(z.string().min(1)).min(1),
  model: z.string().default("text-embedding-3-small")
});
export type EmbeddingInput = z.infer<typeof EmbeddingInputSchema>;

export const EmbeddingResultSchema = z.object({
  model: z.string(),
  embeddings: z.array(z.array(z.number())),
  usage: z.object({
    totalTokens: z.number().int().min(0),
    estimatedCostMicroCents: z.number().int().min(0)
  })
});
export type EmbeddingResult = z.infer<typeof EmbeddingResultSchema>;

export const AIBudgetSchema = z.object({
  tenantId: z.string().min(1),
  dailyMicroCentsLimit: z.number().int().min(0),
  monthlyMicroCentsLimit: z.number().int().min(0),
  currentDailyMicroCents: z.number().int().min(0).default(0),
  currentMonthlyMicroCents: z.number().int().min(0).default(0),
  killSwitchActive: z.boolean().default(false)
});
export type AIBudget = z.infer<typeof AIBudgetSchema>;

