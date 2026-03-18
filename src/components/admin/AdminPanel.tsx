'use client';

import Link from 'next/link';
import { useState } from 'react';

import AddPoi from './AddPoi';
import ReviewDoctors from './ReviewDoctors';

type Section = 'review-doctors' | 'add-hospital' | 'add-dgcenter';

const navItems: { id: Section; label: string; icon: string }[] = [
    { id: 'review-doctors', label: 'Review Doctors', icon: '👨‍⚕️' },
    { id: 'add-hospital', label: 'Add Hospital', icon: '🏥' },
    { id: 'add-dgcenter', label: 'Add Diagnostic Center', icon: '🔬' },
];

export default function AdminPanel() {
    const [active, setActive] = useState<Section>('review-doctors');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-neutral-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">❤️</span>
                    <span className="text-xl font-bold text-blue-600">MediConnect</span>
                    <span className="text-neutral-300 mx-2">/</span>
                    <span className="text-neutral-600 font-medium">Admin Panel</span>
                </div>
                <Link
                    href="/dashboard"
                    className="text-sm text-blue-600 hover:underline"
                >
                    ← Back to Dashboard
                </Link>
            </header>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <aside className="w-64 bg-white border-r border-neutral-200 py-6 flex-shrink-0">
                    <p className="px-6 text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-3">
                        Settings
                    </p>
                    <nav className="space-y-1 px-3">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActive(item.id)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left ${
                                    active === item.id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-neutral-600 hover:bg-neutral-100'
                                }`}
                            >
                                <span className="text-base">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                    </nav>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-y-auto p-8">
                    {active === 'review-doctors' && <ReviewDoctors />}
                    {active === 'add-hospital' && <AddPoi type="hospital" />}
                    {active === 'add-dgcenter' && <AddPoi type="dgcenter" />}
                </main>
            </div>
        </div>
    );
}
