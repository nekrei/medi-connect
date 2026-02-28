import {NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
export const GET = async (req:NextRequest) => {
    try{
        const row = (await sql`SELECT * FROM users`)[0];
        return NextResponse.json(row);
    }
    catch(error){
        console.error('Error handling GET request:', error);
        return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
    }
}