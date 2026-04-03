import { NextResponse } from 'next/server';

import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';

type LocationOptionRow = {
    districtname: string;
    thananame: string;
};

export async function GET() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const rows = (await sql`
            SELECT
                d.districtname,
                t.thananame
            FROM thanas t
            JOIN districts d ON d.districtid = t.districtid
            ORDER BY d.districtname ASC, t.thananame ASC
        `) as LocationOptionRow[];

        return NextResponse.json({ data: rows }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch location options:', error);
        return NextResponse.json({ message: 'Failed to fetch location options' }, { status: 500 });
    }
}
