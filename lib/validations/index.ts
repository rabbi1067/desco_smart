import { z } from "zod";
import {
  MAX_THRESHOLD,
  MIN_THRESHOLD,
  DEFAULT_LOW_THRESHOLD,
  DEFAULT_CRITICAL_THRESHOLD,
} from "@/lib/constants";
import type { TranslationKey } from "@/lib/i18n/dictionaries";

/**
 * Zod schemas shared by client forms and server actions.
 *
 * The SAME schema runs in both places: the browser copy gives instant feedback,
 * the server copy is the one that actually decides. Client validation is never
 * trusted — a server action re-parses every payload before touching the DB.
 *
 * Error messages are translation KEYS, not English sentences, so validation
 * errors are bilingual like the rest of the UI. The form layer resolves them
 * through `t()`.
 */

/** Narrow helper so a message typo is caught at compile time. */
const key = (k: TranslationKey) => k;

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
export const emailSchema = z
  .string()
  .trim()
  .min(1, key("validation.required"))
  .email(key("validation.email"))
  .max(254)
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, key("validation.passwordMin"))
  // Upper bound guards against a very long password being hashed on the server.
  .max(72, key("validation.passwordMin"));

export const fullNameSchema = z
  .string()
  .trim()
  .min(2, key("validation.nameMin"))
  .max(80, key("validation.nameMax"));

export const loginSchema = z.object({
  email: emailSchema,
  // Deliberately not `passwordSchema`: a length rule on sign-in would tell an
  // attacker their guess was rejected locally rather than by the server, and
  // would lock out accounts created under an older policy.
  password: z.string().min(1, key("validation.required")),
});

export const registerSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, key("validation.required")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: key("validation.passwordMatch"),
    path: ["confirmPassword"],
  });

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, key("validation.required")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: key("validation.passwordMatch"),
    path: ["confirmPassword"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, key("validation.required")),
    password: passwordSchema,
    confirmPassword: z.string().min(1, key("validation.required")),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: key("validation.passwordMatch"),
    path: ["confirmPassword"],
  });

// -----------------------------------------------------------------------------
// Meters
// -----------------------------------------------------------------------------

/**
 * DESCO meter and account numbers are digit strings. They are kept as strings,
 * never numbers: leading zeros are significant (e.g. "066120003770") and would
 * be destroyed by numeric coercion.
 */
const meterNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{4,32}$/, key("validation.meterNumberFormat"));

const accountNumberSchema = z
  .string()
  .trim()
  .regex(/^\d{4,32}$/, key("validation.accountNumberFormat"));

/** Accepts a form string or a number, since HTML inputs always yield strings. */
const thresholdSchema = z.coerce
  .number({ invalid_type_error: key("validation.invalidNumber") })
  .min(MIN_THRESHOLD, key("validation.thresholdRange"))
  .max(MAX_THRESHOLD, key("validation.thresholdRange"));

const meterFields = {
  name: z
    .string()
    .trim()
    .min(1, key("validation.meterNameRequired"))
    .max(80, key("validation.nameMax")),
  meterNumber: meterNumberSchema,
  accountNumber: accountNumberSchema,
  threshold: thresholdSchema.default(DEFAULT_LOW_THRESHOLD),
  criticalThreshold: thresholdSchema.default(DEFAULT_CRITICAL_THRESHOLD),
  monitoringEnabled: z.boolean().default(true),
  emailAlertEnabled: z.boolean().default(true),
  alertEmail: z
    .string()
    .trim()
    .email(key("validation.email"))
    .max(254)
    .toLowerCase()
    .optional()
    .or(z.literal("")),
};

/**
 * Mirrors the DB constraint `meters_threshold_order`. Validating here as well
 * turns a raw Postgres constraint violation into a field-level form error.
 */
const thresholdOrderRefinement = (data: {
  threshold: number;
  criticalThreshold: number;
}) => data.criticalThreshold < data.threshold;

export const createMeterSchema = z
  .object(meterFields)
  .refine(thresholdOrderRefinement, {
    message: key("validation.thresholdOrder"),
    path: ["criticalThreshold"],
  });

export const updateMeterSchema = z
  .object({ id: z.string().uuid(), ...meterFields })
  .refine(thresholdOrderRefinement, {
    message: key("validation.thresholdOrder"),
    path: ["criticalThreshold"],
  });

export const meterIdSchema = z.object({ id: z.string().uuid() });

// -----------------------------------------------------------------------------
// Profile & settings
// -----------------------------------------------------------------------------
export const updateProfileSchema = z.object({
  fullName: fullNameSchema,
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  designation: z.string().trim().max(80).optional().or(z.literal("")),
  // Restricted to http(s) so a `javascript:` or `data:` URL can never end up
  // in an <img src> or be rendered as a link.
  avatarUrl: z
    .string()
    .trim()
    .max(500)
    .url(key("validation.required"))
    .refine((v) => /^https?:\/\//i.test(v), {
      message: key("validation.required"),
    })
    .optional()
    .or(z.literal("")),
});

export const notificationPreferencesSchema = z.object({
  emailAlerts: z.boolean(),
  lowBalance: z.boolean(),
  criticalBalance: z.boolean(),
  recoveryAlerts: z.boolean(),
  dailySummary: z.boolean(),
});

export const appearanceSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  language: z.enum(["en", "bn"]),
});

// -----------------------------------------------------------------------------
// Admin & Roles
// -----------------------------------------------------------------------------
export const updateUserRoleSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(["user", "admin", "super_admin"]),
});

export const adminCreateUserSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  role: z.enum(["user", "admin", "super_admin"]).default("user"),
});

export const adminUpdateUserSchema = z.object({
  userId: z.string().uuid(),
  fullName: fullNameSchema,
  phone: z.string().trim().max(32).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  designation: z.string().trim().max(80).optional().or(z.literal("")),
});

export const adminToggleBlockSchema = z.object({
  userId: z.string().uuid(),
  isActive: z.boolean(),
});

export const smtpSettingsSchema = z.object({
  smtpHost: z.string().trim().min(1, key("validation.required")),
  smtpPort: z.coerce.number().min(1).max(65535),
  smtpUser: z.string().trim().email(key("validation.email")),
  smtpPass: z.string().trim().min(1, key("validation.required")),
  smtpFromName: z.string().trim().min(1, key("validation.required")),
  smtpSecure: z.boolean().default(false),
  smtpEnabled: z.boolean().default(true),
});

export const testEmailSchema = z.object({
  targetEmail: emailSchema,
});

export const systemSettingsSchema = z.object({
  defaultLowThreshold: thresholdSchema,
  defaultCriticalThreshold: thresholdSchema,
  alertCooldownHours: z.coerce
    .number({ invalid_type_error: key("validation.invalidNumber") })
    .min(0)
    .max(168),
  maintenanceMode: z.boolean(),
  defaultLanguage: z.enum(["en", "bn"]),
  defaultTheme: z.enum(["light", "dark", "system"]),
});

// -----------------------------------------------------------------------------
// Reports
// -----------------------------------------------------------------------------
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, key("validation.required"));

export const reportFilterSchema = z
  .object({
    type: z.enum(["balance_history", "alert_history", "meter_health"]),
    meterId: z.string().uuid().optional().or(z.literal("")),
    dateFrom: isoDate,
    dateTo: isoDate,
    status: z.string().max(32).optional().or(z.literal("")),
  })
  .refine((data) => data.dateFrom <= data.dateTo, {
    message: key("validation.required"),
    path: ["dateTo"],
  });

export const analyticsQuerySchema = z.object({
  meterId: z.string().uuid().optional().or(z.literal("")),
  period: z.enum(["7d", "14d", "30d", "custom"]).default("7d"),
  dateFrom: isoDate.optional(),
  dateTo: isoDate.optional(),
});

// -----------------------------------------------------------------------------
// Inferred form types
// -----------------------------------------------------------------------------
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type CreateMeterInput = z.infer<typeof createMeterSchema>;
export type UpdateMeterInput = z.infer<typeof updateMeterSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type NotificationPreferencesInput = z.infer<
  typeof notificationPreferencesSchema
>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;
export type AdminToggleBlockInput = z.infer<typeof adminToggleBlockSchema>;
export type SmtpSettingsInput = z.infer<typeof smtpSettingsSchema>;
export type TestEmailInput = z.infer<typeof testEmailSchema>;
export type SystemSettingsInput = z.infer<typeof systemSettingsSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;

/**
 * Flattens Zod issues into the `fieldErrors` shape used by `ActionResult`.
 * Values are translation keys, resolved by the form.
 */
export function toFieldErrors(
  error: z.ZodError,
): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".") || "_form";
    (result[path] ??= []).push(issue.message);
  }
  return result;
}
