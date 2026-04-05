import Link from 'next/link';
import { ChevronLeft, ExternalLink, FileText, FlaskConical } from 'lucide-react';
import { redirect } from 'next/navigation';

import { getCurrentUser, isApprovedDoctor } from '@/lib/auth/current-user';
import { getDoctorAppointmentDetailsById } from '@/lib/repositories/appointment-repository';
import { getPatientPrescribedTestsWithReports } from '@/lib/repositories/test-report-repository';

function formatDate(value: string | null) {
    if (!value) {
        return 'N/A';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return value;
    }
    return parsed.toLocaleDateString();
}

export default async function PatientTestReportsPage({
    params,
}: {
    params: Promise<{ patientId: string; appointmentId: string }>;
}) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }

    if (!(await isApprovedDoctor(currentUser))) {
        redirect('/doctor/pending');
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

    const appointmentDetails = await getDoctorAppointmentDetailsById(doctorId, parsedAppointmentId);
    if (
        !appointmentDetails ||
        appointmentDetails.patientid !== parsedPatientId ||
        appointmentDetails.status !== 'Scheduled'
    ) {
        redirect('/dashboard/doctor-appointments');
    }

    const rows = await getPatientPrescribedTestsWithReports(parsedPatientId);

    return (
        <main className="min-h-screen bg-slate-50 p-6 md:p-12">
            <div className="mx-auto max-w-5xl space-y-6">
                <Link
                    href={`/dashboard/doctor-appointments/patient/${parsedPatientId}/${parsedAppointmentId}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 transition hover:text-blue-700"
                >
                    <ChevronLeft size={16} /> Back to Patient Profile
                </Link>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
                    <div className="mb-5 flex items-center gap-3">
                        <div className="rounded-lg bg-cyan-100 p-2 text-cyan-700">
                            <FlaskConical size={18} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Patient Test Reports</h1>
                            <p className="text-sm text-slate-500">Review uploaded and pending test reports for this patient.</p>
                        </div>
                    </div>

                    {rows.length === 0 ? (
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">
                            No prescribed tests found for this patient.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {rows.map((row) => (
                                <article
                                    key={row.prescribedTestId}
                                    className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-lg font-bold text-slate-900">{row.testName}</h2>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Category: <span className="font-medium text-slate-800">{row.testCategory || 'General'}</span>
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Prescription: <span className="font-medium text-slate-800">#{row.prescriptionId}</span>
                                                {row.appointmentDate ? ` • ${row.appointmentDate}` : ''}
                                            </p>
                                        </div>

                                        <span
                                            className={[
                                                'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold',
                                                row.status === 'Uploaded'
                                                    ? 'bg-emerald-100 text-emerald-700'
                                                    : 'bg-amber-100 text-amber-700',
                                            ].join(' ')}
                                        >
                                            {row.status}
                                        </span>
                                    </div>

                                    {row.status === 'Uploaded' ? (
                                        <div className="mt-3 space-y-1 text-sm text-slate-600">
                                            <p>
                                                Uploaded at: <span className="font-medium text-slate-800">{row.uploadedAt ?? 'N/A'}</span>
                                            </p>
                                            <p>
                                                Center: <span className="font-medium text-slate-800">{row.centerName ?? 'Not provided'}</span>
                                            </p>
                                            <p>
                                                Appointment date: <span className="font-medium text-slate-800">{formatDate(row.appointmentDate)}</span>
                                            </p>
                                            {row.reportFileUrl ? (
                                                <Link
                                                    href={row.reportFileUrl}
                                                    target="_blank"
                                                    className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    Open uploaded report
                                                    <ExternalLink size={14} />
                                                </Link>
                                            ) : null}
                                        </div>
                                    ) : (
                                        <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                                            <FileText size={14} /> Report not uploaded yet.
                                        </p>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
