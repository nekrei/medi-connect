import {
    Pill,
    CalendarPlus,
    Microscope,
    Search,
    Bell,
    User,
    ChevronRight,
} from 'lucide-react';
import Link from 'next/link';

import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';

import { getAppointmentByPatient } from '@/lib/repositories/appointment-repository';
import { getSearchedPrescriptions } from '@/lib/repositories/prescription-repository';
import { format } from 'date-fns';

// --- Types ---
interface ActionCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorClass: string;
    href: string;
}

// --- Reusable Components ---
const ActionCard = ({ title, description, icon, colorClass, href }: ActionCardProps) => (
    <Link
        href={href}
        aria-label={`${title} - ${description}`}
        className="flex flex-col p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
    >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorClass}`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed mb-4">{description}</p>
        <div className="mt-auto flex items-center text-blue-600 font-semibold text-sm">
            Get Started <ChevronRight size={16} className="ml-1" />
        </div>
    </Link>
);

// --- Main Dashboard Page ---
const MedicalDashboard = async () => {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    const userName = user.name;
    const isDoctor = user.role === 'Doctor';
    const patientAppointments = await getAppointmentByPatient(parseInt(user.id, 10));
    
    // FETCH PRESCRIPTIONS
    const pastPrescriptions = await getSearchedPrescriptions({
        patientId: user.id,
    });
    
    const upcomingAppointments = patientAppointments.filter(a => a.status === 'Pending' || a.status === 'Scheduled');
    const pastAppointments = patientAppointments.filter(a => a.status !== 'Pending' && a.status !== 'Scheduled');
    
    const nextAppointment = upcomingAppointments.length > 0 ? upcomingAppointments.sort((a,b) => {
        const timeA = a.timeslot ? new Date(a.timeslot).getTime() : (a.requestedat ? new Date(a.requestedat).getTime() : 0);
        const timeB = b.timeslot ? new Date(b.timeslot).getTime() : (b.requestedat ? new Date(b.requestedat).getTime() : 0);
        return timeA - timeB;
    })[0] : null;

    const historyItems = [
        ...pastAppointments.map(a => ({
            type: 'Appointment',
            date: a.timeslot ? new Date(a.timeslot) : (a.requestedat ? new Date(a.requestedat) : new Date(0)),
            doctorName: a.doctorname,
            detail: a.status,
            colorClass: a.status === 'Completed' ? 'text-emerald-500' : 'text-slate-400',
            href: '/dashboard/appointments'
        })),
        ...pastPrescriptions.map(p => ({
            type: 'Prescription',
            date: new Date(p.appointmentDate),
            doctorName: p.doctorName,
            detail: `${p.medicincount} meds, ${p.testcount} tests`,
            colorClass: 'text-blue-500',
            href: '/dashboard/check-prescription'
        }))
    ];

    const recentHistory = historyItems.sort((a,b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

    return (
        <div className="min-h-screen bg-slate-50 flex">


            {/* 2. Main Content Area */}
            <main className="flex-1 p-4 md:p-8 lg:p-12">

                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900">Welcome back, {userName}</h1>
                        <p className="text-slate-500 mt-1">Your health overview is up to date.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-slate-400 hover:text-blue-600 bg-white rounded-full border border-slate-200 relative">
                            <Bell size={20} />
                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                        </button>
                        <Link href="/profile" className="flex items-center gap-3 pl-3 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-none">{userName}</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                        </Link>
                    </div>
                </header>

                {/* 3. Core Action Grid */}
                {isDoctor && (
                    <div className="mb-10">
                        <h2 className="text-xl font-bold text-slate-800 mb-4">Doctor Workspace</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <ActionCard
                                title="My Doctor Schedule"
                                description="View your patient appointments and filter them by date, hospital, or chamber schedule."
                                icon={<CalendarPlus size={24} />}
                                colorClass="bg-blue-100 text-blue-600"
                                href='/dashboard/doctor-appointments'
                            />
                            <ActionCard
                                title="Pending Appointments"
                                description="Review and confirm or deny new appointment requests from patients."
                                icon={<Bell size={24} />}
                                colorClass="bg-amber-100 text-amber-600"
                                href='/dashboard/doctor-pending-appointments'
                            />                            
                            <ActionCard
                                title="Add New Chamber"
                                description="Setup new practice chambers across hospitals and define customized visiting schedules easily."
                                icon={<CalendarPlus size={24} />}
                                colorClass="bg-emerald-100 text-emerald-600"
                                href='/dashboard/add-chamber'
                            />                        
                        </div>
                    </div>
                )}

                <div className="mb-10">
                    <h2 className="text-xl font-bold text-slate-800 mb-4">Patient Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <ActionCard
                            title= "My Appointments"
                            description={isDoctor ? "View the past and upcoming appointments you made as a patient." : "View your past and upcoming appointments."}
                            icon={<CalendarPlus size={24} />}
                            colorClass={isDoctor ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"}
                            href='/dashboard/appointments'
                        />
                        <ActionCard
                            title="Appoint Doctor"
                            description="Schedule virtual or in-person visits with primary care or specialists."
                            icon={<CalendarPlus size={24} />}
                            colorClass="bg-blue-100 text-blue-600"
                            href='/dashboard/appoint-doctor'
                        />
                        <ActionCard
                            title="Check Prescription"
                            description={isDoctor ? "Open prescription records and review past medication plans." : "Track active medications, dosage instructions, and request pharmacy refills."}
                            icon={<Pill size={24} />}
                            colorClass="bg-emerald-100 text-emerald-600"
                            href='/dashboard/check-prescription'
                        />
                        <ActionCard
                            title="Lab Test Results"
                            description="Track pending prescribed tests and upload reports as PDF or photos."
                            icon={<Microscope size={24} />}
                            colorClass="bg-purple-100 text-purple-600"
                            href='/dashboard/check-reports'
                        />
                        <ActionCard
                            title="Search Tests"
                            description="Find diagnostic centers by test availability, location, and price range."
                            icon={<Search size={24} />}
                            colorClass="bg-cyan-100 text-cyan-700"
                            href='/dashboard/search-tests'
                        />
                    </div>
                </div>

                {/* 4. Secondary Information (Timeline/Upcoming) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Recent Medical History</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {recentHistory.length > 0 ? recentHistory.map((item, idx) => (
                                <Link 
                                    href={item.href}
                                    key={idx} 
                                    className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer block"
                                >
                                    <div className="flex-1">
                                        <p className="font-semibold text-slate-800">{item.type} w/ Dr. {item.doctorName}</p>
                                        <p className="text-xs text-slate-400">
                                            {format(new Date(item.date), 'MMM dd, yyyy')}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${item.colorClass}`}>{item.detail}</span>
                                        <ChevronRight size={16} className="text-slate-300" />
                                    </div>
                                </Link>
                            )) : (
                                <div className="p-6 text-center text-slate-500 text-sm">
                                    No recent medical history found.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Next Appointment</h3>
                            {nextAppointment ? (
                                <>
                                    <p className="text-blue-100 text-sm mb-4">
                                        {nextAppointment.timeslot ? format(new Date(nextAppointment.timeslot), "MMMM do, yyyy 'at' h:mm a") : 'Date to be assigned'}
                                    </p>
                                    <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                        <p className="font-bold">Dr. {nextAppointment.doctorname}</p>
                                        <p className="text-xs text-blue-100 uppercase tracking-wide">{nextAppointment.doctordesignation}</p>
                                    </div>
                                    <Link href="/dashboard/appointments" className="mt-6 flex w-full justify-center items-center py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                                        View Details
                                    </Link>
                                </>
                            ) : (
                                <p className="text-blue-100 text-sm">You have no upcoming appointments.</p>
                            )}
                        </div>
                        {/* Decorative background circle */}
                        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500 rounded-full opacity-50"></div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default MedicalDashboard;