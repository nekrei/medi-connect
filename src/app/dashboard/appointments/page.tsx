import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { getAppointmentByPatient } from '@/lib/repositories/appointment-repository';
import PatientAppointmentsClient from './appointments-client';

export const metadata = {
    title: 'My Appointments | MediConnect',
};

export default async function PatientAppointmentsPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const appointments = await getAppointmentByPatient(parseInt(user.id, 10));

    return (
        <div className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900">My Appointments</h1>
                    <p className="text-slate-500 mt-2">Manage your upcoming visits and view your appointment history.</p>
                </header>

                <PatientAppointmentsClient initialAppointments={appointments} />
            </div>
        </div>
    );
}
