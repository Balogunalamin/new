import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../../middleware/auth';
import { requireRole } from '../../middleware/role';
import { valid, validate } from '../../middleware/validate';
import { asyncHandler } from '../../utils/asyncHandler';
import { notFound } from '../../utils/http';
import {
  addPortfolioItem,
  browse,
  findDetail,
  updateArtisanProfile,
  upsertArtisanCategory,
} from './artisans.repo';

export const artisansRouter = Router();

const browseQuery = z.object({
  categoryId: z.string().uuid().optional(),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radiusKm: z.coerce.number().positive().max(100).optional(),
  q: z.string().trim().min(1).max(128).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});

artisansRouter.get(
  '/artisans',
  validate(browseQuery, 'query'),
  asyncHandler(async (req, res) => {
    const q = valid<z.infer<typeof browseQuery>>(req, 'query');
    const rows = await browse(q);
    res.json(rows);
  }),
);

artisansRouter.get(
  '/artisans/:id',
  asyncHandler(async (req, res) => {
    const id = req.params['id'];
    if (!id) throw notFound();
    const detail = await findDetail(id);
    if (!detail) throw notFound('Artisan not found');
    res.json(detail);
  }),
);

const patchMeSchema = z.object({
  bio: z.string().max(2000).optional(),
  years_experience: z.number().int().min(0).max(80).optional(),
  categories: z
    .array(
      z.object({
        category_id: z.string().uuid(),
        price_min: z.number().nonnegative().nullable().optional(),
        price_max: z.number().nonnegative().nullable().optional(),
      }),
    )
    .optional(),
});

artisansRouter.patch(
  '/artisans/me',
  requireAuth,
  requireRole('artisan'),
  validate(patchMeSchema),
  asyncHandler(async (req, res) => {
    const input = valid<z.infer<typeof patchMeSchema>>(req);
    const userId = req.user!.sub;
    await updateArtisanProfile(userId, input);
    if (input.categories) {
      for (const c of input.categories) {
        await upsertArtisanCategory(userId, c.category_id, c.price_min ?? null, c.price_max ?? null);
      }
    }
    const detail = await findDetail(userId);
    res.json(detail);
  }),
);

const portfolioSchema = z.object({
  image_url: z.string().url().max(1024),
  caption: z.string().max(500).optional(),
});

artisansRouter.post(
  '/artisans/me/portfolio',
  requireAuth,
  requireRole('artisan'),
  validate(portfolioSchema),
  asyncHandler(async (req, res) => {
    const { image_url, caption } = valid<z.infer<typeof portfolioSchema>>(req);
    const item = await addPortfolioItem(req.user!.sub, image_url, caption ?? null);
    res.status(201).json(item);
  }),
);
