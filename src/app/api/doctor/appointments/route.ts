import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser, isApprovedDoctor } from '@/lib/auth/current-user';
import {
    AppointmentStatus,
    listDoctorAppointmentHospitals,
    listDoctorAppointments,
    listDoctorAppointmentSchedules,
} from '@/lib/repositories/appointment-repository';

const querySchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    hospital: z.string().trim().min(1).optional(),
    scheduleId: z.coerce.number().int().positive().optional(),
    pendingOnly: z.enum(['true', 'false']).optional(),
});

export async function GET(request: Request) {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isApprovedDoctor(currentUser))) {
        return NextResponse.json({ status: 'error', message: 'Doctor approval required' }, { status: 403 });
    }

    const doctorId = Number(currentUser.id);
    if (!Number.isFinite(doctorId)) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = new URL(request.url).searchParams;
    const rawQuery = {
        date: searchParams.get('date') || undefined,
        hospital: searchParams.get('hospital') || undefined,
        scheduleId: searchParams.get('scheduleId') || undefined,
        pendingOnly: searchParams.get('pendingOnly') || undefined,
    };

    const parsed = querySchema.safeParse(rawQuery);
    if (!parsed.success) {
        return NextResponse.json(
            { status: 'error', message: 'Invalid query parameters', errors: parsed.error.issues },
            { status: 400 }
        );
    }

    const [appointments, hospitals, schedules] = await Promise.all([
        listDoctorAppointments({
            doctorId,
            date: parsed.data.date ?? null,
            hospital: parsed.data.hospital ?? null,
            scheduleId: parsed.data.scheduleId ?? null,
            statuses: (parsed.data.pendingOnly === 'true' 
                ? ['Pending'] 
                : ['Scheduled', 'Completed', 'Cancelled', 'Denied', 'Absent']) as AppointmentStatus[],
        }),
        listDoctorAppointmentHospitals(doctorId),
        listDoctorAppointmentSchedules(doctorId),
    ]);

    return NextResponse.json({
        status: 'success',
        data: appointments,
        filters: {
            hospitals,
            schedules,
        },
    });
}