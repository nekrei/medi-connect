import { POST } from '@/app/api/auth/register/route';

// ── mock dependencies ──────────────────────────────────────────────────────────
const mockFindUserByEmail = jest.fn();
const mockCreateUser = jest.fn();
const mockCreatePhoneNumber = jest.fn();
const mockCreateDoctor = jest.fn();
const mockHashPassword = jest.fn();
const mockCreateSessionToken = jest.fn();

jest.mock('@/lib/repositories/user-repository', () => ({
  findUserByEmail: (...args: unknown[]) => mockFindUserByEmail(...args),
  createUser: (...args: unknown[]) => mockCreateUser(...args),
  createPhoneNumber: (...args: unknown[]) => mockCreatePhoneNumber(...args),
  createDoctor: (...args: unknown[]) => mockCreateDoctor(...args),
}));

jest.mock('@/lib/auth/password', () => ({
  hashPassword: (...args: unknown[]) => mockHashPassword(...args),
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
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const validPatientBody = {
  username: 'johndoe',
  firstname: 'John',
  lastname: 'Doe',
  email: 'john@example.com',
  phonenumber: '01712345678',
  dateofbirth: '1990-01-01',
  sex: 'Male',
  bloodtype: 'O+',
  password: 'password123',
};

const validDoctorBody = {
  ...validPatientBody,
  email: 'doctor@example.com',
  registrationnumber: 'BMDC-12345',
  designation: 'MBBS, MD',
  startpracticedate: '2010-01-01',
  registrationexpiry: '2030-01-01',
};

const createdUser = { userid: 1, email: 'john@example.com', firstname: 'John', lastname: 'Doe', role: 'User' };
const createdDoctorUser = { userid: 2, email: 'doctor@example.com', firstname: 'John', lastname: 'Doe', role: 'Doctor' };

beforeEach(() => {
  jest.clearAllMocks();
  mockHashPassword.mockResolvedValue('hashed_password');
  mockCreateSessionToken.mockResolvedValue('mock-jwt-token');
  mockCreatePhoneNumber.mockResolvedValue(undefined);
});

describe('POST /api/auth/register', () => {
  describe('validation errors (400)', () => {
    it('returns 400 when required fields are missing', async () => {
      const res = await POST(makeRequest({ email: 'test@example.com' }));
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.status).toBe('error');
    });

    it('returns 400 for an invalid email', async () => {
      const res = await POST(makeRequest({ ...validPatientBody, email: 'not-an-email' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const res = await POST(makeRequest({ ...validPatientBody, password: 'short' }));
      expect(res.status).toBe(400);
    });

    it('returns 400 when username is too short (< 3 chars)', async () => {
      const res = await POST(makeRequest({ ...validPatientBody, username: 'ab' }));
      expect(res.status).toBe(400);
    });
  });

  describe('conflict (409)', () => {
    it('returns 409 when email is already registered', async () => {
      mockFindUserByEmail.mockResolvedValue({ userid: 99, email: 'john@example.com' });

      const res = await POST(makeRequest(validPatientBody));
      expect(res.status).toBe(409);
      const body = await res.json();
      expect(body.message).toMatch(/email already registered/i);
    });
  });

  describe('successful patient registration (200)', () => {
    it('creates a User account and returns 200', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      const res = await POST(makeRequest(validPatientBody));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.status).toBe('success');
      expect(body.user.role).toBe('User');
      expect(body.user.email).toBe('john@example.com');
    });

    it('sets the session cookie after registration', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      const res = await POST(makeRequest(validPatientBody));
      const setCookieHeader = res.headers.get('set-cookie');
      expect(setCookieHeader).toMatch(/test_session=/);
    });

    it('creates a phone number for the new user', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      await POST(makeRequest(validPatientBody));
      expect(mockCreatePhoneNumber).toHaveBeenCalledWith({
        userid: createdUser.userid,
        phonenumber: validPatientBody.phonenumber,
      });
    });

    it('normalises email to lowercase', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      await POST(makeRequest({ ...validPatientBody, email: 'JOHN@EXAMPLE.COM' }));
      expect(mockFindUserByEmail).toHaveBeenCalledWith('john@example.com');
    });
  });

  describe('successful doctor registration (200)', () => {
    it('creates a Doctor account when registrationnumber is provided', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdDoctorUser);
      mockCreateDoctor.mockResolvedValue({ doctorid: 2, approvalstatus: 'Pending', registrationnumber: 'BMDC-12345', designation: 'MBBS, MD', startpracticedate: '2010-01-01', registrationexpiry: '2030-01-01' });

      const res = await POST(makeRequest(validDoctorBody));
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.user.role).toBe('Doctor');
      expect(body.user.doctorStatus).toBe('Pending');
      expect(body.message).toMatch(/awaiting admin approval/i);
    });

    it('calls createDoctor with correct arguments', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdDoctorUser);
      mockCreateDoctor.mockResolvedValue({ doctorid: 2, approvalstatus: 'Pending', registrationnumber: 'BMDC-12345', designation: 'MBBS, MD', startpracticedate: '2010-01-01', registrationexpiry: '2030-01-01' });

      await POST(makeRequest(validDoctorBody));

      expect(mockCreateDoctor).toHaveBeenCalledWith(expect.objectContaining({
        doctorid: createdDoctorUser.userid,
        registrationnumber: 'BMDC-12345',
      }));
    });

    it('does not call createDoctor for patient registrations', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockResolvedValue(createdUser);

      await POST(makeRequest(validPatientBody));
      expect(mockCreateDoctor).not.toHaveBeenCalled();
    });
  });

  describe('server error (500)', () => {
    it('returns 500 when createUser throws an unexpected error', async () => {
      mockFindUserByEmail.mockResolvedValue(null);
      mockCreateUser.mockRejectedValue(new Error('DB connection error'));

      const res = await POST(makeRequest(validPatientBody));
      expect(res.status).toBe(500);
      const body = await res.json();
      expect(body.status).toBe('error');
      expect(body.message).toMatch(/internal server error/i);
    });
  });
});
