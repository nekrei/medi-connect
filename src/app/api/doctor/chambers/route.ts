import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
import { getCurrentUser, isApprovedDoctor } from "@/lib/auth/current-user";

export type ChamberSchedule = {
    weekday: string;
    startTime: string;
    endTime: string;
}
const weekdayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
export async function POST(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!(await isApprovedDoctor(currentUser))) {
        return NextResponse.json({ message: 'Doctor approval required' }, { status: 403 });
    }

    const body = await request.json();
    const chamberSchedules: ChamberSchedule[] = body.chamberSchedules;
    const doctorId: number = body.doctorId;
    const hospitalId: number = body.hospitalId;
    const cuprice: number = body.cuprice;
    const appcontact: string = body.appcontact;
    if (Number(currentUser.id) !== doctorId) {
        return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const client = await pool.connect();
    await client.query("begin");
    try{
        const res = await client.query(
            `
            CALL addchambers($1, $2, $3, $4, null)
            `,
            [doctorId, hospitalId, cuprice, appcontact]
        );
        console.log("Chamber insert result:", res.rows);
        for (const s of chamberSchedules) {
            await client.query(
                'insert into chamberschedules (chamberid, weekday, starttime, endtime) values ($1, $2, $3, $4)',
                [res.rows[0].cid, weekdayMap.findIndex((day) => day === s.weekday), s.startTime, s.endTime]
            );
        }
        await client.query("commit");
        return NextResponse.json({message: "Chamber information added/updated successfully"},{status: 200});
    } catch (error) {
        await client.query("rollback");
        console.error("Error adding/updating chamber information:", error);
        return NextResponse.json({message: "Error adding/updating chamber information"},{status: 500});
    } finally {
        client.release();
    }

}