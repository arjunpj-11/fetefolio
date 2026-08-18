import cors from 'cors';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { env } from './shared/config/env.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { serviceRouter } from './modules/services/service.routes.js';
import { bookingRouter } from './modules/bookings/booking.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { errorHandler, notFoundHandler } from './shared/middlewares/error.middleware.js';
import { ApiResponse } from './shared/utils/ApiResponse.js';

export const createApp = (): express.Express => {
  const app = express();
  const clientOrigin = new URL(env.CLIENT_URL).origin;
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: clientOrigin, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));
  app.use(mongoSanitize({ replaceWith: '_' }));
  if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  app.get('/api/health', (_req, res) =>
    res.json(
      new ApiResponse(
        { status: 'ok', timestamp: new Date().toISOString() },
        'Fetefolio API is ready',
      ),
    ),
  );
  app.use('/api/auth', authRouter);
  app.use('/api/services', serviceRouter);
  app.use('/api/bookings', bookingRouter);
  app.use('/api/admin', adminRouter);

  const swaggerPaths = [
    path.resolve(process.cwd(), '../docs/swagger.yaml'),
    path.resolve(process.cwd(), 'docs/swagger.yaml'),
  ];
  const swaggerPath = swaggerPaths.find(existsSync);
  if (swaggerPath)
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(YAML.load(swaggerPath) as object));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
};

export const app = createApp();
