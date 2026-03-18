import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
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
