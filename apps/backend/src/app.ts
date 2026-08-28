import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import 'dotenv/config';
import { apiRouter } from './routes';
import { errorHandler } from './shared/errors';
import { publicRateLimiter } from './middleware/rateLimiter';

export const app = express();
app.set('trust proxy', 1);
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : false }));
app.use(express.json({ limit: '2mb' }));
app.get('/health', publicRateLimiter, (_request, response) => response.json({ status: 'ok' }));
const apiPrefix = process.env.API_PREFIX ?? '/api/v1';
app.use(apiPrefix, apiRouter);
if (apiPrefix !== '/api') app.use('/api', apiRouter);
app.use(errorHandler);
