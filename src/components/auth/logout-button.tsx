'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

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
            className="rounded-md bg-black px-4 py-2 text-sm text-white disabled:opacity-60"
        >
            {isLoading ? 'Logging out...' : 'Logout'}
        </button>
    );
}
