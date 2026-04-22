import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';
import { HttpError } from '../utils/http';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  logger.error({ err, path: req.path }, 'Unhandled error');
  res.status(500).json({ error: { code: 'internal_error', message: 'Something went wrong' } });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({ error: { code: 'not_found', message: `No route for ${req.method} ${req.path}` } });
}
