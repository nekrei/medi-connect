import type { Metadata } from "next";
import Link from "next/link";
import { Activity } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
    title: "Dashboard | MediConnect",
    description: "MediConnect patient dashboard",
};

const navItems = [
    { label: "Dashboard", href: "/dashboard", active: true },
    { label: "Medical Records", href: "#", active: false },
    { label: "Messages", href: "#", active: false },
    { label: "Settings", href: "#", active: false },
];

export default async function DashboardLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const user = await getCurrentUser();
    const isAdmin = user?.role === "Admin";
    const isDoctor = user?.role === "Doctor";

    return (
        <div className="min-h-screen bg-slate-50 lg:flex">
            <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 lg:flex">
                <div className="mb-10 flex items-center gap-2 text-blue-600">
                    <Activity size={28} strokeWidth={3} />
                    <span className="text-2xl font-black tracking-tight">MediConnect</span>
                </div>

                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => (
                        <Link
                            key={item.label}
                            href={item.href}
                            className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition ${item.active
                                    ? "bg-blue-50 text-blue-600"
                                    : "text-slate-600 hover:bg-slate-50"
                                }`}
                        >
                            {item.label}
                        </Link>
                    ))}
                    {isAdmin ? (
                        <Link
                            href="/admin"
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Admin Panel
                        </Link>
                    ) : null}
                    {isDoctor ? (
                        <Link
                            href="/dashboard/doctor-appointments"
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            My Doctor Schedule
                        </Link>
                    ) : null}
                    {isDoctor ? (
                        <Link
                            href="/dashboard/doctor-pending-appointments"
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Pending Appointments
                        </Link>
                    ) : null}
                    {isDoctor ? (
                        <Link
                            href="/dashboard/appointments"
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            My Patient Appointments
                        </Link>
                    ) : null}
                    {(!isDoctor && !isAdmin) ? (
                        <Link
                            href="/dashboard/appointments"
                            className="block rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            My Appointments
                        </Link>
                    ) : null}
                </nav>

                <div className="mt-auto rounded-xl bg-slate-100 p-4">
                    <p className="mb-1 text-xs font-bold uppercase text-slate-400">Support</p>
                    <p className="text-sm font-medium text-slate-700">Need help? Chat with a nurse 24/7</p>
                </div>
            </aside>

            <div className="flex-1">{children}</div>
        </div>
    );
}
