import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { HttpError } from '../utils/http';

type Source = 'body' | 'query' | 'params';

export function validate<T>(schema: ZodSchema<T>, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const input = req[source];
    const result = schema.safeParse(input);
    if (!result.success) {
      const issues = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
      return next(new HttpError(400, 'validation_error', issues.join('; ')));
    }
    // Attach parsed+coerced data under a dedicated key so route handlers have
    // a typed payload without mutating the source object.
    (req as Request & { valid?: Record<string, unknown> }).valid = {
      ...(req as Request & { valid?: Record<string, unknown> }).valid,
      [source]: result.data,
    };
    next();
  };
}

export function valid<T = unknown>(req: Request, source: Source = 'body'): T {
  return ((req as Request & { valid?: Record<Source, unknown> }).valid?.[source] ??
    req[source]) as T;
}
