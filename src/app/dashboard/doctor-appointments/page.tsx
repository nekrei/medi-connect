'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CalendarDays, Clock3, Hospital, RefreshCw } from 'lucide-react';

type AppointmentRow = {
    appointmentid: number;
    patientid: number;
    patientname: string;
    patientemail: string | null;
    scheduleid: number;
    hospitalname: string;
    weekday: number;
    scheduleStart: string;
    scheduleEnd: string;
    esttime: string | null;
    status: 'Scheduled' | 'Completed' | 'Cancelled' | 'Denied' | 'Pending' | 'Absent';
    requestedat: string | null;
};

type HospitalFilter = {
    hospitalname: string;
};

type ScheduleFilter = {
    scheduleid: number;
    weekday: number;
    hospitalname: string;
    starttime: string;
    endtime: string;
};

type ApiResponse = {
    status: 'success' | 'error';
    message?: string;
    data?: AppointmentRow[];
    filters?: {
        hospitals: HospitalFilter[];
        schedules: ScheduleFilter[];
    };
};

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const STATUS_STYLES: Record<AppointmentRow['status'], string> = {
    Scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    Completed: 'bg-green-50 text-green-700 border-green-200',
    Cancelled: 'bg-slate-100 text-slate-700 border-slate-200',
    Denied: 'bg-red-50 text-red-700 border-red-200',
    Pending: 'bg-amber-50 text-amber-700 border-amber-200',
    Absent: 'bg-purple-50 text-purple-700 border-purple-200',
};

export default function DoctorAppointmentsPage() {
    const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
    const [hospitals, setHospitals] = useState<HospitalFilter[]>([]);
    const [schedules, setSchedules] = useState<ScheduleFilter[]>([]);
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedHospital, setSelectedHospital] = useState('All');
    const [selectedScheduleId, setSelectedScheduleId] = useState('All');
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        let active = true;

        async function fetchAppointments() {
            setIsLoading(true);
            setErrorMessage('');

            try {
                const params = new URLSearchParams();
                if (selectedDate) {
                    params.set('date', selectedDate);
                }
                if (selectedHospital !== 'All') {
                    params.set('hospital', selectedHospital);
                }
                if (selectedScheduleId !== 'All') {
                    params.set('scheduleId', selectedScheduleId);
                }

                const response = await fetch(`/api/doctor/appointments?${params.toString()}`, {
                    cache: 'no-store',
                });

                const payload = (await response.json()) as ApiResponse;
                if (!response.ok || payload.status !== 'success') {
                    if (!active) return;
                    setAppointments([]);
                    setErrorMessage(payload.message ?? 'Failed to load appointments.');
                    return;
                }

                if (!active) return;
                setAppointments(payload.data ?? []);
                setHospitals(payload.filters?.hospitals ?? []);
                setSchedules(payload.filters?.schedules ?? []);
            } catch {
                if (!active) return;
                setAppointments([]);
                setErrorMessage('Network error while loading appointments.');
            } finally {
                if (active) {
                    setIsLoading(false);
                }
            }
        }

        fetchAppointments();

        return () => {
            active = false;
        };
    }, [selectedDate, selectedHospital, selectedScheduleId]);

    const scheduleOptions = useMemo(() => {
        return schedules.map((schedule) => ({
            value: String(schedule.scheduleid),
            label: `${WEEKDAY_LABELS[schedule.weekday] ?? 'Day'} | ${schedule.starttime} - ${schedule.endtime} | ${schedule.hospitalname}`,
        }));
    }, [schedules]);

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-blue-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">Doctor Workspace</p>
                            <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">My Appointments</h1>
                            <p className="mt-3 max-w-3xl text-slate-600">
                                Review your patient appointment list and filter quickly by date, hospital, or chamber schedule.
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                        >
                            Back to dashboard
                        </Link>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-5 flex items-center gap-2 text-slate-700">
                        <RefreshCw size={16} />
                        <p className="text-sm font-semibold">Filters</p>
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Date</span>
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(event) => setSelectedDate(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Hospital</span>
                            <select
                                value={selectedHospital}
                                onChange={(event) => setSelectedHospital(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                <option value="All">All hospitals</option>
                                {hospitals.map((hospital) => (
                                    <option key={hospital.hospitalname} value={hospital.hospitalname}>
                                        {hospital.hospitalname}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule</span>
                            <select
                                value={selectedScheduleId}
                                onChange={(event) => setSelectedScheduleId(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                <option value="All">All schedules</option>
                                {scheduleOptions.map((schedule) => (
                                    <option key={schedule.value} value={schedule.value}>
                                        {schedule.label}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
                {errorMessage ? (
                    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
                ) : null}

                {isLoading ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                        Loading appointments...
                    </div>
                ) : appointments.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                        No appointments found for the selected filters.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((appointment) => {
                            const scheduledAt = appointment.esttime ? new Date(appointment.esttime) : null;
                            const displayDate = scheduledAt ? scheduledAt.toLocaleDateString() : 'Not assigned';
                            const displayTime = scheduledAt
                                ? scheduledAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : `${appointment.scheduleStart} - ${appointment.scheduleEnd}`;

                            return (
                                <article
                                    key={appointment.appointmentid}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                                >
                                    <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Patient</p>
                                                <h2 className="text-xl font-bold text-slate-900">{appointment.patientname}</h2>
                                                <p className="text-sm text-slate-500">{appointment.patientemail ?? 'No email provided'}</p>
                                            </div>

                                            <div className="grid gap-2 text-sm text-slate-700 sm:grid-cols-3">
                                                <p className="inline-flex items-center gap-2">
                                                    <Hospital size={16} className="text-blue-600" />
                                                    <span>{appointment.hospitalname}</span>
                                                </p>
                                                <p className="inline-flex items-center gap-2">
                                                    <CalendarDays size={16} className="text-blue-600" />
                                                    <span>{displayDate}</span>
                                                </p>
                                                <p className="inline-flex items-center gap-2">
                                                    <Clock3 size={16} className="text-blue-600" />
                                                    <span>{displayTime}</span>
                                                </p>
                                            </div>

                                            <p className="text-sm text-slate-500">
                                                Schedule: {WEEKDAY_LABELS[appointment.weekday] ?? 'Day'} | {appointment.scheduleStart} - {appointment.scheduleEnd}
                                            </p>
                                        </div>

                                        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${STATUS_STYLES[appointment.status]}`}>
                                            {appointment.status}
                                        </span>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}