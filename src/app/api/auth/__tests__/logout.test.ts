import { POST } from '@/app/api/auth/logout/route';

// ── mock cookie module ─────────────────────────────────────────────────────────
jest.mock('@/lib/auth/cookie', () => ({
  SESSION_COOKIE_NAME: 'test_session',
  sessionCookieOptions: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: 604800,
  },
}));

describe('POST /api/auth/logout', () => {
  it('returns 200 with success status', async () => {
    const response = await POST();
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.status).toBe('success');
    expect(body.message).toBe('Logged out successfully');
  });

  it('clears the session cookie (maxAge 0)', async () => {
    const response = await POST();
    const setCookieHeader = response.headers.get('set-cookie');
    expect(setCookieHeader).toBeTruthy();
    // The cookie value should be empty and maxAge should be 0
    expect(setCookieHeader).toMatch(/test_session=/);
    expect(setCookieHeader).toMatch(/Max-Age=0/i);
  });
});
