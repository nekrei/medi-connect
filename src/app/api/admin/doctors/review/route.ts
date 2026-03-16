import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/current-user';
import { reviewDoctor } from '@/lib/repositories/user-repository';

const reviewSchema = z.object({
    doctorid: z.number().int().positive(),
    status: z.enum(['Approved', 'Rejected']),
    rejectionReason: z.string().optional(),
});

/** POST /api/admin/doctors/review
 *  Body: { doctorid: number, status: "Approved" | "Rejected" }
 *  Sets the doctor's ApprovalStatus and records who reviewed it.
 *  Only accessible to Admin users.
 */
export async function POST(request: Request) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'Admin') {
        return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ status: 'error', message: 'Invalid JSON' }, { status: 400 });
    }

    const parse = reviewSchema.safeParse(body);
    if (!parse.success) {
        return NextResponse.json(
            { status: 'error', message: 'Invalid request body', errors: parse.error.issues },
            { status: 422 }
        );
    }

    const { doctorid, status, rejectionReason } = parse.data;

    const updated = await reviewDoctor({
        doctorid,
        status,
        reviewedby: Number(currentUser.id),
        rejectionReason,
    });

    if (!updated) {
        return NextResponse.json(
            { status: 'error', message: 'Doctor record not found' },
            { status: 404 }
        );
    }

    return NextResponse.json({
        status: 'success',
        message: `Doctor ${status.toLowerCase()} successfully`,
        data: updated,
    });
}
