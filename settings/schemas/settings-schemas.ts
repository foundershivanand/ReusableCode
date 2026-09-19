import { z } from "zod";

export const ThemeSchema = z.enum(["light", "dark", "system"]);
export type Theme = z.infer<typeof ThemeSchema>;

export const PrivacyPreferencesSchema = z.object({
  functionalConsent: z.boolean().default(true), // essential cookies/state
  analyticsConsent: z.boolean().default(false), // opt-in analytics
  marketingConsent: z.boolean().default(false), // marketing emails & ad pixels
  personalizationConsent: z.boolean().default(true) // personalized recommendations
});
export type PrivacyPreferences = z.infer<typeof PrivacyPreferencesSchema>;

export const ProfileSettingsSchema = z.object({
  name: z.string().min(1).max(100),
  avatarUrl: z.string().url().or(z.literal("")).optional(),
  bio: z.string().max(500).optional(),
  title: z.string().max(100).optional()
});
export type ProfileSettings = z.infer<typeof ProfileSettingsSchema>;

export const AppearanceSettingsSchema = z.object({
  theme: ThemeSchema.default("system"),
  accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#3b82f6"),
  fontSize: z.enum(["small", "medium", "large"]).default("medium"),
  reducedMotion: z.boolean().default(false)
});
export type AppearanceSettings = z.infer<typeof AppearanceSettingsSchema>;

export const LanguageSettingsSchema = z.object({
  locale: z.string().min(2).max(10).default("en"),
  timezone: z.string().min(1).max(50).default("UTC"),
  dateFormat: z.enum(["YYYY-MM-DD", "MM/DD/YYYY", "DD/MM/YYYY"]).default("YYYY-MM-DD"),
  timeFormat: z.enum(["12h", "24h"]).default("24h")
});
export type LanguageSettings = z.infer<typeof LanguageSettingsSchema>;

export const UserSettingsSchema = z.object({
  schemaVersion: z.number().int().min(1).default(3), // v1 -> v2 -> v3
  userId: z.string().min(1),
  profile: ProfileSettingsSchema,
  appearance: AppearanceSettingsSchema,
  language: LanguageSettingsSchema,
  privacy: PrivacyPreferencesSchema,
  updatedAt: z.date()
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;

export const OrganizationSettingsSchema = z.object({
  schemaVersion: z.number().int().min(1).default(2),
  organizationId: z.string().min(1),
  defaultTheme: ThemeSchema.default("system"),
  enforceMfa: z.boolean().default(false),
  allowedEmailDomains: z.array(z.string()).default([]),
  defaultLocale: z.string().default("en"),
  updatedAt: z.date()
});
export type OrganizationSettings = z.infer<typeof OrganizationSettingsSchema>;

export const ResolvedPreferencesSchema = z.object({
  theme: ThemeSchema,
  locale: z.string(),
  timezone: z.string(),
  dateFormat: z.string(),
  timeFormat: z.string(),
  accentColor: z.string(),
  privacy: PrivacyPreferencesSchema
});
export type ResolvedPreferences = z.infer<typeof ResolvedPreferencesSchema>;
