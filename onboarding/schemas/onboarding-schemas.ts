import { z } from "zod";

export const OnboardingStatusSchema = z.enum([
  "NOT_STARTED",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
  "RESET"
]);
export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>;

export const StepStatusSchema = z.enum([
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "SKIPPED",
  "BLOCKED"
]);
export type StepStatus = z.infer<typeof StepStatusSchema>;

export const OnboardingStepSchema = z.object({
  id: z.string().min(1),
  flowId: z.string().min(1),
  order: z.number().int().min(0),
  title: z.string().min(1),
  description: z.string().default(""),
  actionUrl: z.string().optional(),
  targetSelector: z.string().optional(), // CSS selector for tour/tooltip
  requiredPermission: z.string().optional(),
  requiredRoles: z.array(z.string()).default([]),
  serverVerificationKey: z.string().optional(), // requires server confirmation if present
  unlocksFeature: z.string().optional(),
  metadata: z.record(z.string(), z.any()).default({})
});
export type OnboardingStep = z.infer<typeof OnboardingStepSchema>;

export const UserStepStateSchema = z.object({
  stepId: z.string().min(1),
  status: StepStatusSchema.default("PENDING"),
  completedAt: z.date().optional(),
  skippedAt: z.date().optional(),
  serverVerified: z.boolean().default(false),
  verificationProof: z.record(z.string(), z.any()).optional()
});
export type UserStepState = z.infer<typeof UserStepStateSchema>;

export const OnboardingFlowSchema = z.object({
  id: z.string().min(1),
  version: z.string().min(1).default("v1"),
  title: z.string().min(1),
  description: z.string().default(""),
  steps: z.array(OnboardingStepSchema).min(1),
  targetRoles: z.array(z.string()).default([]),
  productKey: z.string().default("default"),
  isActive: z.boolean().default(true),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});
export type OnboardingFlow = z.infer<typeof OnboardingFlowSchema>;

export const UserOnboardingStateSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  flowId: z.string().min(1),
  flowVersion: z.string().min(1),
  status: OnboardingStatusSchema.default("NOT_STARTED"),
  currentStepIndex: z.number().int().min(0).default(0),
  stepStates: z.record(z.string(), UserStepStateSchema).default({}),
  progressPercentage: z.number().min(0).max(100).default(0),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  skippedAt: z.date().optional(),
  lastResumedAt: z.date().optional(),
  updatedAt: z.date().default(() => new Date())
});
export type UserOnboardingState = z.infer<typeof UserOnboardingStateSchema>;

export const CompleteStepInputSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  flowId: z.string().min(1),
  stepId: z.string().min(1),
  serverVerificationProof: z.record(z.string(), z.any()).optional()
});
export type CompleteStepInput = z.infer<typeof CompleteStepInputSchema>;

export const SkipFlowInputSchema = z.object({
  userId: z.string().min(1),
  tenantId: z.string().min(1),
  flowId: z.string().min(1),
  reason: z.string().optional()
});
export type SkipFlowInput = z.infer<typeof SkipFlowInputSchema>;

export const TourTooltipPlacementSchema = z.enum([
  "top",
  "bottom",
  "left",
  "right",
  "center"
]);
export type TourTooltipPlacement = z.infer<typeof TourTooltipPlacementSchema>;

export const TourStepSchema = z.object({
  stepId: z.string(),
  selector: z.string(),
  title: z.string(),
  content: z.string(),
  placement: TourTooltipPlacementSchema.default("bottom"),
  allowSkip: z.boolean().default(true)
});
export type TourStep = z.infer<typeof TourStepSchema>;
