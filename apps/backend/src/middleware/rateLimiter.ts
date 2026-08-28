import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Request } from 'express';

const windowMs = 60_000;

export const aiRateLimiter = rateLimit({
  windowMs,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  keyGenerator: (request: Request) => {
    const user = (request as Request & { user?: { id?: string } }).user;
    return user?.id ?? ipKeyGenerator(request.ip ?? 'unknown-client');
  },
  message: { error: 'AI request limit exceeded. Try again later.' },
});

export const publicRateLimiter = rateLimit({
  windowMs,
  limit: 60,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests. Try again later.' },
});
