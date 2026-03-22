'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { PatientAppointmentRow } from '@/lib/repositories/appointment-repository';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    Building2, 
    User,
    CheckCircle2,
    XCircle,
    Clock3,
    Ban
} from 'lucide-react';
import { cancelPatientAppointment } from './actions';

interface PatientAppointmentsClientProps {
    initialAppointments: PatientAppointmentRow[];
}

type FilterType = 'all' | 'upcoming' | 'past';

export default function PatientAppointmentsClient({ initialAppointments }: PatientAppointmentsClientProps) {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredAppointments = initialAppointments.filter(app => {
        if (filter === 'all') return true;
        if (filter === 'upcoming') {
            return app.status === 'Pending' || app.status === 'Scheduled';
        }
        if (filter === 'past') {
            return app.status === 'Completed' || app.status === 'Cancelled' || app.status === 'Absent' || app.status === 'Denied';
        }
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Completed': return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
            case 'Cancelled': 
            case 'Denied': return <XCircle className="w-5 h-5 text-red-500" />;
            case 'Absent': return <Ban className="w-5 h-5 text-slate-500" />;
            case 'Scheduled': return <Calendar className="w-5 h-5 text-blue-500" />;
            case 'Pending': return <Clock3 className="w-5 h-5 text-amber-500" />;
            default: return <Clock className="w-5 h-5 text-slate-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'Cancelled': 
            case 'Denied': return 'bg-red-100 text-red-700 border-red-200';
            case 'Absent': return 'bg-slate-100 text-slate-700 border-slate-200';
            case 'Scheduled': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            {/* Filters */}
            <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
                {(['all', 'upcoming', 'past'] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            filter === f 
                            ? 'bg-white text-blue-600 shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                        }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="grid gap-4">
                {filteredAppointments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
                        <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <h3 className="text-lg font-medium text-slate-900">No appointments found</h3>
                        <p className="text-slate-500 mt-1">You don't have any {filter !== 'all' ? filter : ''} appointments.</p>
                    </div>
                ) : (
                    filteredAppointments.map((app) => (
                        <div 
                            key={app.appointmentid} 
                            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 items-start md:items-center hover:border-blue-200 transition-colors shadow-sm hover:shadow-md"
                        >
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
                                            <User size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900">Dr. {app.doctorname}</h3>
                                            <p className="text-sm text-slate-500">{app.doctordesignation}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {(app.status === 'Pending' || app.status === 'Scheduled') && (
                                            <button 
                                                onClick={async () => await cancelPatientAppointment(app.appointmentid)}
                                                className="text-red-600 hover:bg-red-50 px-3 py-1 font-semibold rounded-md text-sm border border-red-200 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                        )}
                                        <div className={`px-3 py-1 rounded-full border text-xs font-semibold flex items-center gap-1.5 ${getStatusColor(app.status)}`}>
                                            {getStatusIcon(app.status)}
                                            {app.status}
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-slate-400" />
                                        <span>
                                            {app.timeslot 
                                                ? format(new Date(app.timeslot), 'MMM dd, yyyy') 
                                                : (app.requestedat ? format(new Date(app.requestedat), 'MMM dd, yyyy') : 'Date TBD')}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-slate-400" />
                                        <span>
                                            {app.timeslot 
                                                ? format(new Date(app.timeslot), 'h:mm a') 
                                                : app.chamberduration}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Building2 className="w-4 h-4 text-slate-400" />
                                        <span>{app.hospitalname}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-slate-400" />
                                        <span className="truncate" title={app.chamberloc}>{app.chamberloc}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
