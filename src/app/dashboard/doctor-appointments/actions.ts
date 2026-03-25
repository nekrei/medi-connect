'use server';

import { updateAppointmentStatus, requestAccess } from '@/lib/repositories/appointment-repository';
import { revalidatePath } from 'next/cache';

export async function setAppointmentStatusAction(appointmentId: number, status: 'Scheduled' | 'Denied' | 'Completed' | 'Cancelled' | 'Pending' | 'Absent') {
    await updateAppointmentStatus(appointmentId, status);
    revalidatePath('/dashboard/doctor-appointments');
}

export async function requestMedicalHistoryAccessAction(appointmentId: number) {
    await requestAccess(appointmentId);
    revalidatePath('/dashboard/doctor-appointments');
}
