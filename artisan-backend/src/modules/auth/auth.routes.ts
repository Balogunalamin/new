import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { valid, validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { requestOtpSchema, refreshSchema, verifyOtpSchema } from './auth.schema';
import {
  type Role,
  requestOtp,
  revokeAllRefreshTokens,
  rotateRefreshToken,
  verifyOtp,
} from './auth.service';

export const authRouter = Router();

authRouter.post(
  '/auth/request-otp',
  validate(requestOtpSchema),
  asyncHandler(async (req, res) => {
    const { phone } = valid<{ phone: string }>(req);
    await requestOtp(phone);
    res.json({ ok: true });
  }),
);

authRouter.post(
  '/auth/verify-otp',
  validate(verifyOtpSchema),
  asyncHandler(async (req, res) => {
    const { phone, otp, role } = valid<{
      phone: string;
      otp: string;
      role?: Extract<Role, 'client' | 'artisan'>;
    }>(req);
    const { user, tokens } = await verifyOtp(phone, otp, role ?? 'client');
    res.json({ user, ...tokens });
  }),
);

authRouter.post(
  '/auth/refresh',
  validate(refreshSchema),
  asyncHandler(async (req, res) => {
    const { refreshToken } = valid<{ refreshToken: string }>(req);
    const tokens = await rotateRefreshToken(refreshToken);
    res.json(tokens);
  }),
);

authRouter.post(
  '/auth/logout',
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user) await revokeAllRefreshTokens(req.user.sub);
    res.json({ ok: true });
  }),
);
