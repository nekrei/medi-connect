'use client';

import { useEffect, useState } from 'react';

type PendingDoctor = {
    userid: number;
    firstname: string;
    lastname: string;
    email: string;
    username: string;
    designation: string | null;
    registrationnumber: string;
    startpracticedate: string | null;
    registrationexpiry: string | null;
};

export default function ReviewDoctors() {
    const [doctors, setDoctors] = useState<PendingDoctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<number | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [rejectTarget, setRejectTarget] = useState<number | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    async function fetchPending() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/doctors/pending');
            const json = await res.json();
            setDoctors(json.data ?? []);
        } catch {
            setMessage({ type: 'error', text: 'Failed to load pending doctors.' });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchPending(); }, []);

    async function handleReview(doctorid: number, status: 'Approved' | 'Rejected', rejectionReason?: string) {
        setActionLoading(doctorid);
        setMessage(null);
        try {
            const res = await fetch('/api/admin/doctors/review', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ doctorid, status, rejectionReason }),
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: json.message ?? 'Action failed.' });
            } else {
                setMessage({ type: 'success', text: `Doctor ${status.toLowerCase()} successfully.` });
                setDoctors(prev => prev.filter(d => d.userid !== doctorid));
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setActionLoading(null);
        }
    }

    function openRejectModal(doctorid: number) {
        setRejectTarget(doctorid);
        setRejectionReason('');
    }

    async function confirmReject() {
        if (rejectTarget === null) return;
        setRejectTarget(null);
        await handleReview(rejectTarget, 'Rejected', rejectionReason || undefined);
    }

    return (
        <>
        <div className="max-w-4xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Review Pending Doctors</h2>
            <p className="text-sm text-neutral-500 mb-6">Approve or reject doctor registration requests.</p>

            {message && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            {loading ? (
                <p className="text-neutral-500 text-sm">Loading...</p>
            ) : doctors.length === 0 ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-10 text-center">
                    <p className="text-4xl mb-3">✅</p>
                    <p className="text-neutral-700 font-medium">No pending doctors</p>
                    <p className="text-neutral-400 text-sm mt-1">All doctor registrations have been reviewed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {doctors.map(doctor => (
                        <div key={doctor.userid} className="bg-white border border-neutral-200 rounded-xl p-5 flex items-start justify-between gap-4">
                            <div className="space-y-1 min-w-0">
                                <p className="font-semibold text-gray-900">
                                    Dr. {doctor.firstname} {doctor.lastname}
                                </p>
                                <p className="text-sm text-neutral-500">{doctor.email} · @{doctor.username}</p>
                                {doctor.designation && (
                                    <p className="text-sm text-neutral-600">{doctor.designation}</p>
                                )}
                                <p className="text-xs text-neutral-400">
                                    Reg. No: {doctor.registrationnumber}
                                    {doctor.startpracticedate && ` · Since ${new Date(doctor.startpracticedate).getFullYear()}`}
                                    {doctor.registrationexpiry && ` · Expires ${doctor.registrationexpiry}`}
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => handleReview(doctor.userid, 'Approved')}
                                    disabled={actionLoading === doctor.userid}
                                    className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
                                >
                                    Approve
                                </button>
                                <button
                                    onClick={() => openRejectModal(doctor.userid)}
                                    disabled={actionLoading === doctor.userid}
                                    className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

            {/* Rejection reason modal */}
            {rejectTarget !== null && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6 space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900">Rejection Reason</h3>
                        <p className="text-sm text-neutral-500">Provide a reason for rejecting this doctor (optional).</p>
                        <textarea
                            value={rejectionReason}
                            onChange={e => setRejectionReason(e.target.value)}
                            rows={4}
                            placeholder="e.g. Invalid registration number, incomplete documents..."
                            className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                        />
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setRejectTarget(null)}
                                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-800 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmReject}
                                className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition"
                            >
                                Confirm Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
