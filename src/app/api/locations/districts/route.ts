import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const districts = await sql`
            select districtid, districtname from districts order by districtname asc
        `;
        return NextResponse.json({ data: districts });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Failed to fetch districts' }, { status: 500 });
    }
}
