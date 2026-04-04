"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    ClipboardList,
    Search,
    Filter,
    CalendarRange,
    UserRound,
    X,
    ChevronRight,
    Download,
} from 'lucide-react';
import { PrescriptionSearchRow, Prescription } from '@/lib/repositories/prescription-repository';



export default function CheckPrescriptionPage() {
    const [isLoadingPrescriptions, setIsLoadingPrescriptions] = useState(false);
    const [Prescriptions, setPrescriptions] = useState<PrescriptionSearchRow[]>([]);
    const [filteredPrescriptions, setfilteredPrescriptions] = useState<PrescriptionSearchRow[]>([]);
    const [selectedPrescriptinID, setSelectedPrescriptionID] = useState<number | null>(null);
    const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
    const [prescriptionIdFilter, setPrescriptionIdFilter] = useState('');
    const [doctorFilter, setDoctorFilter] = useState('');
    const [fromDateFilter, setFromDateFilter] = useState('');
    const [toDateFilter, setToDateFilter] = useState('');

    useEffect(() => {
        let isMounted = true;
        async function LoadPrescriptions() {
            try {
                setIsLoadingPrescriptions(true);
                const response = await fetch(`/api/prescription/filterprescription`);
                if (!response.ok) {
                    console.error('Failed to fetch prescriptions:', response.statusText);
                    if (isMounted) setPrescriptions([]);
                    return;
                }
                const data = await response.json();
                if (isMounted) {
                    setPrescriptions(data);
                }
            }
            catch (error) {
                console.error('Error fetching prescriptions:', error);
                if (isMounted) setPrescriptions([]);
            }
            finally {
                if (isMounted) setIsLoadingPrescriptions(false);
            }
        }
        LoadPrescriptions();

        return () => {
            isMounted = false;
        }
    }, []);

    useEffect(() => {
        async function filterPrescription() {

            const doctorQuery = doctorFilter.trim().toLowerCase();
            const idQuery = prescriptionIdFilter.trim();
            const fromDateLocal = fromDateFilter ? `${fromDateFilter}T00:00:00` : null;
            const toDateLocal = toDateFilter ? `${toDateFilter}T23:59:59` : null;

            setfilteredPrescriptions(
                Prescriptions.filter((row) => {
                    return (!doctorQuery || row.doctorName.toLowerCase().includes(doctorQuery))
                        && (!idQuery || row.prescriptionId == parseInt(idQuery, 10))
                        && (!fromDateLocal || new Date(row.appointmentDate) >= new Date(fromDateLocal))
                        && (!toDateLocal || new Date(row.appointmentDate) <= new Date(toDateLocal));
                })
            );
        }
        filterPrescription();

    }, [Prescriptions, doctorFilter, fromDateFilter, prescriptionIdFilter, toDateFilter]);

    const handleDownloadPdf = () => {
        window.print();
    };

    const closePrescriptionModal = () => {
        setSelectedPrescription(null);
        setSelectedPrescriptionID(null);
    };

    useEffect(() => {
        let isMounted = true;
        async function fetchSelectedPrescription() {
            if (!selectedPrescriptinID) {
                setSelectedPrescription(null);
                return;
            }

            const searchParams = new URLSearchParams();
            searchParams.set('prescriptionId', selectedPrescriptinID.toString());
            try {
                const response = await fetch(`/api/prescription/selectedPrescription?${searchParams.toString()}`, { cache: 'no-store' });
                if (response.ok) {
                    if (isMounted) setSelectedPrescription(await response.json());
                }
                else {
                    console.error('Failed to fetch selected prescription:', response.statusText);
                    if (isMounted) setSelectedPrescription(null);
                }
            }
            catch (error) {
                console.error('Error fetching selected prescription:', error);
                if (isMounted) setSelectedPrescription(null);
            }
        }

        fetchSelectedPrescription();

        return () => {
            isMounted = false;
        }

    }, [selectedPrescriptinID]);

    useEffect(() => {

        if (!selectedPrescription) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                closePrescriptionModal();
            }
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [selectedPrescription]);

    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                                <ClipboardList size={14} />
                                Prescription Center
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Check Prescription</h1>
                            <p className="mt-2 max-w-2xl text-sm text-slate-500">
                                Review your prescription history, medication dosage plans, and prescribed diagnostic tests.
                                This page is currently UI-only and ready to connect with API data.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/dashboard"
                                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                            >
                                Back to Dashboard
                                <ChevronRight size={16} />
                            </Link>
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-4 flex items-center gap-2 text-slate-800">
                        <Filter size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold">Filter Prescriptions</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Prescription ID</span>
                            <div className="relative">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="e.g. 5012"
                                    value={prescriptionIdFilter}
                                    onChange={(event) => setPrescriptionIdFilter(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Doctor</span>
                            <div className="relative">
                                <UserRound size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search doctor name"
                                    value={doctorFilter}
                                    onChange={(event) => setDoctorFilter(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">From Date</span>
                            <div className="relative">
                                <CalendarRange size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={fromDateFilter}
                                    onChange={(event) => setFromDateFilter(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">To Date</span>
                            <div className="relative">
                                <CalendarRange size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="date"
                                    value={toDateFilter}
                                    onChange={(event) => setToDateFilter(event.target.value)}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                        </label>
                    </div>
                </section>

                <section>
                    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                        <div className="border-b border-slate-100 px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">Prescription History</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Click any row to open floating prescription format preview.
                            </p>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                        <th className="px-5 py-3 font-semibold">Prescription ID</th>
                                        <th className="px-5 py-3 font-semibold">Appointment Date</th>
                                        <th className="px-5 py-3 font-semibold">Doctor</th>
                                        <th className="px-5 py-3 font-semibold">Medication / Test Summary</th>
                                        <th className="px-5 py-3 font-semibold">Next Review</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                                    {filteredPrescriptions.map((row) => (
                                        <tr
                                            key={row.prescriptionId}
                                            className="cursor-pointer hover:bg-slate-50/80"
                                            onClick={() => setSelectedPrescriptionID(row.prescriptionId)}
                                        >
                                            <td className="px-5 py-4 font-semibold text-slate-900">#{row.prescriptionId}</td>
                                            <td className="px-5 py-4">{row.appointmentDate}</td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">{row.doctorName}</p>
                                                <p className="text-xs text-slate-500">DoctorID: {row.doctorId}</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">{row.medicincount} Medicines</p>
                                                <p className="text-xs text-slate-500">{row.testcount} Tests</p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">{row.followupText}</p>
                                                <p className="text-xs text-slate-500">Follow-up schedule</p>
                                            </td>
                                        </tr>
                                    ))}
                                    {isLoadingPrescriptions ? (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                                                Loading Prescriptions...
                                            </td>
                                        </tr>
                                    ) : filteredPrescriptions.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-500">
                                                No prescriptions found for the selected filters.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>

            {selectedPrescription && (
                <div
                    className="prescription-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4"
                    onClick={() => closePrescriptionModal()}
                >
                    <div
                        className="prescription-print-root max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="prescription-modal-header sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                Prescription #{selectedPrescription.prescriptionId}
                            </h2>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownloadPdf}
                                    className="no-print inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Download size={15} />
                                    Download PDF
                                </button>
                                <button
                                    onClick={() => closePrescriptionModal()}
                                    className="no-print rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close prescription preview"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="space-y-6 px-6 py-5">
                            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <p className="text-lg font-bold text-slate-900">{selectedPrescription.doctorName}</p>
                                <p className="mt-1 text-sm text-slate-700">
                                    {selectedPrescription.doctorSpecializations.join(' | ')}
                                </p>
                                <p className="mt-1 text-sm text-slate-600">{selectedPrescription.doctorDegrees}</p>
                            </section>

                            <section className="grid grid-cols-1 gap-3 text-sm text-slate-700 sm:grid-cols-2">
                                <p>
                                    <span className="font-semibold text-slate-900">Patient Name:</span>{' '}
                                    {selectedPrescription.patientName}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-900">Age:</span>{' '}
                                    {selectedPrescription.patientAge}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-900">Sex:</span>{' '}
                                    {selectedPrescription.patientSex}
                                </p>
                                <p>
                                    <span className="font-semibold text-slate-900">Date:</span>{' '}
                                    {selectedPrescription.appointmentDate}
                                </p>
                            </section>

                            <section>
                                <h3 className="mb-3 text-base font-bold text-slate-900">Medicine</h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Name</th>
                                                <th className="px-3 py-2 font-semibold">Dosage</th>
                                                <th className="px-3 py-2 font-semibold">Frequency</th>
                                                <th className="px-3 py-2 font-semibold">Duration</th>
                                                <th className="px-3 py-2 font-semibold">Instructions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                            {selectedPrescription.medicines.map((medicine) => (
                                                <tr key={medicine.prescribedMedicineId}>
                                                    <td className="px-3 py-2 font-medium text-slate-900">{medicine.medicineName}</td>
                                                    <td className="px-3 py-2">{medicine.dosage}</td>
                                                    <td className="px-3 py-2">{medicine.frequency}</td>
                                                    <td className="px-3 py-2">{medicine.duration}</td>
                                                    <td className="px-3 py-2">{medicine.instructions}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 text-base font-bold text-slate-900">Test</h3>
                                <div className="overflow-x-auto rounded-xl border border-slate-200">
                                    <table className="min-w-full divide-y divide-slate-200">
                                        <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                            <tr>
                                                <th className="px-3 py-2 font-semibold">Test Name</th>
                                                <th className="px-3 py-2 font-semibold">Category</th>
                                                <th className="px-3 py-2 font-semibold">Reason</th>
                                                <th className="no-print px-3 py-2 font-semibold">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                            {selectedPrescription.tests.map((test) => (
                                                <tr key={test.prescribedTestId}>
                                                    <td className="px-3 py-2 font-medium text-slate-900">{test.testName}</td>
                                                    <td className="px-3 py-2">{test.category}</td>
                                                    <td className="px-3 py-2">{test.reason}</td>
                                                    <td className="no-print px-3 py-2">
                                                        <Link
                                                            href={`/dashboard/search-tests?testName=${encodeURIComponent(test.testName)}`}
                                                            className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                                                        >
                                                            Book Test
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section>
                                <h3 className="mb-3 text-base font-bold text-slate-900">Notes</h3>
                                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                                    {selectedPrescription.notes || 'No additional notes provided.'}
                                </p>
                            </section>

                            <section>
                                <h3 className="mb-3 text-base font-bold text-slate-900">Follow-up Schedule</h3>
                                <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                                    {selectedPrescription.nextReviewText}
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
