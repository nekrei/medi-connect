import Link from 'next/link';
import { ChevronLeft, Mail, MapPin, Phone, UserCircle2 } from 'lucide-react';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/auth/current-user';
import { getDoctorAppointmentDetailsById } from '@/lib/repositories/appointment-repository';
import { fetchBasicUserInfo, fetchContactUserInfo } from '@/lib/repositories/user-repository';

import PatientActions from './patient-actions';

function formatAddress(parts: Array<string | null>) {
    return parts.filter(Boolean).join(', ');
}

export default async function DoctorPatientProfilePage({
    params,
}: {
    params: Promise<{ patientId: string; appointmentId: string }>;
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser || currentUser.role !== 'Doctor') {
        redirect('/login');
    }

    const doctorId = Number(currentUser.id);
    if (!Number.isFinite(doctorId)) {
        redirect('/login');
    }

    const { patientId, appointmentId } = await params;
    const parsedPatientId = Number(patientId);
    const parsedAppointmentId = Number(appointmentId);

    if (!Number.isFinite(parsedPatientId) || !Number.isFinite(parsedAppointmentId)) {
        redirect('/dashboard/doctor-appointments');
    }

    const [appointmentDetails, patientBasicInfo, patientContactInfo] = await Promise.all([
        getDoctorAppointmentDetailsById(doctorId, parsedAppointmentId),
        fetchBasicUserInfo(parsedPatientId),
        fetchContactUserInfo(parsedPatientId),
    ]);

    if (
        !appointmentDetails ||
        appointmentDetails.patientid !== parsedPatientId ||
        appointmentDetails.status !== 'Scheduled' ||
        !patientBasicInfo
    ) {
        redirect('/dashboard/doctor-appointments');
    }

    const fullName = `${patientBasicInfo.firstname} ${patientBasicInfo.lastname}`.trim();
    const address = formatAddress([
        patientBasicInfo.propertyname,
        patientBasicInfo.holdingnumber,
        patientBasicInfo.road,
        patientBasicInfo.thananame,
        patientBasicInfo.districtname,
    ]);

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="mx-auto max-w-4xl space-y-6">
                <Link
                    href="/dashboard/doctor-appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                    <ChevronLeft size={16} /> Back to Appointments
                </Link>

                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-6 flex items-start gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                            <UserCircle2 className="h-10 w-10 text-slate-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">{fullName || `Patient #${parsedPatientId}`}</h1>
                            <p className="mt-1 text-sm text-slate-500">Patient Profile</p>
                        </div>
                    </div>

                    <div className="grid gap-5 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Email</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                                <Mail size={14} /> {patientBasicInfo.email || 'No email provided'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Phone Numbers</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                                <Phone size={14} /> {patientContactInfo?.phonenumbers.length ? patientContactInfo.phonenumbers.join(', ') : 'No phone number provided'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Date of Birth</p>
                            <p className="mt-1 text-sm text-slate-700">{patientBasicInfo.dateofbirth || 'Not provided'}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sex / Blood Type</p>
                            <p className="mt-1 text-sm text-slate-700">
                                {(patientBasicInfo.sex || 'Not specified')} / {(patientBasicInfo.bloodtype || 'Not specified')}
                            </p>
                        </div>
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Address</p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm text-slate-700">
                                <MapPin size={14} /> {address || 'Address not available'}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 border-t border-slate-200 pt-6">
                        <p className="mb-3 text-sm font-semibold text-slate-800">Actions</p>
                        <PatientActions
                            appointmentId={parsedAppointmentId}
                            patientId={parsedPatientId}
                        />
                    </div>
                </div>
            </div>
        </main>
    );
}
