'use server';

import { updateAppointmentStatus } from '@/lib/repositories/appointment-repository';
import { revalidatePath } from 'next/cache';

export async function cancelPatientAppointment(appointmentId: number) {
    await updateAppointmentStatus(appointmentId, 'Cancelled');
    revalidatePath('/dashboard/appointments');
}
