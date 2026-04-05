import { hashPassword, verifyPassword } from '@/lib/auth/password';

describe('hashPassword', () => {
  it('returns a bcrypt hash (not the plain-text password)', async () => {
    const hash = await hashPassword('mySecret123');
    expect(hash).not.toBe('mySecret123');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('produces a different hash on each call (random salt)', async () => {
    const hash1 = await hashPassword('mySecret123');
    const hash2 = await hashPassword('mySecret123');
    expect(hash1).not.toBe(hash2);
  });

  it('handles the minimum-length password (8 chars)', async () => {
    const hash = await hashPassword('12345678');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });
});

describe('verifyPassword', () => {
  it('returns true when password matches its hash', async () => {
    const hash = await hashPassword('correctPassword!');
    expect(await verifyPassword('correctPassword!', hash)).toBe(true);
  });

  it('returns false when password does not match the hash', async () => {
    const hash = await hashPassword('correctPassword!');
    expect(await verifyPassword('wrongPassword!', hash)).toBe(false);
  });

  it('returns false for an empty string against a real hash', async () => {
    const hash = await hashPassword('somePassword');
    expect(await verifyPassword('', hash)).toBe(false);
  });
});
