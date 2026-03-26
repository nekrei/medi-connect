import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function GET(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const district = searchParams.get('district');
    const clndis = district?.trim();
    try {
        const thanas = await sql`
            select thanaid, thananame from thanas
            join districts on thanas.districtid = districts.districtid
            where districtname LIKE ${clndis}`;

        return NextResponse.json({ data: thanas });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Failed to fetch thanas' }, { status: 500 });
    }
}
