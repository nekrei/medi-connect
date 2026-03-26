import { NextResponse } from 'next/server';
import { LocDetails, MapProps } from '@/components/LeafletMap';
import { sql } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth/current-user';

export async function POST(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        const body = await request.json();
        const { lat, lng } = body as { lat: number; lng: number };
        const rows = await sql`
            select latitude, longitude, hospitalname,
            addressString(locations.locationid) as address
            from (hospitals join locations on hospitals.locationid = locations.locationid)
            order by getdistsq(${lat}, ${lng}, coalesce(latitude, 0), coalesce(longitude, 0)) asc
            limit 30;
        `;

        //console.log('Database query result:', rows);
        const response = NextResponse.json(
            {
                markers: rows.map((row) => ({
                    name: row.hospitalname,
                    lat: Number(row.latitude),
                    lng: Number(row.longitude),
                    address: row.address,
            })) as LocDetails[]
            },
            {
                status: 200
            }
        );
        return response;
    } catch (error) {
        console.error('Error fetching markers:', error);
        return NextResponse.json(
            {
                message: 'Failed to fetch markers'
            },
            {
                status: 500
            }
        );
    }
}