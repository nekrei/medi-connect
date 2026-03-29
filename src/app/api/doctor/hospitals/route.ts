import { pool } from "@/lib/db";
import next from "next";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const client = await pool.connect();
    try{
        const res = await client.query(
            `select hospitalid, hospitalname, L.locationid, addressString(L.locationid) as address
            from hospitals H join locations L on H.locationid = L.locationid`
        );
        return NextResponse.json(res.rows, {status: 200});
    } catch (error) {
        return NextResponse.json({message: "Error fetching hospital information"}, {status: 500});
    } finally {
        client.release();
    }
}