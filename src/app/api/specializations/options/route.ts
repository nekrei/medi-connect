import { NextResponse } from 'next/server';

import { sql } from '@/lib/db';


export async function GET() {
    try {
        const rows = (await sql`
            SELECT specializationname
            FROM specializations
            ORDER BY specializationname ASC
        `) as { specializationname: string }[];
        
        const specializationOptions = rows.map(row => row.specializationname);
        return NextResponse.json({ data: specializationOptions }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch location options:', error);
        return NextResponse.json({ message: 'Failed to fetch location options' }, { status: 500 });
    }
}
