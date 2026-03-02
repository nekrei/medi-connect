import 'server-only';

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

import { env } from '@/lib/env';

export type SessionPayload = JWTPayload & {
  sub: string;
  email: string;
  name: string;
  role: string;               // 'Admin' | 'Doctor' | 'User'
  doctorStatus?: string;      // 'Pending' | 'Approved' | 'Rejected' — only set for Doctor role
};

const secret = new TextEncoder().encode(env.AUTH_SECRET);

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const result = await jwtVerify<SessionPayload>(token, secret, {
      algorithms: ['HS256'],
    });

    return result.payload;
  } catch {
    return null;
  }
}
