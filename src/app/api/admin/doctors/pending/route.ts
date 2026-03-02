import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import { listPendingDoctors } from '@/lib/repositories/user-repository';

/** GET /api/admin/doctors/pending
 *  Returns all doctors whose ApprovalStatus is 'Pending'.
 *  Only accessible to Admin users.
 */
export async function GET() {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'Admin') {
        return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
    }

    const pending = await listPendingDoctors();

    // Strip password hashes before sending to client
    const safe = pending.map(({ password: _pw, ...rest }) => rest);

    return NextResponse.json({ status: 'success', data: safe });
}
