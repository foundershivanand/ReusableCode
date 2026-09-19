import { z } from "zod";

export const TextDirectionSchema = z.enum(["ltr", "rtl"]);
export type TextDirection = z.infer<typeof TextDirectionSchema>;

export const LocaleMetadataSchema = z.object({
  code: z.string().min(2),
  name: z.string().min(1),
  nativeName: z.string().min(1),
  direction: TextDirectionSchema.default("ltr"),
  defaultCurrency: z.string().default("USD"),
  defaultTimezone: z.string().default("UTC"),
  calendar: z.string().default("gregory"),
  isActive: z.boolean().default(true),
});
export type LocaleMetadata = z.infer<typeof LocaleMetadataSchema>;

export const TranslationDictionarySchema = z.object({
  locale: z.string().min(2),
  namespace: z.string().default("common"),
  version: z.string().default("1.0.0"),
  translations: z.record(z.string(), z.string()),
  updatedAt: z.string().datetime().default(() => new Date().toISOString()),
});
export type TranslationDictionary = z.infer<typeof TranslationDictionarySchema>;

export const FormatNumberOptionsSchema = z.object({
  style: z.enum(["decimal", "currency", "percent"]).default("decimal"),
  currency: z.string().optional(),
  minimumFractionDigits: z.number().int().min(0).max(20).optional(),
  maximumFractionDigits: z.number().int().min(0).max(20).optional(),
});
export type FormatNumberOptions = z.infer<typeof FormatNumberOptionsSchema>;

export const FormatDateTimeOptionsSchema = z.object({
  dateStyle: z.enum(["full", "long", "medium", "short"]).optional(),
  timeStyle: z.enum(["full", "long", "medium", "short"]).optional(),
  timeZone: z.string().optional(),
});
export type FormatDateTimeOptions = z.infer<typeof FormatDateTimeOptionsSchema>;

export const MissingKeyReportSchema = z.object({
  locale: z.string().min(2),
  namespace: z.string(),
  missingKeys: z.array(z.string()),
  staleKeys: z.array(z.string()),
});
export type MissingKeyReport = z.infer<typeof MissingKeyReportSchema>;
