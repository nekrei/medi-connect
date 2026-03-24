import 'server-only';

import { sql } from '@/lib/db';
import { DoctorSearchRow } from './doctor-appointment-repository';
import { text } from 'stream/consumers';

type PrescribedMedicine = {
    prescribedMedicineId: number;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
};

type PrescribedTest = {
    prescribedTestId: number;
    testName: string;
    category: string;
    reason: string;
};

export type Prescription = {
    prescriptionId: number;
    appointmentDate: string;
    doctorName: string;
    doctorId: number;
    doctorSpecializations: string[];
    doctorDegrees: string;
    patientName: string;
    patientAge: number;
    patientSex: string;
    notes: string;
    nextReviewText: string;
    medicines: PrescribedMedicine[];
    tests: PrescribedTest[];
};

export type PrescriptionSearchRow = {
    prescriptionId: number;
    appointmentDate: string;
    doctorName: string;
    doctorId: number;
    medicincount: number;
    testcount: number;
    followupText: string;
}
export async function getSearchedPrescriptions(params: {
    patientId: string;
    prescriptionId: number | null;
    doctorname: string | null;
    fromDate: Date | null;
    toDate: Date | null;
}): Promise<Array<PrescriptionSearchRow>> {
    const { patientId, prescriptionId, doctorname, fromDate, toDate } = params;

    const rows = (await sql`
        SELECT
            P.PRESCRIPTIONID AS "prescriptionId",
            TO_CHAR(P.APPOINTMENTDATE::date, 'YYYY-MM-DD') AS "appointmentDate",
            (D.FIRSTNAME || ' ' || D.LASTNAME) AS "doctorName",
            P.DOCTORID AS "doctorId",
            MEDICINECOUNT(P.PRESCRIPTIONID) AS "medicincount",
            TESTCOUNT(P.PRESCRIPTIONID) AS "testcount",
            P.FOLLOWUP AS "followupText"
        FROM
            PRESCRIPTION P
            JOIN USERS D ON P.DOCTORID = D.USERID
        WHERE
            P.PATIENTID = ${patientId}
             AND (COALESCE(${prescriptionId}::text, '') = '' OR P.PRESCRIPTIONID = ${prescriptionId}::int)
             AND (${fromDate}::timestamp IS NULL OR P.APPOINTMENTDATE >= ${fromDate}::timestamp)
             AND (${toDate}::timestamp IS NULL OR P.APPOINTMENTDATE <= ${toDate}::timestamp)
             AND (COALESCE(${doctorname}::text, '') = '' OR (D.FIRSTNAME || ' ' || D.LASTNAME) ILIKE '%' || ${doctorname}::text || '%')
    `) as Array<PrescriptionSearchRow>;
            
    return rows;
}

export async function getPrescriptionById(prescriptionId: number): Promise<Prescription | null> {
    const headerRows = (await sql`
        SELECT
            P.PRESCRIPTIONID AS "prescriptionId",
            TO_CHAR(P.APPOINTMENTDATE::date, 'YYYY-MM-DD') AS "appointmentDate",
            (D.FIRSTNAME || ' ' || D.LASTNAME) AS "doctorName",
            P.DOCTORID AS "doctorId",
            COALESCE(DOC.DESIGNATION, '') AS "doctorDegrees",
            (U.FIRSTNAME || ' ' || U.LASTNAME) AS "patientName",
            EXTRACT(YEAR FROM AGE(CURRENT_DATE, U.DATEOFBIRTH))::INT AS "patientAge",
            CASE U.SEX
                WHEN 'M' THEN 'Male'
                WHEN 'F' THEN 'Female'
                ELSE 'Other'
            END AS "patientSex",
            COALESCE(P.NOTES, '') AS "notes",
            COALESCE(P.FOLLOWUP, '') AS "nextReviewText"
        FROM
            PRESCRIPTION P
            JOIN USERS D ON D.USERID = P.DOCTORID
            JOIN USERS U ON U.USERID = P.PATIENTID
            LEFT JOIN DOCTORS DOC ON DOC.DOCTORID = P.DOCTORID
        WHERE
            P.PRESCRIPTIONID = ${prescriptionId}
        LIMIT 1
    `) as Array<{
        prescriptionId: number;
        appointmentDate: string;
        doctorName: string;
        doctorId: number;
        doctorDegrees: string;
        patientName: string;
        patientAge: number;
        patientSex: string;
        notes: string;
        nextReviewText: string;
    }>;

    if (headerRows.length === 0) {
        return null;
    }

    const header = headerRows[0];

    const specializationRows = (await sql`
        SELECT
            S.SPECIALIZATIONNAME AS "specializationName"
        FROM
            DOCTORSPECIALIZATIONS DS
            JOIN SPECIALIZATIONS S ON S.SPECIALIZATIONID = DS.SPECIALIZATIONID
        WHERE
            DS.DOCTORID = ${header.doctorId}
        ORDER BY
            S.SPECIALIZATIONNAME ASC
    `) as Array<{ specializationName: string | null }>;

    const medicineRows = (await sql`
        SELECT
            PM.PRESCRIBED_MEDICINEID AS "prescribedMedicineId",
            M.MEDICINENAME AS "medicineName",
            COALESCE(PM.DOSAGE, '') AS "dosage",
            COALESCE(PM.FREQUENCY, '') AS "frequency",
            COALESCE(PM.DURATION, '') AS "duration",
            COALESCE(PM.REMARKS, '') AS "instructions"
        FROM
            PRESCRIBED_MEDICINE PM
            JOIN MEDICINE M ON M.MEDICINEID = PM.MEDICINEID
        WHERE
            PM.PRESCRIPTIONID = ${prescriptionId}
        ORDER BY
            PM.PRESCRIBED_MEDICINEID ASC
    `) as Array<{
        prescribedMedicineId: number;
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string;
    }>;

    const testRows = (await sql`
        SELECT
            PT.PRESCIBED_TESTID AS "prescribedTestId",
            T.TESTNAME AS "testName",
            COALESCE(T.TESTCATEGORY, '') AS "category",
            COALESCE(T.DESCRIPTION, '') AS "reason"
        FROM
            PRESCRIBED_TEST PT
            JOIN TESTS T ON T.TESTID = PT.TESTID
        WHERE
            PT.PRESCRIPTIONID = ${prescriptionId}
        ORDER BY
            PT.PRESCIBED_TESTID ASC
    `) as Array<{
        prescribedTestId: number;
        testName: string;
        category: string;
        reason: string;
    }>;

    const prescription: Prescription = {
        prescriptionId: header.prescriptionId,
        appointmentDate: header.appointmentDate,
        doctorName: header.doctorName,
        doctorId: header.doctorId,
        doctorSpecializations: specializationRows
            .map((row) => row.specializationName)
            .filter((name): name is string => Boolean(name)),
        doctorDegrees: header.doctorDegrees,
        patientName: header.patientName,
        patientAge: header.patientAge,
        patientSex: header.patientSex,
        notes: header.notes,
        nextReviewText: header.nextReviewText,
        medicines: medicineRows,
        tests: testRows,
    };

    return prescription;
}