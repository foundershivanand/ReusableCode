import { z } from "zod";

/**
 * Account Status State Machine
 */
export const AccountStatusEnum = z.enum([
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "LOCKED",
  "DEACTIVATED",
  "DELETED",
]);
export type AccountStatus = z.infer<typeof AccountStatusEnum>;

/**
 * User Roles
 */
export const UserRoleEnum = z.enum(["USER", "ADMIN", "SUPER_ADMIN"]);
export type UserRole = z.infer<typeof UserRoleEnum>;

/**
 * Supported OAuth Providers
 */
export const OAuthProviderEnum = z.enum(["google", "github", "apple"]);
export type OAuthProvider = z.infer<typeof OAuthProviderEnum>;

/**
 * MFA Types
 */
export const MFATypeEnum = z.enum(["totp", "recovery_code"]);
export type MFAType = z.infer<typeof MFATypeEnum>;

/**
 * Safe Redirect URL Validator (prevents open redirects)
 */
export const SafeRedirectUrlSchema = z
  .string()
  .max(2048, "Redirect URL is too long")
  .refine(
    (url) => {
      // Must be a relative path or starting with / (excluding // which can be protocol-relative)
      if (url.startsWith("/") && !url.startsWith("//")) {
        return true;
      }
      try {
        const parsed = new URL(url);
        // Only allow http/https protocols
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Invalid redirect URL" }
  );

/**
 * Password Policy Schema with configurable rules
 */
export const PasswordPolicy = z
  .string()
  .min(10, "Password must be at least 10 characters")
  .max(128, "Password must not exceed 128 characters")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character")
  .refine((val) => !/(.)\1{3,}/.test(val), {
    message: "Password cannot contain 4 or more repeated characters",
  });

/**
 * 1. Signup Schema
 */
export const SignupSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255, "Email too long"),
    password: PasswordPolicy,
    passwordConfirm: z.string().max(128),
    name: z.string().trim().max(100, "Name too long").optional(),
    inviteToken: z.string().max(255).optional(),
  })
  .strict()
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Passwords do not match",
    path: ["passwordConfirm"],
  });
export type SignupInput = z.input<typeof SignupSchema>;

/**
 * 2. Login Schema
 */
export const LoginSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255, "Email too long"),
    password: z.string().min(1, "Password is required").max(128),
    rememberMe: z.boolean().optional().default(false),
    mfaCode: z
      .string()
      .trim()
      .regex(/^[0-9]{6}$|^[A-Za-z0-9]{10}$/, "Invalid MFA code format")
      .optional(),
  })
  .strict();
export type LoginInput = z.input<typeof LoginSchema>;

/**
 * 3. Magic Link Request Schema
 */
export const MagicLinkSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255, "Email too long"),
    redirectUrl: SafeRedirectUrlSchema.optional(),
  })
  .strict();
export type MagicLinkInput = z.infer<typeof MagicLinkSchema>;

/**
 * 4. Password Reset Request Schema
 */
export const PasswordResetRequestSchema = z
  .object({
    email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255, "Email too long"),
  })
  .strict();
export type PasswordResetRequestInput = z.infer<typeof PasswordResetRequestSchema>;

/**
 * 5. Password Reset Execution Schema
 */
export const PasswordResetSchema = z
  .object({
    token: z.string().min(16, "Invalid token").max(255),
    newPassword: PasswordPolicy,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordResetInput = z.infer<typeof PasswordResetSchema>;

/**
 * 6. MFA Setup Schema
 */
export const MFASetupSchema = z
  .object({
    label: z.string().max(100).optional(),
  })
  .strict();
export type MFASetupInput = z.infer<typeof MFASetupSchema>;

/**
 * 6b. MFA Verify / Enable Schema
 */
export const MFAVerifySetupSchema = z
  .object({
    mfaSecret: z.string().min(16).max(128),
    code: z
      .string()
      .trim()
      .regex(/^[0-9]{6}$/, "MFA code must be exactly 6 digits"),
  })
  .strict();
export type MFAVerifySetupInput = z.infer<typeof MFAVerifySetupSchema>;

/**
 * 7. MFA Challenge Schema
 */
export const MFAChallengeSchema = z
  .object({
    mfaSessionToken: z.string().min(16).max(255),
    code: z
      .string()
      .trim()
      .min(6, "Code too short")
      .max(20, "Code too long"),
    type: MFATypeEnum,
  })
  .strict();
export type MFAChallengeInput = z.infer<typeof MFAChallengeSchema>;

/**
 * 8. OAuth Callback Schema
 */
export const OAuthCallbackSchema = z
  .object({
    code: z.string().min(1).max(1024),
    state: z.string().min(16).max(255),
    error: z.string().max(255).optional(),
    error_description: z.string().max(1024).optional(),
  })
  .passthrough();
export type OAuthCallbackInput = z.infer<typeof OAuthCallbackSchema>;

/**
 * 9. Session Schema (Stored Session representation)
 */
export const SessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  tokenHash: z.string(),
  userAgent: z.string().max(512).nullable(),
  ipAddress: z.string().max(128).nullable(),
  createdAt: z.date(),
  lastActiveAt: z.date(),
  expiresAt: z.date(),
  isRevoked: z.boolean(),
  sessionVersion: z.number().int().nonnegative(),
});
export type Session = z.infer<typeof SessionSchema>;

/**
 * 10. Public User Schema (Sanitized, safe for client consumption)
 * Never contains password hash, tokens, MFA secrets, internal keys!
 */
export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  role: UserRoleEnum,
  accountStatus: AccountStatusEnum,
  isEmailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

/**
 * 11. Email Change Request & Verify Schemas
 */
export const EmailChangeRequestSchema = z
  .object({
    newEmail: z
      .string()
      .trim()
      .toLowerCase()
      .email("Invalid email format")
      .max(255),
    currentPassword: z.string().min(1).max(128),
  })
  .strict();
export type EmailChangeRequestInput = z.infer<typeof EmailChangeRequestSchema>;

export const EmailChangeVerifySchema = z
  .object({
    token: z.string().min(16).max(255),
  })
  .strict();
export type EmailChangeVerifyInput = z.infer<typeof EmailChangeVerifySchema>;

/**
 * 12. Account Recovery Schema
 */
export const AccountRecoverySchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(255),
    recoveryCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9]{8,16}$/, "Invalid recovery code format"),
  })
  .strict();
export type AccountRecoveryInput = z.infer<typeof AccountRecoverySchema>;

/**
 * 13. Password Change Schema (for authenticated users)
 */
export const PasswordChangeSchema = z
  .object({
    currentPassword: z.string().min(1).max(128),
    newPassword: PasswordPolicy,
    confirmPassword: z.string().max(128),
  })
  .strict()
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });
export type PasswordChangeInput = z.infer<typeof PasswordChangeSchema>;

/**
 * 14. Admin User Role Update Schema
 */
export const AdminUpdateUserRoleSchema = z
  .object({
    role: UserRoleEnum,
  })
  .strict();
export type AdminUpdateUserRoleInput = z.infer<typeof AdminUpdateUserRoleSchema>;

/**
 * 15. User Profile Update Schema (untrusted profile field sanitization)
 */
export const UserProfileUpdateSchema = z
  .object({
    name: z.string().trim().max(100).optional(),
    avatarUrl: z
      .string()
      .url("Invalid avatar URL")
      .max(1024)
      .optional()
      .refine(
        (url) => !url || url.startsWith("https://") || url.startsWith("http://localhost"),
        { message: "Avatar URL must use HTTPS" }
      ),
  })
  .strict();
export type UserProfileUpdateInput = z.infer<typeof UserProfileUpdateSchema>;
