import { getCurrentUser, isApprovedDoctor, type CurrentUser } from '@/lib/auth/current-user';

// ── mock next/headers ──────────────────────────────────────────────────────────
// Note: jest.mock() is hoisted – we cannot reference outer `const` variables inside
// the factory. Instead we capture the mock function via `require` in beforeEach.
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}));

// ── mock session verification ──────────────────────────────────────────────────
const mockVerifySessionToken = jest.fn();
jest.mock('@/lib/auth/session', () => ({
  verifySessionToken: (...args: unknown[]) => mockVerifySessionToken(...args),
}));

// ── mock SESSION_COOKIE_NAME ───────────────────────────────────────────────────
jest.mock('@/lib/auth/cookie', () => ({
  SESSION_COOKIE_NAME: 'test_session',
}));

// ── mock database ──────────────────────────────────────────────────────────────
const mockSql = jest.fn();
jest.mock('@/lib/db', () => ({
  sql: (...args: unknown[]) => mockSql(...args),
  pool: {},
}));

// Helper: configure what `cookies().get()` returns for this test
function setCookieValue(value: string | undefined) {
  const { cookies } = require('next/headers') as { cookies: jest.Mock };
  const mockGet = jest.fn().mockReturnValue(value !== undefined ? { value } : undefined);
  cookies.mockResolvedValue({ get: mockGet });
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ──────────────────────────────────────────────────────────────────────────────
describe('getCurrentUser', () => {
  it('returns null when no session cookie is present', async () => {
    setCookieValue(undefined);
    expect(await getCurrentUser()).toBeNull();
  });

  it('returns null when the token is invalid', async () => {
    setCookieValue('bad-token');
    mockVerifySessionToken.mockResolvedValue(null);
    expect(await getCurrentUser()).toBeNull();
  });

  it('returns a CurrentUser when the token is valid', async () => {
    setCookieValue('valid-token');
    mockVerifySessionToken.mockResolvedValue({
      sub: '7',
      email: 'alice@example.com',
      name: 'Alice Smith',
      role: 'User',
    });

    const user = await getCurrentUser();
    expect(user).toEqual({
      id: '7',
      email: 'alice@example.com',
      name: 'Alice Smith',
      role: 'User',
      doctorStatus: undefined,
    });
  });

  it('propagates doctorStatus for Doctor tokens', async () => {
    setCookieValue('doc-token');
    mockVerifySessionToken.mockResolvedValue({
      sub: '9',
      email: 'doc@example.com',
      name: 'Dr. Bob',
      role: 'Doctor',
      doctorStatus: 'Approved',
    });

    const user = await getCurrentUser();
    expect(user?.role).toBe('Doctor');
    expect(user?.doctorStatus).toBe('Approved');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
describe('isApprovedDoctor', () => {
  it('returns false for a null user', async () => {
    expect(await isApprovedDoctor(null)).toBe(false);
  });

  it('returns false for a non-Doctor role', async () => {
    const user: CurrentUser = { id: '1', email: 'u@e.com', name: 'User', role: 'User' };
    expect(await isApprovedDoctor(user)).toBe(false);
  });

  it('returns false for an Admin role', async () => {
    const user: CurrentUser = { id: '2', email: 'a@e.com', name: 'Admin', role: 'Admin' };
    expect(await isApprovedDoctor(user)).toBe(false);
  });

  it('returns true when the DB row shows Approved', async () => {
    const user: CurrentUser = { id: '5', email: 'd@e.com', name: 'Dr', role: 'Doctor' };
    mockSql.mockResolvedValue([{ approvalstatus: 'Approved' }]);
    expect(await isApprovedDoctor(user)).toBe(true);
  });

  it('returns false when the DB row shows Pending', async () => {
    const user: CurrentUser = { id: '5', email: 'd@e.com', name: 'Dr', role: 'Doctor' };
    mockSql.mockResolvedValue([{ approvalstatus: 'Pending' }]);
    expect(await isApprovedDoctor(user)).toBe(false);
  });

  it('returns false when the DB row shows Rejected', async () => {
    const user: CurrentUser = { id: '5', email: 'd@e.com', name: 'Dr', role: 'Doctor' };
    mockSql.mockResolvedValue([{ approvalstatus: 'Rejected' }]);
    expect(await isApprovedDoctor(user)).toBe(false);
  });

  it('returns false when no DB row is found', async () => {
    const user: CurrentUser = { id: '5', email: 'd@e.com', name: 'Dr', role: 'Doctor' };
    mockSql.mockResolvedValue([]);
    expect(await isApprovedDoctor(user)).toBe(false);
  });
});
