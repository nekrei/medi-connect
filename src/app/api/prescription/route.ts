import { getCurrentUser, isApprovedDoctor } from "@/lib/auth/current-user";
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";
export type Prescription = {
    prescriptionid?: number;
    patientid: number;
    doctorid: number;
    appointmentdate: string;
    notes: string;
    followup: string;
}
export async function POST(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!(await isApprovedDoctor(user))) {
        return NextResponse.json({ error: 'Doctor approval required' }, { status: 403 });
    }
    const client = await pool.connect();
    try{
        const body = await req.json();
        const prescription = body.prescription as Prescription;
        const medicines = body.medicines as {
            medicineid: number, dosage: string, frequency: string, 
            duration: string, remarks: string}[];
        const tests = body.tests as {
            testid: number
        }[];
        await client.query('BEGIN');
        let res = await client.query(
            `insert into prescription (patientid, doctorid, appointmentdate, notes, followup) 
            values ($1, $2, $3, $4, $5) returning prescriptionid`,
            [prescription.patientid, prescription.doctorid, prescription.appointmentdate, prescription.notes, prescription.followup]
        );
        const prescriptionid = res.rows[0].prescriptionid;
        for(let m of medicines) {
            await client.query(
                `insert into prescribed_medicine (prescriptionid, medicineid, dosage, frequency, duration, remarks) 
                values ($1, $2, $3, $4, $5, $6)`,
                [prescriptionid, m.medicineid, m.dosage, m.frequency, m.duration, m.remarks]
            );
        }
        for(let t of tests) {
            await client.query(
                `insert into prescribed_test (prescriptionid, testid) 
                values ($1, $2)`,
                [prescriptionid, t.testid]
            );
        }
        await client.query('COMMIT');
        return NextResponse.json(
            {
                message: 'Prescription created successfully',
                prescriptionid: prescriptionid
            },
            {
                status: 200
            }
        );
    }catch(err) {
        await client.query('ROLLBACK');
        console.error(err);
        return NextResponse.json(
            {
                message: 'Error creating prescription'
            },
            {
                status: 500
            }
        );
    }finally {
        client.release();
    }
}