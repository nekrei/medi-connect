'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LogOut } from 'lucide-react';

export default function LogoutButton() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    async function onLogout() {
        setIsLoading(true);

        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <button
            onClick={onLogout}
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 hover:text-rose-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
            <LogOut size={16} />
            {isLoading ? 'Logging out...' : 'Logout'}
        </button>
    );
}
