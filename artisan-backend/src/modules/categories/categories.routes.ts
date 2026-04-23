import { Router } from 'express';
import { asyncHandler } from '../../utils/asyncHandler';
import { listActive } from './categories.repo';

export const categoriesRouter = Router();

categoriesRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const rows = await listActive();
    res.json(rows);
  }),
);
