import 'server-only';

import { cookies } from 'next/headers';

import { SESSION_COOKIE_NAME } from '@/lib/auth/cookie';
import { verifySessionToken } from '@/lib/auth/session';
import { sql } from '@/lib/db';

export type CurrentUser = {
  id: string;
  email: string;
  name: string;
  role: 'Admin' | 'Doctor' | 'User';
  doctorStatus?: 'Approved' | 'Pending' | 'Rejected';     
};

export async function isApprovedDoctor(user: CurrentUser | null | undefined): Promise<boolean> {
  if (user?.role !== 'Doctor') {
    return false;
  }

  const rows = (await sql`
    SELECT approvalstatus
    FROM doctors
    WHERE doctorid = ${Number(user.id)}
    LIMIT 1
  `) as Array<{ approvalstatus: 'Approved' | 'Pending' | 'Rejected' }>;

  return rows[0]?.approvalstatus === 'Approved';
}

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
