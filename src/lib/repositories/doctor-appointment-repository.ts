import 'server-only';

import { sql } from '@/lib/db';


export type DoctorSearchRow = {
    doctorid: number;
    name: string;
    specialization: string;
    hospital: string;
    district: string;
    thana: string;
    avgrating: number;
    availabledays: number[] | null;
};

export async function searchDoctors(): Promise<Array<DoctorSearchRow>> {

    const rows = await sql`
        SELECT 
            d.doctorid,
            (u.firstname || ' ' || u.lastname) as name,
            array_to_string(get_doctor_specializations(d.doctorid), ', ') as specialization,
            h.hospitalname as hospital,
            dist.districtname as district,
            t.thananame as thana,
            COALESCE(AVG(r.rating)::float, 0) as avgrating,
            get_chamber_available_days(c.chamberid) as availabledays
        FROM chambers c 
        JOIN doctors d on c.doctorid = d.doctorid
        JOIN users u on d.doctorid = u.userid
        JOIN hospitals h on c.hospitalid = h.hospitalid
        JOIN locations l on h.locationid = l.locationid
        JOIN thanas t on l.thanaid = t.thanaid
        JOIN districts dist on t.districtid = dist.districtid
        LEFT JOIN reviews r on d.doctorid = r.doctorid
        WHERE d.approvalstatus = 'Approved'
        
        GROUP BY
            d.doctorid, u.firstname, u.lastname, h.hospitalname, dist.districtname, t.thananame, c.chamberid
        `;

    return rows as Array<DoctorSearchRow>;
}

