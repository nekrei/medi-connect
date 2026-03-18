import { NextResponse } from "next/server";
import { pool } from "@/lib/db";


export type newAddress = {
    name?: string;
    type: string;
    holdingnumber?: string;
    road?: string;
    thana: string;
    district: string;
}

export async function POST(request: Request) {
    const client = await pool.connect();
    try {
        const body = await request.json();
        const {type, thana, district} = body as {type: string, thana: string, district: string};
        const holdingnumber = (body?.holdingnumber) ? body.holdingnumber : null;
        const road = (body?.road) ? body.road : null;
        const name = (body?.name) ? body.name : null;

        //use returning clause
        const thanaid = await client.query(
            'select thanaid from thanas where thananame = $1',
            [thana]
        );
        if (thanaid.rows.length === 0) {
            return NextResponse.json(
                {
                    message: 'Thana not found'
                },
                {
                    status: 500
                });
        }
        await client.query('BEGIN');
        const result = await client.query(
            'insert into locations (thanaid, holdingnumber, road, propertyname) values ($1, $2, $3, $4) returning locationid',
            [thanaid.rows[0].thanaid, holdingnumber, road, name]
        );

        if (type === 'hospital') {
            await client.query(
                'insert into hospitals (locationid, hospitalname) values ($1, $2)',
                [result.rows[0].locationid, name]
            );
        }
        else if (type === 'dgcenter') {
            await client.query(
                'insert into diagnostic_centers (locationid, centername) values ($1, $2)',
                [result.rows[0].locationid, name]
            );
        }
        let addr = `${holdingnumber ? holdingnumber + ', ' : ''}${road ? road + ', ' : ''}${thana}, ${district}`;

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
            [lat, lng, result.rows[0].locationid]
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