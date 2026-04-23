import type { NextFunction, Request, Response } from 'express';
import { forbidden, unauthorized } from '../utils/http';

type Role = 'client' | 'artisan' | 'admin';

export function requireRole(...allowed: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(unauthorized());
    if (!allowed.includes(req.user.role)) return next(forbidden('Insufficient role'));
    next();
  };
}
