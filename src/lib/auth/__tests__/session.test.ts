import { createSessionToken, verifySessionToken, type SessionPayload } from '@/lib/auth/session';

const basePayload: SessionPayload = {
  sub: '42',
  email: 'user@example.com',
  name: 'John Doe',
  role: 'User',
};

describe('createSessionToken', () => {
  it('returns a non-empty JWT string', async () => {
    const token = await createSessionToken(basePayload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(0);
    // JWTs have three dot-separated parts
    expect(token.split('.')).toHaveLength(3);
  });

  it('encodes role and email into the token', async () => {
    const token = await createSessionToken(basePayload);
    const payload = await verifySessionToken(token);
    expect(payload?.email).toBe('user@example.com');
    expect(payload?.role).toBe('User');
  });

  it('includes doctorStatus when provided', async () => {
    const doctorPayload: SessionPayload = { ...basePayload, role: 'Doctor', doctorStatus: 'Pending' };
    const token = await createSessionToken(doctorPayload);
    const payload = await verifySessionToken(token);
    expect(payload?.doctorStatus).toBe('Pending');
  });

  it('produces different tokens for different users', async () => {
    const token1 = await createSessionToken({ ...basePayload, sub: '1' });
    const token2 = await createSessionToken({ ...basePayload, sub: '2' });
    expect(token1).not.toBe(token2);
  });
});

describe('verifySessionToken', () => {
  it('returns the original payload for a valid token', async () => {
    const token = await createSessionToken(basePayload);
    const payload = await verifySessionToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('42');
    expect(payload?.name).toBe('John Doe');
    expect(payload?.role).toBe('User');
  });

  it('returns null for a tampered token', async () => {
    const token = await createSessionToken(basePayload);
    const tampered = token.slice(0, -4) + 'xxxx';
    expect(await verifySessionToken(tampered)).toBeNull();
  });

  it('returns null for an empty string', async () => {
    expect(await verifySessionToken('')).toBeNull();
  });

  it('returns null for a completely invalid string', async () => {
    expect(await verifySessionToken('not.a.jwt')).toBeNull();
  });

  it('returns null for a token signed with a different secret', async () => {
    // Build a token signed with a different key using jose directly
    const { SignJWT } = await import('jose');
    const otherSecret = new TextEncoder().encode('a-completely-different-secret-key-here!!!!');
    const foreignToken = await new SignJWT(basePayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(otherSecret);

    expect(await verifySessionToken(foreignToken)).toBeNull();
  });
});
