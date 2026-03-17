import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
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
