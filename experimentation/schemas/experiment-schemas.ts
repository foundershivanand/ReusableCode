import { z } from "zod";

export const ExperimentStatusSchema = z.enum([
  "DRAFT",
  "RUNNING",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
]);
export type ExperimentStatus = z.infer<typeof ExperimentStatusSchema>;

export const VariantDefinitionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  weight: z.number().min(0).max(100), // percentage 0-100
  isControl: z.boolean().default(false),
  payload: z.record(z.string(), z.unknown()).default({}),
});
export type VariantDefinition = z.infer<typeof VariantDefinitionSchema>;

export const EligibilityRulesSchema = z.object({
  allowedPlans: z.array(z.string()).optional(),
  allowedCountries: z.array(z.string()).optional(),
  minAccountAgeDays: z.number().int().nonnegative().optional(),
});
export type EligibilityRules = z.infer<typeof EligibilityRulesSchema>;

export const ExperimentSchema = z.object({
  id: z.string().uuid(),
  key: z.string().regex(/^[a-z0-9_-]+$/i, "Experiment key must be alphanumeric with underscores/hyphens"),
  name: z.string().min(1),
  description: z.string().min(1),
  status: ExperimentStatusSchema.default("DRAFT"),
  variants: z.array(VariantDefinitionSchema).min(2, "An experiment must have at least 2 variants"),
  mutualExclusionGroup: z.string().nullable().default(null),
  eligibilityRules: EligibilityRulesSchema.default({}),
  primaryMetric: z.string().min(1),
  secondaryMetrics: z.array(z.string()).default([]),
  attributionWindowHours: z.number().int().positive().default(72),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type Experiment = z.infer<typeof ExperimentSchema>;

export const VariantAssignmentSchema = z.object({
  experimentId: z.string().uuid(),
  userId: z.string().min(1),
  variantId: z.string().min(1),
  assignedAt: z.string().datetime().default(() => new Date().toISOString()),
  exposed: z.boolean().default(false),
  exposedAt: z.string().datetime().nullable().default(null),
});
export type VariantAssignment = z.infer<typeof VariantAssignmentSchema>;

export const ConversionEventSchema = z.object({
  id: z.string().uuid(),
  experimentId: z.string().uuid(),
  userId: z.string().min(1),
  variantId: z.string().min(1),
  metricName: z.string().min(1),
  value: z.number().default(1),
  timestamp: z.string().datetime().default(() => new Date().toISOString()),
});
export type ConversionEvent = z.infer<typeof ConversionEventSchema>;

export const RawVariantMetricsSchema = z.object({
  variantId: z.string(),
  variantName: z.string(),
  isControl: z.boolean(),
  weight: z.number(),
  assignedCount: z.number().int().nonnegative(),
  exposedCount: z.number().int().nonnegative(),
  conversionsCount: z.number().int().nonnegative(),
  conversionRate: z.number().min(0).max(1),
  standardError: z.number().nonnegative(),
});
export type RawVariantMetrics = z.infer<typeof RawVariantMetricsSchema>;

export const RawMetricsReportSchema = z.object({
  experimentKey: z.string(),
  primaryMetric: z.string(),
  srmDetected: z.boolean(),
  srmPValue: z.number().min(0).max(1).optional(),
  variantMetrics: z.array(RawVariantMetricsSchema),
  methodologyNote: z.string(),
});
export type RawMetricsReport = z.infer<typeof RawMetricsReportSchema>;
