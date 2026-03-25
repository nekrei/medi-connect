import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { pool } from '@/lib/db'; 
import PrescribeClient from './prescribe-client';

export default async function PrescribePage(props: { params: Promise<{ appointmentId: string }> }) {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'Doctor') {
        redirect('/login');
    }

    const { appointmentId } = await props.params;

    // Fetch appointment details
    const client = await pool.connect();
    let appointment;
    try {
        const res = await client.query(
            `SELECT a.patientid, c.doctorid, a.appointmentdate 
             FROM appointments a 
             JOIN chamberschedules s ON a.scheduleid = s.scheduleid 
             JOIN chambers c ON s.chamberid = c.chamberid
             WHERE a.appointmentid = $1`,
            [appointmentId]
        );
        appointment = res.rows[0];
    } finally {
        client.release();
    }

    if (!appointment) {
        return <div className="p-8 text-center">Appointment not found.</div>;
    }

    // Double check that the current doctor owns this appointment
    // parseInt(user.id) might be needed depending on type of doctorid
    if (appointment.doctorid.toString() !== user.id) {
        return <div className="p-8 text-center text-red-500">You are not authorized to view this appointment.</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Write Prescription</h1>
            <p className="text-slate-500 mb-8">For Appointment #{appointmentId}</p>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <PrescribeClient 
                    appointmentId={parseInt(appointmentId)}
                    patientId={appointment.patientid}
                    doctorId={appointment.doctorid}
                    appointmentDate={new Date(new Date(appointment.appointmentdate).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, -1)}
                />
            </div>
        </div>
    );
}
