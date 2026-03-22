import { mkdir, writeFile } from 'fs/promises';
import { access, unlink } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

import { NextResponse } from 'next/server';

import { getCurrentUser } from '@/lib/auth/current-user';
import {
    deleteUploadedTestReportByPrescribedTestId,
    getPatientPrescribedTestsWithReports,
    saveUploadedTestReport,
} from '@/lib/repositories/test-report-repository';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
]);

function sanitizeFileName(fileName: string) {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function getExtension(fileName: string, mimeType: string) {
    const ext = path.extname(fileName).toLowerCase();
    if (ext) {
        return ext;
    }

    if (mimeType === 'application/pdf') return '.pdf';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    return '.jpg';
}

export async function GET() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const patientId = Number(currentUser.id);
    if (!Number.isFinite(patientId)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const rows = await getPatientPrescribedTestsWithReports(patientId);

        const normalizedRows = await Promise.all(
            rows.map(async (row) => {
                if (!row.uploadedReportId || !row.reportFileUrl) {
                    return row;
                }

                const relativePath = row.reportFileUrl.replace(/^\/+/, '');
                const absolutePath = path.join(process.cwd(), 'public', relativePath);

                try {
                    await access(absolutePath);
                    return row;
                } catch {
                    await deleteUploadedTestReportByPrescribedTestId({
                        patientId,
                        prescribedTestId: row.prescribedTestId,
                    });

                    return {
                        ...row,
                        status: 'Pending' as const,
                        uploadedReportId: null,
                        reportFileUrl: null,
                        reportFileName: null,
                        reportMimeType: null,
                        reportFileSizeBytes: null,
                        uploadedAt: null,
                        centerId: null,
                        centerName: null,
                    };
                }
            })
        );

        const data = normalizedRows;
        return NextResponse.json({ data }, { status: 200 });
    } catch (error) {
        console.error('Failed to fetch test reports:', error);
        return NextResponse.json({ message: 'Failed to fetch test reports' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const patientId = Number(currentUser.id);
    if (!Number.isFinite(patientId)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const searchParams = new URL(request.url).searchParams;
        const prescribedTestIdRaw = searchParams.get('prescribedTestId') ?? '';
        const prescribedTestId = Number(prescribedTestIdRaw);

        if (!Number.isInteger(prescribedTestId) || prescribedTestId <= 0) {
            return NextResponse.json({ message: 'Invalid prescribed test id' }, { status: 400 });
        }

        const deleted = await deleteUploadedTestReportByPrescribedTestId({
            patientId,
            prescribedTestId,
        });

        if (!deleted.deleted) {
            return NextResponse.json({ message: 'No uploaded report found for this test' }, { status: 404 });
        }

        if (deleted.fileUrl) {
            const relativePath = deleted.fileUrl.replace(/^\/+/, '');
            const absolutePath = path.join(process.cwd(), 'public', relativePath);
            try {
                await unlink(absolutePath);
            } catch {
                // The DB record is the source of truth for status; missing file is safe to ignore.
            }
        }

        return NextResponse.json({ message: 'Uploaded report removed successfully' }, { status: 200 });
    } catch (error) {
        console.error('Failed to delete uploaded test report:', error);
        return NextResponse.json({ message: 'Failed to delete uploaded test report' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const patientId = Number(currentUser.id);
    if (!Number.isFinite(patientId)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await request.formData();

        const prescribedTestIdRaw = formData.get('prescribedTestId');
        const centerIdRaw = formData.get('centerId');
        const fileRaw = formData.get('file');

        const prescribedTestId = Number(prescribedTestIdRaw);
        const centerId = centerIdRaw ? Number(centerIdRaw) : null;

        if (!Number.isInteger(prescribedTestId) || prescribedTestId <= 0) {
            return NextResponse.json({ message: 'Invalid prescribed test id' }, { status: 400 });
        }

        if (centerId !== null && (!Number.isInteger(centerId) || centerId <= 0)) {
            return NextResponse.json({ message: 'Invalid center id' }, { status: 400 });
        }

        if (!(fileRaw instanceof File)) {
            return NextResponse.json({ message: 'Report file is required' }, { status: 400 });
        }

        if (fileRaw.size <= 0) {
            return NextResponse.json({ message: 'Uploaded file is empty' }, { status: 400 });
        }

        if (fileRaw.size > MAX_FILE_SIZE_BYTES) {
            return NextResponse.json({ message: 'File too large (max 10 MB)' }, { status: 400 });
        }

        if (!ALLOWED_MIME_TYPES.has(fileRaw.type)) {
            return NextResponse.json({ message: 'Only PDF, JPG, PNG or WEBP files are allowed' }, { status: 400 });
        }

        const safeOriginalName = sanitizeFileName(fileRaw.name || 'report');
        const extension = getExtension(safeOriginalName, fileRaw.type);
        const relativeDir = path.join('uploads', 'test-reports', String(patientId));
        const absoluteDir = path.join(process.cwd(), 'public', relativeDir);

        await mkdir(absoluteDir, { recursive: true });

        const finalName = `${Date.now()}-${randomUUID()}${extension}`;
        const absoluteFilePath = path.join(absoluteDir, finalName);
        const publicUrl = `/${relativeDir.replace(/\\/g, '/')}/${finalName}`;

        const arrayBuffer = await fileRaw.arrayBuffer();
        await writeFile(absoluteFilePath, Buffer.from(arrayBuffer));

        const saved = await saveUploadedTestReport({
            patientId,
            prescribedTestId,
            centerId,
            fileUrl: publicUrl,
            fileName: safeOriginalName,
            mimeType: fileRaw.type,
            fileSizeBytes: fileRaw.size,
        });

        return NextResponse.json({ message: 'Report uploaded successfully', data: saved }, { status: 200 });
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_TEST_OR_UNAUTHORIZED') {
            return NextResponse.json({ message: 'Invalid prescribed test or unauthorized upload' }, { status: 403 });
        }

        console.error('Failed to upload test report:', error);
        return NextResponse.json({ message: 'Failed to upload test report' }, { status: 500 });
    }
}
