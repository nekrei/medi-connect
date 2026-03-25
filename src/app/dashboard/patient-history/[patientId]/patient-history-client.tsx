'use client';

import { useState } from 'react';
import { Pill, TestTube, X, Download } from 'lucide-react';
import { format } from 'date-fns';

type PrescriptionRecord = {
    prescriptionId: number;
    appointmentDate: string;
    doctorName: string;
    doctorId: number;
    medicincount: number;
    testcount: number;
    followupText: string;
    notes?: string;
};

// Adjust this type based on what `/api/prescription/selectedPrescription` returns
type DetailedPrescription = {
    prescriptionId: number;
    doctorName: string;
    doctorSpecializations: string[];
    doctorDegrees: string;
    patientName: string;
    patientAge: number;
    patientSex: string;
    appointmentDate: string;
    notes: string | null;
    nextReviewText: string;
    medicines: Array<{
        prescribedMedicineId: number;
        medicineName: string;
        dosage: string;
        frequency: string;
        duration: string;
        instructions: string | null;
    }>;
    tests: Array<{
        prescribedTestId: number;
        testName: string;
        category: string;
        reason: string | null;
    }>;
};

export default function PatientHistoryClient({ prescriptions }: { prescriptions: PrescriptionRecord[] }) {
    const [selectedPrescriptionID, setSelectedPrescriptionID] = useState<number | null>(null);
    const [selectedPrescription, setSelectedPrescription] = useState<DetailedPrescription | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    const handlePrescriptionClick = async (prescriptionId: number) => {
        setSelectedPrescriptionID(prescriptionId);
        setIsLoadingDetails(true);
        try {
            console.log(`Fetching prescription details for ID: ${prescriptionId}`);
            const res = await fetch(`/api/prescription/selectedPrescription?prescriptionId=${prescriptionId}`);
            if (res.ok) {
                const data = await res.json();
                console.log("Prescription fetched successfully:", data);
                // If your backend returns `{ prescription: {...} }` use data.prescription,
                // but our route returns the prescription itself, so we just use data.
                setSelectedPrescription(data.prescription || data);
            } else {
                const errorData = await res.json().catch(() => ({}));
                console.error("Failed to fetch prescription details. Status:", res.status, errorData);
            }
        } catch (error) {
            console.error("Error fetching prescription details:", error);
        } finally {
            setIsLoadingDetails(false);
        }
    };

    const closePrescriptionModal = () => {
        setSelectedPrescriptionID(null);
        setSelectedPrescription(null);
    };

    const handleDownloadPdf = () => {
        // Simple print command for doctors to PDF
        window.print();
    };

    return (
        <div className="space-y-4">
            {prescriptions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                    <p className="text-slate-500">No previous prescriptions found for this patient.</p>
                </div>
            ) : (
                prescriptions.map(p => (
                    <div 
                        key={p.prescriptionId} 
                        className="border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:border-blue-400 hover:shadow-md transition bg-white"
                        onClick={() => handlePrescriptionClick(p.prescriptionId)}
                    >
                        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center group-hover:bg-blue-50/30">
                            <div>
                                <p className="font-bold text-slate-800">
                                    {format(new Date(p.appointmentDate), 'MMMM dd, yyyy')}
                                </p>
                                <p className="text-xs text-slate-500 mt-1">Prescribed by Dr. {p.doctorName}</p>
                            </div>
                            <div className="text-xs font-semibold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">
                                View Details
                            </div>
                        </div>
                        
                        <div className="p-4 grid grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                    <Pill size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Medicines</p>
                                    <p className="font-bold text-slate-800">{p.medicincount}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 bg-purple-50/50 p-3 rounded-lg border border-purple-100">
                                <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                                    <TestTube size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Lab Tests</p>
                                    <p className="font-bold text-slate-800">{p.testcount}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}

            {/* Modal for detailed prescription view */}
            {selectedPrescriptionID && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-sm"
                    onClick={closePrescriptionModal}
                >
                    <div
                        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-900">
                                {isLoadingDetails ? 'Loading...' : `Prescription #${selectedPrescriptionID}`}
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
                                    onClick={closePrescriptionModal}
                                    className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {isLoadingDetails ? (
                            <div className="p-10 text-center text-slate-500">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
                                <p className="mt-4">Fetching prescription details...</p>
                            </div>
                        ) : selectedPrescription ? (
                            <div className="space-y-6 px-6 py-5">
                                <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                    <p className="text-lg font-bold text-slate-900">{selectedPrescription.doctorName}</p>
                                    <p className="mt-1 text-sm text-slate-700">
                                        {selectedPrescription.doctorSpecializations?.join(' | ')}
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
                                    {selectedPrescription.medicines?.length > 0 ? (
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
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No medicines prescribed.</p>
                                    )}
                                </section>

                                <section>
                                    <h3 className="mb-3 text-base font-bold text-slate-900">Test</h3>
                                    {selectedPrescription.tests?.length > 0 ? (
                                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                                            <table className="min-w-full divide-y divide-slate-200">
                                                <thead className="bg-slate-100 text-left text-xs uppercase tracking-wide text-slate-500">
                                                    <tr>
                                                        <th className="px-3 py-2 font-semibold">Test Name</th>
                                                        <th className="px-3 py-2 font-semibold">Category</th>
                                                        <th className="px-3 py-2 font-semibold">Reason</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-200 text-sm text-slate-700">
                                                    {selectedPrescription.tests.map((test) => (
                                                        <tr key={test.prescribedTestId}>
                                                            <td className="px-3 py-2 font-medium text-slate-900">{test.testName}</td>
                                                            <td className="px-3 py-2">{test.category}</td>
                                                            <td className="px-3 py-2">{test.reason}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <p className="text-sm text-slate-500 italic">No tests prescribed.</p>
                                    )}
                                </section>

                                <section>
                                    <h3 className="mb-3 text-base font-bold text-slate-900">Notes</h3>
                                    <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-relaxed text-slate-700">
                                        {selectedPrescription.notes || 'No additional notes provided.'}
                                    </p>
                                </section>
                            </div>
                        ) : (
                            <div className="p-10 text-center text-red-500">
                                <p>Error loading prescription data. Please try again.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
