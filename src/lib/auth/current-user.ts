import 'server-only';

import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/lib/auth/cookie';
import { verifySessionToken } from '@/lib/auth/session';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Doctor' | 'User';
  doctorStatus?: 'Approved' | 'Pending' | 'Rejected';     
};

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const payload = await verifySessionToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    doctorStatus: payload.doctorStatus,
  };
}
