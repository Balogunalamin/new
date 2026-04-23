import { Router } from 'express';
import { pingDb } from '../../config/db';
import { asyncHandler } from '../../utils/asyncHandler';

export const healthRouter = Router();

healthRouter.get(
  '/health',
  asyncHandler(async (_req, res) => {
    let db = 'down';
    try {
      db = (await pingDb()) ? 'up' : 'down';
    } catch {
      db = 'down';
    }
    res.json({ ok: db === 'up', db });
  }),
);
