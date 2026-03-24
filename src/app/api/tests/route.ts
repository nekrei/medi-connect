import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const client = await pool.connect();
    try {
        const res = await client.query(
            'SELECT testname, testid from tests order by testname asc'
        );
        return NextResponse.json({ data: res.rows });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: 'Failed to fetch tests' }, { status: 500 });
    } finally {        
        client.release();
    }
}