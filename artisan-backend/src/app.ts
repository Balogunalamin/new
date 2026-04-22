import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { corsOrigins } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { artisansRouter } from './modules/artisans/artisans.routes';
import { authRouter } from './modules/auth/auth.routes';
import { categoriesRouter } from './modules/categories/categories.routes';
import { healthRouter } from './modules/health/health.routes';
import { usersRouter } from './modules/users/users.routes';

export function buildApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: corsOrigins.length > 0 ? corsOrigins : true,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.use(healthRouter);
  app.use(authRouter);
  app.use(usersRouter);
  app.use(categoriesRouter);
  app.use(artisansRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
