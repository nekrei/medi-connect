import { redirect } from 'next/navigation';

import AdminPanel from '@/components/admin/AdminPanel';
import { getCurrentUser } from '@/lib/auth/current-user';

export default async function AdminPage() {
    const user = await getCurrentUser();

    if (!user) redirect('/login');
    if (user.role !== 'Admin') redirect('/dashboard');

    return <AdminPanel />;
}
