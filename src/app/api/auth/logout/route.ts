import { NextResponse } from 'next/server';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth/cookie';

export async function POST() {
  const response = NextResponse.json({
    status: 'success',
    message: 'Logged out successfully',
  });

  response.cookies.set(SESSION_COOKIE_NAME, '', {
    ...sessionCookieOptions,
    maxAge: 0,
  });

  return response;
}
