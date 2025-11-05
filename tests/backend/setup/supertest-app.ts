import express from 'express';
import type { Express } from 'express';
import { createApiRouter } from 'src/backend/api';
import type { ApiServices } from 'src/backend/api/types';

export function buildTestApp(services: ApiServices): Express {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());
  app.use('/api', createApiRouter(services));
  return app;
}

