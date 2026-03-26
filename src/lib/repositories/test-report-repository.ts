import 'server-only';

import type { PoolClient } from '@neondatabase/serverless';
import { pool } from '@/lib/db';

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

async function getDiagnosticCenterTableName(client: DbClient): Promise<'diagnostic_center' | 'diagnostic_centers'> {
    const response = await client.query<{ table_name: string }>(
        `
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_name IN ('diagnostic_center', 'diagnostic_centers')
            ORDER BY CASE table_name
                WHEN 'diagnostic_center' THEN 0
                ELSE 1
            END
            LIMIT 1
        `
    );

    if (response.rows.length === 0) {
        return 'diagnostic_center';
    }

    const tableName = response.rows[0].table_name;
    if (tableName === 'diagnostic_centers') {
        return 'diagnostic_centers';
    }

    return 'diagnostic_center';
}

async function ensureUploadedReportTable(client: DbClient) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS uploaded_test_reports (
            uploaded_report_id SERIAL PRIMARY KEY,
            prescribed_test_id INT NOT NULL UNIQUE REFERENCES prescribed_test (prescibed_testid) ON DELETE CASCADE,
            patient_id INT NOT NULL REFERENCES users (userid) ON DELETE CASCADE,
            center_id INT NULL,
            file_url TEXT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            file_size_bytes INT NOT NULL,
            uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
        )
    `);
}

export async function getPatientPrescribedTestsWithReports(patientId: number): Promise<PrescribedTestReportRow[]> {
    const client = await pool.connect();

    try {
        await ensureUploadedReportTable(client);
        const centerTableName = await getDiagnosticCenterTableName(client);

        const result = await client.query<Omit<PrescribedTestReportRow, 'status'>>(
            `
            SELECT
                pt.prescibed_testid AS "prescribedTestId",
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
                ON utr.prescribed_test_id = pt.prescibed_testid
                AND utr.patient_id = $1
            LEFT JOIN ${centerTableName} dc ON dc.centerid = utr.center_id
            WHERE p.patientid = $1
            ORDER BY p.appointmentdate DESC NULLS LAST, pt.prescibed_testid DESC
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
        await ensureUploadedReportTable(client);

        const ownershipCheck = await client.query<{ prescribed_test_id: number }>(
            `
                SELECT pt.prescibed_testid AS prescribed_test_id
                FROM prescribed_test pt
                JOIN prescription p ON p.prescriptionid = pt.prescriptionid
                WHERE pt.prescibed_testid = $1
                  AND p.patientid = $2
                LIMIT 1
            `,
            [params.prescribedTestId, params.patientId]
        );

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
                ON CONFLICT (prescribed_test_id)
                DO UPDATE SET
                    patient_id = EXCLUDED.patient_id,
                    center_id = EXCLUDED.center_id,
                    file_url = EXCLUDED.file_url,
                    file_name = EXCLUDED.file_name,
                    mime_type = EXCLUDED.mime_type,
                    file_size_bytes = EXCLUDED.file_size_bytes,
                    uploaded_at = CURRENT_TIMESTAMP
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
        await ensureUploadedReportTable(client);

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

export async function searchDiagnosticCenterTests(params: {
    query: string;
    district: string | null;
    thana: string | null;
    minPrice: number | null;
    maxPrice: number | null;
    testId: number | null;
}): Promise<DiagnosticCenterTestRow[]> {
    const client = await pool.connect();

    try {
        const centerTableName = await getDiagnosticCenterTableName(client);
        const safeQuery = params.query.trim();

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
            JOIN ${centerTableName} dc ON dc.centerid = cat.centerid
            JOIN locations l ON l.locationid = dc.locationid
            JOIN thanas t2 ON t2.thanaid = l.thanaid
            JOIN districts d ON d.districtid = t2.districtid
            WHERE
                ($1::text = '' OR dc.centername ILIKE '%' || $1::text || '%' OR t.testname ILIKE '%' || $1::text || '%')
                AND ($2::text IS NULL OR d.districtname = $2::text)
                AND ($3::text IS NULL OR t2.thananame = $3::text)
                AND ($4::numeric IS NULL OR cat.price >= $4::numeric)
                AND ($5::numeric IS NULL OR cat.price <= $5::numeric)
                AND ($6::int IS NULL OR t.testid = $6::int)
            ORDER BY
                dc.centername ASC,
                cat.price ASC,
                t.testname ASC
        `;

        const result = await client.query<DiagnosticCenterTestRow>(query, [
            safeQuery,
            params.district,
            params.thana,
            params.minPrice,
            params.maxPrice,
            params.testId,
        ]);

        return result.rows;
    } finally {
        client.release();
    }
}
