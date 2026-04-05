import { POST } from '@/app/api/auth/login/route';

// ── mock dependencies ──────────────────────────────────────────────────────────
const mockFindUserByEmail = jest.fn();
const mockFindDoctorByUserId = jest.fn();
const mockVerifyPassword = jest.fn();
const mockCreateSessionToken = jest.fn();

jest.mock('@/lib/repositories/user-repository', () => ({
  findUserByEmail: (...args: unknown[]) => mockFindUserByEmail(...args),
  findDoctorByUserId: (...args: unknown[]) => mockFindDoctorByUserId(...args),
}));

jest.mock('@/lib/auth/password', () => ({
  verifyPassword: (...args: unknown[]) => mockVerifyPassword(...args),
}));

jest.mock('@/lib/auth/session', () => ({
  createSessionToken: (...args: unknown[]) => mockCreateSessionToken(...args),
}));

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

// ──────────────────────────────────────────────────────────────────────────────
function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validUser = {
  userid: 1,
  username: 'johndoe',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  password: 'hashed_password',
  role: 'User',
  dateofbirth: '1990-01-01',
  sex: 'Male',
  bloodtype: 'O+',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateSessionToken.mockResolvedValue('mock-jwt-token');
});

describe('POST /api/auth/login', () => {
  describe('validation errors (400)', () => {
    it('returns 400 when email is missing', async () => {
      const res = await POST(makeRequest({ password: 'password123' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.status).toBe('error');
    });

    it('returns 400 when password is too short (< 8 chars)', async () => {
      const res = await POST(makeRequest({ email: 'john@example.com', password: 'short' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when email is malformed', async () => {
      const res = await POST(makeRequest({ email: 'not-an-email', password: 'password123' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when body is not valid JSON', async () => {
      const req = new Request('http://localhost/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      });
      const res = await POST(req);
      expect(res.status).toBe(500);
    });
  });

  describe('authentication failures (401)', () => {
    it('returns 401 when email is not found', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      const res = await POST(makeRequest({ email: 'nobody@example.com', password: 'password123' }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toMatch(/invalid email/i);
    });

    it('returns 401 when password is incorrect', async () => {
      mockFindUserByEmail.mockResolvedValue(validUser);
      mockVerifyPassword.mockResolvedValue(false);
      const res = await POST(makeRequest({ email: 'john@example.com', password: 'wrongpassword' }));
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.message).toMatch(/invalid password/i);
    });
  });

  describe('successful login (200)', () => {
    it('returns 200 with user info and sets cookie for a regular user', async () => {
      mockFindUserByEmail.mockResolvedValue(validUser);
      mockVerifyPassword.mockResolvedValue(true);

      const res = await POST(makeRequest({ email: 'john@example.com', password: 'password123' }));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('success');
      expect(body.user.email).toBe('john@example.com');
      expect(body.user.role).toBe('User');

      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toMatch(/test_session=/);
    });

    it('includes doctorStatus in the response for Doctor accounts', async () => {
      const doctorUser = { ...validUser, role: 'Doctor' };
      mockFindUserByEmail.mockResolvedValue(doctorUser);
      mockVerifyPassword.mockResolvedValue(true);
      mockFindDoctorByUserId.mockResolvedValue({ approvalstatus: 'Approved' });

      const res = await POST(makeRequest({ email: 'john@example.com', password: 'password123' }));
      const body = await res.json();
      expect(body.user.doctorStatus).toBe('Approved');
    });

    it('normalises email to lowercase before lookup', async () => {
      mockFindUserByEmail.mockResolvedValue(validUser);
      mockVerifyPassword.mockResolvedValue(true);

      await POST(makeRequest({ email: 'JOHN@EXAMPLE.COM', password: 'password123' }));
      expect(mockFindUserByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });
});
