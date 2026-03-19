import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export interface Medicine{
    medicinename: string;
    manufacturer: string;
    price: number;
    details: string;
}

export async function POST(request: Request) {
    const client = await pool.connect();
    try{
        const body = await request.json();
        const {medicinename, manufacturer, price, details} = body as Medicine;
        if(!medicinename || !price){
            return NextResponse.json(
                {
                    message: 'Medicine name and price are required'
                },
                {
                    status: 400
                }
            );

        }
        await client.query('BEGIN');
        // console.log('Inserting medicine:', medicinename, manufacturer, price, details);
        await client.query(
            'insert into medicine (medicinename, manufacturer, price, details) values ($1, $2, $3, $4)',
            [medicinename, manufacturer, price, details]
        );
        await client.query('COMMIT');
        return NextResponse.json(
            {
                message: 'Medicine added successfully'
            },
            {
                status: 200
            }
        );
    }catch(error){
        await client.query('ROLLBACK');
        console.error('Error adding medicine:', error);
        return NextResponse.json(
            {
                message: 'Error adding medicine'
            },
            {
                status: 500
            }
        );
    }finally{
        client.release();
    }
}