'use client';

import Link from 'next/link';
import { FileText, Pill, TestTube } from 'lucide-react';

type PatientActionsProps = {
    appointmentId: number;
    patientId: number;
};

export default function PatientActions({ appointmentId, patientId }: PatientActionsProps) {
    return (
        <div className="flex flex-wrap items-center gap-3">
            <Link
                href={`/dashboard/doctor-appointments/${appointmentId}/prescribe`}
                className="inline-flex items-center gap-2 rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
            >
                <Pill size={16} /> Write Prescription
            </Link>

            <Link
                href={`/dashboard/patient-history/${patientId}`}
                className="inline-flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
            >
                <FileText size={16} /> Show Patient History
            </Link>

            <Link
                href={`/dashboard/doctor-appointments/patient/${patientId}/${appointmentId}/test-reports`}
                className="inline-flex items-center gap-2 rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
            >
                <TestTube size={16} /> Show patient test reports
            </Link>
        </div>
    );
}
