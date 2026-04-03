import { NextResponse } from 'next/server';

import { searchDiagnosticCenterTests } from '@/lib/repositories/test-report-repository';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET(req: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
        
    try {
        const data = await searchDiagnosticCenterTests();

        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Failed to search diagnostic centers:', error);
        return NextResponse.json({ message: 'Failed to search diagnostic centers' }, { status: 500 });
    }
}
