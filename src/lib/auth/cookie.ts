import 'server-only';

import { env } from '@/lib/env';

export const SESSION_COOKIE_NAME = env.AUTH_COOKIE_NAME;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 24 * 7,
} as const;
