import { NextResponse } from 'next/server';
import { z } from 'zod';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth/cookie';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session';
import {
    createUser,
    ensureUsersTable,
    findUserByEmail,
} from '@/lib/repositories/user-repository';

const registerSchema = z.object({
    username: z.string().min(3).max(50).trim(),
    firstname: z.string().min(1).max(50).trim(),
    lastname: z.string().min(1).max(50).trim(),
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    dateofbirth: z.string(), // make required if DB is NOT NULL
    sex: z.string().nullable(),         // keep as requested: string | null
    bloodtype: z.string().nullable(),   // keep as requested: string | null
    password: z.string().min(8).max(128),
    role: z.string().min(1).max(20),    // e.g. 'User'
});
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    await ensureUsersTable();

    const existing = await findUserByEmail(data.email);
    if (existing) {
        return NextResponse.json(
            {
                message: 'Email already registered', status: 'error' 
            },
            { 
                status: 409 
            }
        );
    }

    const passwordHash = await hashPassword(data.password);
    const user = await createUser({
        username: data.username,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.email,
        dateofbirth: data.dateofbirth,
        sex: data.sex,
        bloodtype: data.bloodtype,
        password: passwordHash,
        role: data.role,
    });

    const token = await createSessionToken({
        sub: user.userid.toString(), // use stable id
        email: user.email,
        name: `${user.firstname} ${user.lastname ?? ''}`.trim(),
    });

    const response = NextResponse.json({
        status: 'success',
        message: 'Account created successfully',
        user: {
            id: user.userid,
            email: user.email,
            name: `${user.firstname} ${user.lastname ?? ''}`.trim(),
        },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid request body',
          issues: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
