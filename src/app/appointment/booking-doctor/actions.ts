'use server';

import { getScheduleByDoctor, addAppointment, checkSlotCount, getwaitingcount } from '@/lib/repositories/appointment-repository';
import { getCurrentUser } from '@/lib/auth/current-user';
import { sql } from '@/lib/db';

export async function fetchDoctorSchedules(doctorId: number) {
    const schedules = await getScheduleByDoctor(doctorId);
    return schedules;
}

export async function fetchScheduleAvailability(scheduleId: number, date: string) {
    const [slots, pendingCount] = await Promise.all([
        checkSlotCount(scheduleId, date),
        getwaitingcount(scheduleId, date)
    ]);
    return { slots, pendingCount };
}

export async function createPatientAppointment(doctorId: number, scheduleId: number, appointDate: string) {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error('Unauthorized');
    }

    const patientId = parseInt(user.id, 10);
    const result = await addAppointment(patientId, scheduleId, appointDate);
    return result;
}

export async function getChamberPrice(scheduleId: number): Promise<number> {
    const res = await sql`
        select checkupprice from 
        chamberschedules cs join chambers c on cs.chamberid = c.chamberid
        where cs.scheduleid = ${scheduleId}
    `
    console.log(res);
    return res[0]?.checkupprice || 0;
}
