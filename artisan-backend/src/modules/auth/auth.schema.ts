import { z } from 'zod';

// Nigerian phone numbers: accept E.164 like +2348012345678 plus a broad fallback.
const phone = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'phone must be a valid international number');

export const requestOtpSchema = z.object({
  phone,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone,
  otp: z.string().length(6).regex(/^\d{6}$/, 'otp must be 6 digits'),
  // Admin role is never creatable via public OTP flow (spec §10.4).
  role: z.enum(['client', 'artisan']).optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
