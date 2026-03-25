'use server';

import { updateAppointmentStatus, grantAccess } from '@/lib/repositories/appointment-repository';
import { revalidatePath } from 'next/cache';

export async function cancelPatientAppointment(appointmentId: number) {
    await updateAppointmentStatus(appointmentId, 'Cancelled');
    revalidatePath('/dashboard/appointments');
}

export async function grantPatientMedicalAccessAction(appointmentId: number) {
    await grantAccess(appointmentId);
    revalidatePath('/dashboard/appointments');
}
