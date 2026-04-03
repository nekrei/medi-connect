import 'server-only';

import type { PoolClient } from '@neondatabase/serverless';
import { pool } from '@/lib/db';
import { getCurrentUser } from '../auth/current-user';

type DbClient = PoolClient;

export type PrescribedTestReportRow = {
    prescribedTestId: number;
    prescriptionId: number;
    appointmentDate: string | null;
    testId: number;
    testName: string;
    testCategory: string;
    status: 'Pending' | 'Uploaded';
    uploadedReportId: number | null;
    reportFileUrl: string | null;
    reportFileName: string | null;
    reportMimeType: string | null;
    reportFileSizeBytes: number | null;
    uploadedAt: string | null;
    centerId: number | null;
    centerName: string | null;
};

export type SavedReportMeta = {
    uploadedReportId: number;
    prescribedTestId: number;
    reportFileUrl: string;
    reportFileName: string;
    reportMimeType: string;
    reportFileSizeBytes: number;
    uploadedAt: string;
    centerId: number | null;
};

export type DiagnosticCenterTestRow = {
    centerId: number;
    centerName: string;
    contactNumber: string | null;
    email: string | null;
    openingTime: string | null;
    closingTime: string | null;
    districtName: string;
    thanaName: string;
    holdingNumber: string | null;
    road: string | null;
    propertyName: string | null;
    testId: number;
    testName: string;
    testCategory: string | null;
    price: number;
};

export async function getPatientPrescribedTestsWithReports(patientId: number): Promise<PrescribedTestReportRow[]> {
    const client = await pool.connect();

    try {
        const result = await client.query<Omit<PrescribedTestReportRow, 'status'>>(
            `
            SELECT
                pt.prescribed_testid AS "prescribedTestId",
                pt.prescriptionid AS "prescriptionId",
                TO_CHAR(p.appointmentdate::date, 'YYYY-MM-DD') AS "appointmentDate",
                t.testid AS "testId",
                t.testname AS "testName",
                COALESCE(t.testcategory, '') AS "testCategory",
                utr.uploaded_report_id AS "uploadedReportId",
                utr.file_url AS "reportFileUrl",
                utr.file_name AS "reportFileName",
                utr.mime_type AS "reportMimeType",
                utr.file_size_bytes AS "reportFileSizeBytes",
                TO_CHAR(utr.uploaded_at, 'YYYY-MM-DD HH24:MI') AS "uploadedAt",
                utr.center_id AS "centerId",
                dc.centername AS "centerName"
            FROM prescribed_test pt
            JOIN prescription p ON p.prescriptionid = pt.prescriptionid
            JOIN tests t ON t.testid = pt.testid
            LEFT JOIN uploaded_test_reports utr
                ON utr.prescribed_test_id = pt.prescribed_testid
                AND utr.patient_id = $1
            LEFT JOIN diagnostic_center dc ON dc.centerid = utr.center_id
            WHERE p.patientid = $1
            ORDER BY p.appointmentdate DESC NULLS LAST, pt.prescribed_testid DESC
            `,
            [patientId]
        );

        return result.rows.map((row) => ({
            ...row,
            status: row.uploadedReportId ? 'Uploaded' : 'Pending',
        }));
    } finally {
        client.release();
    }
}

export async function saveUploadedTestReport(params: {
    patientId: number;
    prescribedTestId: number;
    centerId: number | null;
    fileUrl: string;
    fileName: string;
    mimeType: string;
    fileSizeBytes: number;
}): Promise<SavedReportMeta> {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const ownershipCheck = await client.query< {prescribed_test_id : number} > (
            `
                SELECT pt.prescribed_testid as prescribed_test_id
                FROM prescribed_test pt 
                JOIN prescription p on p.prescriptionid = pt.prescriptionid
                WHERE 
                    p.patientid = $1
                    AND pt.prescribed_testid = $2
                LIMIT 1
            `,[params.patientId, params.prescribedTestId]
        )
        
        if (ownershipCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            throw new Error('INVALID_TEST_OR_UNAUTHORIZED');
        }

        const result = await client.query<{
            uploadedReportId: number;
            prescribedTestId: number;
            reportFileUrl: string;
            reportFileName: string;
            reportMimeType: string;
            reportFileSizeBytes: number;
            uploadedAt: string;
            centerId: number | null;
        }>(
            `
                INSERT INTO uploaded_test_reports (
                    prescribed_test_id,
                    patient_id,
                    center_id,
                    file_url,
                    file_name,
                    mime_type,
                    file_size_bytes,
                    uploaded_at
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
                RETURNING
                    uploaded_report_id AS "uploadedReportId",
                    prescribed_test_id AS "prescribedTestId",
                    file_url AS "reportFileUrl",
                    file_name AS "reportFileName",
                    mime_type AS "reportMimeType",
                    file_size_bytes AS "reportFileSizeBytes",
                    TO_CHAR(uploaded_at, 'YYYY-MM-DD HH24:MI') AS "uploadedAt",
                    center_id AS "centerId"
            `,
            [
                params.prescribedTestId,
                params.patientId,
                params.centerId,
                params.fileUrl,
                params.fileName,
                params.mimeType,
                params.fileSizeBytes,
            ]
        );

        await client.query('COMMIT');
        return result.rows[0];
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

export async function deleteUploadedTestReportByPrescribedTestId(params: {
    patientId: number;
    prescribedTestId: number;
}): Promise<{ deleted: boolean; fileUrl: string | null }> {
    const client = await pool.connect();

    try {

        const result = await client.query<{
            fileUrl: string | null;
        }>(
            `
                DELETE FROM uploaded_test_reports
                WHERE prescribed_test_id = $1
                  AND patient_id = $2
                RETURNING file_url AS "fileUrl"
            `,
            [params.prescribedTestId, params.patientId]
        );

        if (result.rows.length === 0) {
            return { deleted: false, fileUrl: null };
        }

        return {
            deleted: true,
            fileUrl: result.rows[0].fileUrl,
        };
    } finally {
        client.release();
    }
}

export async function searchDiagnosticCenterTests(): Promise<DiagnosticCenterTestRow[]> {
    const client = await pool.connect();

    const currentUser = getCurrentUser();
    if(!currentUser){
        throw new Error('Unauthorized');
    }

    try {
        const query = `
            SELECT
                dc.centerid AS "centerId",
                dc.centername AS "centerName",
                dc.contactnumber AS "contactNumber",
                dc.email AS "email",
                TO_CHAR(dc.openingtime, 'HH24:MI') AS "openingTime",
                TO_CHAR(dc.closingtime, 'HH24:MI') AS "closingTime",
                d.districtname AS "districtName",
                t2.thananame AS "thanaName",
                l.holdingnumber AS "holdingNumber",
                l.road AS "road",
                l.propertyname AS "propertyName",
                t.testid AS "testId",
                t.testname AS "testName",
                t.testcategory AS "testCategory",
                cat.price AS "price"
            FROM center_available_tests cat
            JOIN tests t ON t.testid = cat.testid
            JOIN  diagnostic_center dc ON dc.centerid = cat.centerid
            JOIN locations l ON l.locationid = dc.locationid
            JOIN thanas t2 ON t2.thanaid = l.thanaid
            JOIN districts d ON d.districtid = t2.districtid
            ORDER BY
                dc.centername ASC,
                cat.price ASC,
                t.testname ASC
        `;

        const result = await client.query<DiagnosticCenterTestRow>(query);

        return result.rows;
    } finally {
        client.release();
    }
}
