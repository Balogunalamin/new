import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { unauthorized } from '../utils/http';

export interface AuthPayload {
  sub: string;
  role: 'client' | 'artisan' | 'admin';
  iat?: number;
  exp?: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthPayload;
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header('authorization');
  if (!header || !header.toLowerCase().startsWith('bearer ')) {
    return next(unauthorized('Missing bearer token'));
  }
  const token = header.slice(7).trim();
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as AuthPayload;
    req.user = decoded;
    next();
  } catch {
    next(unauthorized('Invalid or expired access token'));
  }
}
