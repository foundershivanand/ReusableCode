import { z } from "zod";

export const ChangelogStatusSchema = z.enum([
  "DRAFT",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);
export type ChangelogStatus = z.infer<typeof ChangelogStatusSchema>;

export const RoadmapStatusSchema = z.enum([
  "PLANNED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
]);
export type RoadmapStatus = z.infer<typeof RoadmapStatusSchema>;

export const UpdateCategorySchema = z.enum([
  "FEATURE",
  "IMPROVEMENT",
  "FIX",
  "BREAKING",
  "SECURITY",
]);
export type UpdateCategory = z.infer<typeof UpdateCategorySchema>;

export const TargetAudienceSchema = z.enum([
  "ALL",
  "BETA_USERS",
  "INTERNAL_ONLY",
  "PRO_USERS",
]);
export type TargetAudience = z.infer<typeof TargetAudienceSchema>;

export const ChangelogItemSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentMarkdown: z.string().min(1),
  category: UpdateCategorySchema.default("FEATURE"),
  status: ChangelogStatusSchema.default("DRAFT"),
  versionTag: z.string().nullable().default(null),
  relatedFeatureFlag: z.string().nullable().default(null),
  targetAudience: TargetAudienceSchema.default("ALL"),
  authorId: z.string().min(1),
  publishedAt: z.string().datetime().nullable().default(null),
  scheduledFor: z.string().datetime().nullable().default(null),
  viewCount: z.number().int().nonnegative().default(0),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type ChangelogItem = z.infer<typeof ChangelogItemSchema>;

export const RoadmapItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  description: z.string().min(1),
  status: RoadmapStatusSchema.default("PLANNED"),
  targetQuarter: z.string().min(1), // e.g., "2026-Q3"
  upvotesCount: z.number().int().nonnegative().default(0),
  changelogId: z.string().uuid().nullable().default(null),
  createdAt: z.string().datetime().default(() => new Date().toISOString()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;

export const UserReadStateSchema = z.object({
  userId: z.string().min(1),
  changelogId: z.string().uuid(),
  readAt: z.string().datetime().default(() => new Date().toISOString()),
  deviceId: z.string().optional(),
});
export type UserReadState = z.infer<typeof UserReadStateSchema>;

export const CreateChangelogInputSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  contentMarkdown: z.string().min(1),
  category: UpdateCategorySchema.default("FEATURE"),
  versionTag: z.string().optional(),
  relatedFeatureFlag: z.string().optional(),
  targetAudience: TargetAudienceSchema.default("ALL"),
  scheduledFor: z.string().datetime().optional(),
});
export type CreateChangelogInput = z.infer<typeof CreateChangelogInputSchema>;
