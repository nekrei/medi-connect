import {
    Pill,
    CalendarPlus,
    Microscope,
    Bell,
    User,
    ChevronRight,
    Activity
} from 'lucide-react';

import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';

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
    <a
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
    </a>
);

// --- Main Dashboard Page ---
const MedicalDashboard = async () => {
    const user = await getCurrentUser();

    if(!user) {
        redirect('/login');
    }

    const userName = user.name;

    return (
        <div className="min-h-screen bg-slate-50 flex">
            {/* 1. Sidebar Navigation */}
            <aside className="w-64 bg-white border-r border-slate-200 hidden lg:flex flex-col p-6">
                <div className="flex items-center gap-2 text-blue-600 mb-10">
                    <Activity size={28} strokeWidth={3} />
                    <span className="text-2xl font-black tracking-tight">MediConnect</span>
                </div>

                <nav className="space-y-2 flex-1">
                    {['Dashboard', 'Medical Records', 'Messages', 'Settings'].map((item) => (
                        <a key={item} href="#" className={`block px-4 py-2.5 rounded-lg text-sm font-medium ${item === 'Dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {item}
                        </a>
                    ))}
                </nav>

                <div className="mt-auto p-4 bg-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-1">Support</p>
                    <p className="text-sm text-slate-700 font-medium">Need help? Chat with a nurse 24/7</p>
                </div>
            </aside>

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
                        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 leading-none">{userName}</p>
                                <p className="text-xs text-slate-500 mt-1">Patient ID: #4492</p>
                            </div>
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User size={20} />
                            </div>
                        </div>
                    </div>
                </header>

                {/* 3. Core Action Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <ActionCard
                        title="Check Prescription"
                        description="Track active medications, dosage instructions, and request pharmacy refills."
                        icon={<Pill size={24} />}
                        colorClass="bg-emerald-100 text-emerald-600"
                        href='#'
                    />
                    <ActionCard
                        title="Appoint Doctor"
                        description="Schedule virtual or in-person visits with primary care or specialists."
                        icon={<CalendarPlus size={24} />}
                        colorClass="bg-blue-100 text-blue-600"
                        href='#'
                    />
                    <ActionCard
                        title="Lab Test Results"
                        description="Securely view your latest blood work, imaging reports, and pathology."
                        icon={<Microscope size={24} />}
                        colorClass="bg-purple-100 text-purple-600"
                        href='#'
                    />
                </div>

                {/* 4. Secondary Information (Timeline/Upcoming) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-800">Recent Medical History</h2>
                        <div className="bg-white rounded-2xl border border-slate-100 divide-y divide-slate-50 overflow-hidden">
                            {[
                                { label: 'Blood Panel', date: 'Oct 24, 2025', status: 'Completed', color: 'text-emerald-500' },
                                { label: 'General Checkup', date: 'Sep 12, 2025', status: 'Completed', color: 'text-emerald-500' },
                                { label: 'Flu Vaccination', date: 'Aug 05, 2025', status: 'Archive', color: 'text-slate-400' },
                            ].map((item, idx) => (
                                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div>
                                        <p className="font-semibold text-slate-800">{item.label}</p>
                                        <p className="text-xs text-slate-400">{item.date}</p>
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${item.color}`}>{item.status}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-200 relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2">Next Appointment</h3>
                            <p className="text-blue-100 text-sm mb-4">You have a session today at 2:00 PM</p>
                            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
                                <p className="font-bold">Dr. Sarah Jenkins</p>
                                <p className="text-xs text-blue-100 uppercase tracking-wide">Cardiologist</p>
                            </div>
                            <button className="mt-6 w-full py-2 bg-white text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors">
                                Join Telehealth Call
                            </button>
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