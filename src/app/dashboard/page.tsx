import Link from 'next/link';
import { redirect } from 'next/navigation';

import LogoutButton from '@/components/auth/logout-button';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 px-6 py-0 flex items-center justify-between">
                <div className="flex items-center gap-2 py-4">
                    <span className="text-2xl">❤️</span>
                    <span className="text-xl font-bold text-blue-600">MediConnect</span>
                </div>
                <nav className="flex items-center gap-1 h-full">
                    <Link
                        href="/dashboard"
                        className="px-4 py-5 text-sm font-medium text-neutral-600 hover:text-blue-600 border-b-2 border-blue-600 transition"
                    >
                        Dashboard
                    </Link>
                    <Link
                        href="/map"
                        className="px-4 py-5 text-sm font-medium text-neutral-600 hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600 transition"
                    >
                        Map
                    </Link>
                    {user.role === 'Admin' && (
                        <Link
                            href="/admin"
                            className="px-4 py-5 text-sm font-medium text-blue-600 hover:text-blue-700 border-b-2 border-transparent hover:border-blue-600 transition"
                        >
                            Admin Panel
                        </Link>
                    )}
                </nav>
                <div className="flex items-center gap-4">
                    <span className="text-sm text-neutral-500">{user.name}</span>
                    <LogoutButton />
                </div>
            </header>

            {/* Content */}
            <main className="mx-auto max-w-3xl px-4 py-10">
                <div className="space-y-4 rounded-lg border bg-white p-6">
                    <h1 className="text-2xl font-semibold">Welcome back, {user.name}.</h1>
                    <p className="text-sm text-neutral-500">Signed in as: {user.email}</p>
                    <p className="text-sm text-neutral-500">Role: {user.role}</p>
                </div>
            </main>
        </div>
    );
}
