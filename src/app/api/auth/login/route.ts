import { NextResponse } from "next/server";

import {z} from 'zod';

import { SESSION_COOKIE_NAME, sessionCookieOptions } from '@/lib/auth/cookie';
import { createSessionToken } from '@/lib/auth/session';
import { verifyPassword } from '@/lib/auth/password';
import { ensureUsersTable, findDoctorByUserId, findUserByEmail } from '@/lib/repositories/user-repository';


const loginSchema = z.object({
  email: z.email().transform((value) => value.toLowerCase().trim()),
  password: z.string().min(8).max(128),
});


export async function POST(request: Request) {
    try{
        const body = await request.json();
        const data = loginSchema.parse(body);

        await ensureUsersTable();

        const user = await findUserByEmail(data.email);

        if(!user){
            return NextResponse.json(
                { status: 'error', message: 'Invalid email' },
                { status: 401 }
            );
        }

        const isPasswordValid = await verifyPassword(data.password, user.password);

        if(!isPasswordValid){
            return NextResponse.json(
                { status: 'error', message: 'Invalid password' },
                { status: 401 }
            );
        }

        // For doctor accounts, read the current approval status from DB
        let doctorStatus: string | undefined;
        if (user.role === 'Doctor') {
            const doctor = await findDoctorByUserId(user.userid);
            doctorStatus = doctor?.approvalstatus;
        }

        const token = await createSessionToken({
            sub: user.userid.toString(),
            email: user.email,
            name: `${user.firstname} ${user.lastname}`,
            role: user.role,
            ...(doctorStatus !== undefined && { doctorStatus }),
        });

        const response = NextResponse.json({
            status: 'success',
            message: 'Logged in successfully',
            user: {
                id: user.userid,
                email: user.email,
                name: `${user.firstname} ${user.lastname}`,
                role: user.role,
                ...(doctorStatus !== undefined && { doctorStatus }),
            },
        });

        response.cookies.set(SESSION_COOKIE_NAME, token, sessionCookieOptions);

        return response;

    }

    catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    status: 'error',
                    message: 'Invalid request data',
                    errors: error.issues,
                },
                {
                    status: 400,
                }
            );
        }

        return NextResponse.json(
            {
                status: 'error',
                message: 'Internal server error',
            },
            {
                status: 500,
            }
        );
    }
}

    