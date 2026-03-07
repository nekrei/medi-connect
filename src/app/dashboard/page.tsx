import { redirect } from 'next/navigation';

import LogoutButton from '@/components/auth/logout-button';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function DashboardPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/login');
    }
    
    return (
        <div className="mx-auto max-w-2xl px-4 py-10">
            <div className="space-y-4 rounded-lg border p-6">
                <h1 className="text-2xl font-semibold">Dashboard</h1>
                <p>Welcome, {user.name}.</p>
                <p className="text-sm text-neutral-600">Signed in as: {user.email}</p>
                <LogoutButton />
            </div>
        </div>
    );
}
