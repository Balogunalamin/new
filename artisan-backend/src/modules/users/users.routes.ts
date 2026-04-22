import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { valid, validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/http';
import { findById, updateMe } from './users.repo';

export const usersRouter = Router();

usersRouter.get(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await findById(req.user!.sub);
    if (!user) throw notFound('User not found');
    res.json(user);
  }),
);

const patchMeSchema = z.object({
  full_name: z.string().trim().min(1).max(255).optional(),
  email: z.string().trim().email().optional(),
  profile_photo: z.string().url().max(1024).optional(),
});

usersRouter.patch(
  '/me',
  requireAuth,
  validate(patchMeSchema),
  asyncHandler(async (req, res) => {
    const input = valid<z.infer<typeof patchMeSchema>>(req);
    const user = await updateMe(req.user!.sub, input);
    res.json(user);
  }),
);
