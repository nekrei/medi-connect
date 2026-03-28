import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";


export type newAddress = {
    name?: string;
    type: string;
    holdingnumber?: string;
    road?: string;
    thana: string;
    district: string;
}

export async function POST(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const client = await pool.connect();
    try {
        const body = await request.json();
        const {type, thana, district} = body as {type: string, thana: string, district: string};
        const holdingnumber = (body?.holdingnumber) ? body.holdingnumber : null;
        const road = (body?.road) ? body.road : null;
        const name = (body?.name) ? body.name : null;

        //use returning clause
        await client.query('BEGIN');
        const res = await client.query(
            'CALL add_poi($1, $2, $3, $4, $5, $6, null, null, null)',
            [thana,district, holdingnumber, road, name, type]
        );
        if (res.rows.length === 0) {
            await client.query('ROLLBACK');
            return NextResponse.json(
                {
                    message: 'Failed to add POI'
                },
                {
                    status: 500
                }
            );
        } else if (res.rows[0].res != 'SUCCESS') {
            await client.query('ROLLBACK');
            return NextResponse.json(
                {
                    message: res.rows[0].msg || 'Failed to add POI'
                },  
                {
                    status: 500
                }
             );
        }
        
        let addr = res.rows[0].msg;

        let coordResponse = await fetch(
            `http://localhost:3000/api/locations/get-coords?q=${encodeURIComponent(addr)}`
        );
        let data = await coordResponse.json();
        console.log('Coordinates fetched from API:', data);
        if(coordResponse.status !== 200 || data === null || data.data.length === 0) {
            addr = `${holdingnumber ? holdingnumber + ', ' : ''}${thana}, ${district}`;
            coordResponse = await fetch(
                `http://localhost:3000/api/locations/get-coords?q=${encodeURIComponent(addr)}`
            );
            data = await coordResponse.json();
            console.log('fallback address:', data);
        }
        if(coordResponse.status !== 200 || data === null || data.data.length === 0) {
            data = {
                data: [{
                    lat: 23.8103,
                    lon: 90.4125
                }]
            }
            console.log('default coordinates:', data);
        }
        const lat = data.data[0].lat;
        const lng = data.data[0].lon;
        await client.query(
            'update locations set latitude = $1, longitude = $2 where locationid = $3',
            [lat, lng, res.rows[0].locid]
        );
        await client.query('COMMIT');
        return NextResponse.json(
            {
                message: 'POI added successfully'
            },
            {
                status: 200
            }
        );
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        return NextResponse.json(
            {
                message: 'Unknown error occurred'
            },
            {
                status: 500
            }
        );
    } finally {
        client.release();
    }
}