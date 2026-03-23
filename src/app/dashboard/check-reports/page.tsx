"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
    AlertCircle,
    CheckCircle2,
    ClipboardCheck,
    ExternalLink,
    LoaderCircle,
    Search,
    Upload,
} from 'lucide-react';

type TestReportRow = {
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

export default function CheckReportsPage() {
    const [rows, setRows] = useState<TestReportRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [activeStatusFilter, setActiveStatusFilter] = useState<'All' | 'Pending' | 'Uploaded'>('All');
    const [searchText, setSearchText] = useState('');
    const [uploadingFor, setUploadingFor] = useState<number | null>(null);
    const [deletingFor, setDeletingFor] = useState<number | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadRows() {
            try {
                setIsLoading(true);
                const response = await fetch('/api/tests/reports', { cache: 'no-store' });
                if (!response.ok) {
                    throw new Error('Failed to load test reports');
                }
                const payload = (await response.json()) as { data?: TestReportRow[] };
                if (isMounted) {
                    setRows(payload.data ?? []);
                    setErrorMessage('');
                }
            } catch {
                if (isMounted) {
                    setRows([]);
                    setErrorMessage('Unable to load prescribed tests at the moment.');
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadRows();

        return () => {
            isMounted = false;
        };
    }, []);

    const filteredRows = useMemo(() => {
        const query = searchText.trim().toLowerCase();

        return rows.filter((row) => {
            if (activeStatusFilter !== 'All' && row.status !== activeStatusFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            return (
                row.testName.toLowerCase().includes(query)
                || row.testCategory.toLowerCase().includes(query)
                || String(row.prescriptionId).includes(query)
                || (row.centerName ?? '').toLowerCase().includes(query)
            );
        });
    }, [rows, activeStatusFilter, searchText]);

    const pendingCount = rows.filter((row) => row.status === 'Pending').length;
    const uploadedCount = rows.filter((row) => row.status === 'Uploaded').length;

    const handleUploadFile = async (prescribedTestId: number, file: File | null) => {
        if (!file) {
            return;
        }

        try {
            setUploadingFor(prescribedTestId);

            const formData = new FormData();
            formData.set('prescribedTestId', String(prescribedTestId));
            formData.set('file', file);

            const response = await fetch('/api/tests/reports', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({ message: 'Upload failed' }))) as { message?: string };
                throw new Error(payload.message ?? 'Upload failed');
            }

            const reloadResponse = await fetch('/api/tests/reports', { cache: 'no-store' });
            if (!reloadResponse.ok) {
                throw new Error('Uploaded, but failed to refresh list');
            }
            const payload = (await reloadResponse.json()) as { data?: TestReportRow[] };
            setRows(payload.data ?? []);
            setErrorMessage('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setErrorMessage(message);
        } finally {
            setUploadingFor(null);
        }
    };

    const handleUndoUpload = async (prescribedTestId: number) => {
        try {
            setDeletingFor(prescribedTestId);

            const response = await fetch(`/api/tests/reports?prescribedTestId=${prescribedTestId}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                const payload = (await response.json().catch(() => ({ message: 'Failed to remove uploaded report' }))) as { message?: string };
                throw new Error(payload.message ?? 'Failed to remove uploaded report');
            }

            const reloadResponse = await fetch('/api/tests/reports', { cache: 'no-store' });
            if (!reloadResponse.ok) {
                throw new Error('Removed upload, but failed to refresh list');
            }

            const payload = (await reloadResponse.json()) as { data?: TestReportRow[] };
            setRows(payload.data ?? []);
            setErrorMessage('');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to remove upload';
            setErrorMessage(message);
        } finally {
            setDeletingFor(null);
        }
    };

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700">
                                <ClipboardCheck size={14} />
                                Report Dashboard
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Check Test Reports</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Upload your prescribed test reports as PDF or image files.
                                Tests without uploaded reports are marked as pending.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800">
                                <p className="text-xs uppercase tracking-wide">Pending</p>
                                <p className="text-xl font-bold">{pendingCount}</p>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
                                <p className="text-xs uppercase tracking-wide">Uploaded</p>
                                <p className="text-xl font-bold">{uploadedCount}</p>
                            </div>
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
                        <label className="relative block">
                            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchText}
                                onChange={(event) => setSearchText(event.target.value)}
                                placeholder="Search by test, category, center, or prescription ID"
                                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-cyan-200 transition focus:ring"
                            />
                        </label>

                        <div className="flex flex-wrap items-center gap-2">
                            {(['All', 'Pending', 'Uploaded'] as const).map((statusKey) => (
                                <button
                                    key={statusKey}
                                    type="button"
                                    onClick={() => setActiveStatusFilter(statusKey)}
                                    className={[
                                        'rounded-lg px-3 py-2 text-sm font-semibold transition',
                                        activeStatusFilter === statusKey
                                            ? 'bg-cyan-600 text-white'
                                            : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                                    ].join(' ')}
                                >
                                    {statusKey}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                {errorMessage ? (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        {errorMessage}
                    </div>
                ) : null}

                <section className="space-y-4">
                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            <LoaderCircle className="mx-auto mb-3 animate-spin" size={22} />
                            Loading test report dashboard...
                        </div>
                    ) : null}

                    {!isLoading && filteredRows.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            No tests found for current filters.
                        </div>
                    ) : null}

                    {!isLoading
                        ? filteredRows.map((row) => (
                            <article
                                key={row.prescribedTestId}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6"
                            >
                                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
                                    <div>
                                        <div className="mb-2 flex flex-wrap items-center gap-2">
                                            <h2 className="text-lg font-bold text-slate-900">{row.testName}</h2>
                                            {row.status === 'Pending' ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                    <AlertCircle size={14} />
                                                    Pending
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                                                    <CheckCircle2 size={14} />
                                                    Uploaded
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-600">
                                            Category: <span className="font-medium text-slate-800">{row.testCategory || 'General'}</span>
                                        </p>
                                        <p className="mt-1 text-sm text-slate-600">
                                            Prescription: <span className="font-medium text-slate-800">#{row.prescriptionId}</span>
                                            {row.appointmentDate ? ` • ${row.appointmentDate}` : ''}
                                        </p>

                                        {row.status === 'Uploaded' ? (
                                            <div className="mt-3 space-y-1 text-sm text-slate-600">
                                                <p>
                                                    Uploaded at: <span className="font-medium text-slate-800">{row.uploadedAt ?? 'N/A'}</span>
                                                </p>
                                                <p>
                                                    Center: <span className="font-medium text-slate-800">{row.centerName ?? 'Not provided'}</span>
                                                </p>
                                                {row.reportFileUrl ? (
                                                    <Link
                                                        href={row.reportFileUrl}
                                                        target="_blank"
                                                        className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700"
                                                    >
                                                        Open uploaded file
                                                        <ExternalLink size={14} />
                                                    </Link>
                                                ) : null}
                                                <div className="pt-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleUndoUpload(row.prescribedTestId)}
                                                        disabled={deletingFor === row.prescribedTestId}
                                                        className="inline-flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                                                    >
                                                        {deletingFor === row.prescribedTestId ? 'Removing...' : 'Undo upload'}
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="mt-4">
                                                <Link
                                                    href={`/dashboard/search-tests?testId=${row.testId}&testName=${encodeURIComponent(row.testName)}&prescribedTestId=${row.prescribedTestId}`}
                                                    className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
                                                >
                                                    Find diagnostic centers for this test
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    <div className="md:min-w-[220px]">
                                        <label className="block">
                                            <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                Upload PDF or Image
                                            </span>
                                            <input
                                                type="file"
                                                accept="application/pdf,image/*"
                                                disabled={uploadingFor === row.prescribedTestId}
                                                onChange={(event) => {
                                                    const selectedFile = event.currentTarget.files?.[0] ?? null;
                                                    void handleUploadFile(row.prescribedTestId, selectedFile);
                                                    event.currentTarget.value = '';
                                                }}
                                                className="block w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-slate-700 hover:file:bg-slate-200"
                                            />
                                        </label>

                                        {uploadingFor === row.prescribedTestId ? (
                                            <div className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-cyan-700">
                                                <Upload size={14} className="animate-pulse" />
                                                Uploading...
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        ))
                        : null}
                </section>
            </div>
        </main>
    );
}
