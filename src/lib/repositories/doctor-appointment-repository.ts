import 'server-only';

import { sql } from '@/lib/db';


export type DoctorSearchRow = {
    name: string;
    specialization: string;
    hospital: string;
    district: string;
    thana: string;
    availabledays: number[] | null;
};

export async function searchDoctors(params: {
    name: string | '';
    district: string | null;
    thana: string | null;
    specialization: string | null;
    availableDay: string | null;
}): Promise<Array<DoctorSearchRow>> {
    const { name, district, thana, specialization, availableDay } = params;
    
    const rows = (await sql`
        SELECT
            U.FIRSTNAME || ' ' || U.LASTNAME AS name,
            get_doctor_specializations(DR.DOCTORID) AS specialization,
            H.HOSPITALNAME AS hospital,
            D.DISTRICTNAME AS district,
            T.THANANAME AS thana,
            get_chamber_available_days(C.CHAMBERID) AS availableDays
        FROM CHAMBERS AS C
        JOIN DOCTORS AS DR ON DR.DOCTORID = C.DOCTORID
        JOIN USERS AS U ON DR.DOCTORID = U.USERID
        JOIN HOSPITALS AS H ON C.HOSPITALID = H.HOSPITALID
        JOIN LOCATIONS AS L ON H.LOCATIONID = L.LOCATIONID
        JOIN THANAS AS T ON L.THANAID = T.THANAID
        JOIN DISTRICTS AS D ON T.DISTRICTID = D.DISTRICTID
        WHERE
            (COALESCE(${name}::text, '') = '' OR (U.FIRSTNAME || ' ' || U.LASTNAME) ILIKE '%' || ${name}::text || '%')
            AND (COALESCE(${district}::text, '') = '' OR D.DISTRICTNAME = ${district}::text)
            AND (COALESCE(${thana}::text, '') = '' OR T.THANANAME = ${thana}::text)
            AND (COALESCE(${specialization}::text, '') = '' OR ${specialization}::text = ANY(get_doctor_specializations(DR.DOCTORID)))
            AND (COALESCE(${availableDay}::text, '') = '' OR ${availableDay} = ANY(get_chamber_available_days(C.CHAMBERID)))
    `) as Array<DoctorSearchRow>;

    return rows;
}