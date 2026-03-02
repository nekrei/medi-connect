import { NextResponse } from 'next/server';
import { z } from 'zod';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth/cookie';
import { hashPassword } from '@/lib/auth/password';
import { createSessionToken } from '@/lib/auth/session';
import {
    createDoctor,
    createUser,
    ensureUsersTable,
    findUserByEmail,
} from '@/lib/repositories/user-repository';

const registerSchema = z.object({
    username: z.string().min(3).max(50).trim(),
    firstname: z.string().min(1).max(50).trim(),
    lastname: z.string().min(1).max(50).trim(),
    email: z.string().email().transform((value) => value.toLowerCase().trim()),
    dateofbirth: z.string(),
    sex: z.string().nullable(),
    bloodtype: z.string().nullable(),
    password: z.string().min(8).max(128),
    // Doctor-specific fields — presence of registrationnumber triggers Doctor role
    registrationnumber: z.string().max(50).trim().optional(),
    designation: z.string().max(100).trim().nullable().optional(),
    startpracticedate: z.string().nullable().optional(),
    registrationexpiry: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    // Role is derived server-side — never trusted from the client.
    const isDoctor = Boolean(data.registrationnumber);
    const role = isDoctor ? 'Doctor' : 'User';

    await ensureUsersTable();

    const existing = await findUserByEmail(data.email);
    if (existing) {
        return NextResponse.json(
            { message: 'Email already registered', status: 'error' },
            { status: 409 }
        );
    }

    if (isDoctor && !data.registrationnumber) {
        return NextResponse.json(
            { message: 'Registration number is required for doctor accounts', status: 'error' },
            { status: 422 }
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
        role,
    });

    let doctorStatus: string | undefined;

    if (isDoctor) {
        const doctor = await createDoctor({
            doctorid: user.userid,
            designation: data.designation ?? null,
            registrationnumber: data.registrationnumber!,
            startpracticedate: data.startpracticedate ?? null,
            registrationexpiry: data.registrationexpiry ?? null,
        });
        doctorStatus = doctor.approvalstatus; // 'Pending'
    }

    const token = await createSessionToken({
        sub: user.userid.toString(),
        email: user.email,
        name: `${user.firstname} ${user.lastname ?? ''}`.trim(),
        role,
        ...(doctorStatus !== undefined && { doctorStatus }),
    });

    const response = NextResponse.json({
        status: 'success',
        message: isDoctor
            ? 'Doctor account created — awaiting admin approval'
            : 'Account created successfully',
        user: {
            id: user.userid,
            email: user.email,
            name: `${user.firstname} ${user.lastname ?? ''}`.trim(),
            role,
            ...(doctorStatus !== undefined && { doctorStatus }),
        },
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid request body', errors: error.issues },
        { status: 400 }
      );
    }
    console.error('[register]', error);
    return NextResponse.json(
      { status: 'error', message: 'Internal server error' },
      { status: 500 }
    );
  }
}
