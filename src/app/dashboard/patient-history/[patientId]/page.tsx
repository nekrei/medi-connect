import { redirect } from 'next/navigation';
import { getCurrentUser, isApprovedDoctor } from '@/lib/auth/current-user';
import { getSearchedPrescriptions } from '@/lib/repositories/prescription-repository';
import { doctorHasScheduledAppointmentWithPatient } from '@/lib/repositories/appointment-repository';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PatientHistoryClient from './patient-history-client';

export default async function PatientHistoryPage({ params }: { params: Promise<{ patientId: string }> }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    if (!(await isApprovedDoctor(user))) {
        redirect('/doctor/pending');
    }

    const { patientId } = await params;
    const doctorId = Number(user.id);
    const parsedPatientId = Number(patientId);

    if (!Number.isFinite(doctorId) || !Number.isFinite(parsedPatientId)) {
        redirect('/dashboard/doctor-appointments');
    }

    const hasActiveScheduledAppointment = await doctorHasScheduledAppointmentWithPatient(doctorId, parsedPatientId);
    if (!hasActiveScheduledAppointment) {
        redirect('/dashboard/doctor-appointments');
    }

    // Fetch all prescriptions for the patient
    const pastPrescriptions = await getSearchedPrescriptions({
        patientId: String(parsedPatientId),
    });

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <Link
                    href="/dashboard/doctor-appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                    <ChevronLeft size={16} /> Back to Appointments
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">Patient Medical History</h1>
                    <p className="text-slate-500 mb-8">Review past prescriptions, notes, and medical records for Patient #{parsedPatientId}.</p>

                    <PatientHistoryClient prescriptions={pastPrescriptions} />
                </div>
            </div>
        </main>
    );
}