'use server';

import { getScheduleByDoctor, addAppointment } from '@/lib/repositories/appointment-repository';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function fetchDoctorSchedules(doctorId: number) {
    const schedules = await getScheduleByDoctor(doctorId);
    return schedules;
}

export async function createPatientAppointment(doctorId: number, scheduleId: number, appointDate: string) {
    const user = await getCurrentUser();
    if (!user || user.role !== 'User') {
        throw new Error('Unauthorized');
    }

    const patientId = parseInt(user.id, 10);
    const result = await addAppointment(patientId, scheduleId, appointDate);
    return result;
}
