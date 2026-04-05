'use server';

import { getCurrentUser, isApprovedDoctor } from '@/lib/auth/current-user';
import { getDoctorAppointmentDetailsById, updateAppointmentStatus } from '@/lib/repositories/appointment-repository';
import { revalidatePath } from 'next/cache';

export async function setAppointmentStatusAction(appointmentId: number, status: 'Scheduled' | 'Denied' | 'Completed' | 'Cancelled' | 'Pending' | 'Absent') {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        throw new Error('Unauthorized');
    }

    if (!(await isApprovedDoctor(currentUser))) {
        throw new Error('Doctor approval required');
    }

    const doctorId = Number(currentUser.id);
    const appointment = await getDoctorAppointmentDetailsById(doctorId, appointmentId);

    if (!appointment) {
        throw new Error('Unauthorized appointment access');
    }

    await updateAppointmentStatus(appointmentId, status);
    revalidatePath('/dashboard/doctor-appointments');
}
