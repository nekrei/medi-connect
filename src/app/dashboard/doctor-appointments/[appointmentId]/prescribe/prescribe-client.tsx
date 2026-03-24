"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

type MedicineOption = {
    medicineid: number;
    medicinename: string;
    manufacturer: string;
};

type TestOption = {
    testid: number;
    testname: string;
};

type AddedMedicine = {
    medicineid: number;
    medicinename: string;
    dosage: string;
    frequency: string;
    duration: string;
    remarks: string;
};

type AddedTest = {
    testid: number;
    testname: string;
};

export default function PrescribeClient({ 
    appointmentId,
    patientId,
    doctorId,
    appointmentDate
}: { 
    appointmentId: number;
    patientId: number;
    doctorId: number;
    appointmentDate: string;
}) {
    const router = useRouter();
    const [notes, setNotes] = useState('');
    const [followup, setFollowup] = useState('');
    
    const [addedMedicines, setAddedMedicines] = useState<AddedMedicine[]>([]);
    const [addedTests, setAddedTests] = useState<AddedTest[]>([]);

    const [medicineOptions, setMedicineOptions] = useState<MedicineOption[]>([]);
    const [testOptions, setTestOptions] = useState<TestOption[]>([]);

    const [selectedMedId, setSelectedMedId] = useState<string>('');
    const [freq1, setFreq1] = useState(''); 
    const [freq2, setFreq2] = useState(''); 
    const [freq3, setFreq3] = useState(''); 
    const [freq4, setFreq4] = useState(''); 
    const [durationVal, setDurationVal] = useState('');
    const [durationUnit, setDurationUnit] = useState('Days');

    const [selectedTestId, setSelectedTestId] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        let mounted = true;
        fetch('/api/medicine').then(r => r.json()).then(data => {
            if (mounted && data.data) setMedicineOptions(data.data);
        });
        fetch('/api/tests').then(r => r.json()).then(data => {
            if (mounted && data.data) setTestOptions(data.data);
        });
        return () => { mounted = false; };
    }, []);

    const handleAddMedicine = () => {
        if (!selectedMedId) return;
        const med = medicineOptions.find(m => m.medicineid.toString() === selectedMedId);
        if (!med) return;

        const frequency = `${freq1 || '0'}+${freq2 || '0'}+${freq3 || '0'}+${freq4 || '0'}`;
        const duration = durationVal ? `${durationVal} ${durationUnit}` : '';

        setAddedMedicines(prev => [...prev, {
            medicineid: med.medicineid,
            medicinename: med.medicinename,
            dosage: '', 
            frequency: frequency,
            duration: duration,
            remarks: ''
        }]);

        setSelectedMedId('');
        setFreq1(''); setFreq2(''); setFreq3(''); setFreq4('');
        setDurationVal('');
    };

    const handleRemoveMedicine = (index: number) => {
        setAddedMedicines(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddTest = () => {
        if (!selectedTestId) return;
        const test = testOptions.find(t => t.testid.toString() === selectedTestId);
        if (!test) return;

        if (addedTests.some(t => t.testid === test.testid)) return;

        setAddedTests(prev => [...prev, {
            testid: test.testid,
            testname: test.testname
        }]);

        setSelectedTestId('');
    };

    const handleRemoveTest = (index: number) => {
        setAddedTests(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                prescription: {
                    patientid: patientId,
                    doctorid: doctorId,
                    appointmentdate: appointmentDate,
                    notes: notes,
                    followup: followup,
                    appointmentid: appointmentId
                },
                medicines: addedMedicines.map(m => ({
                    medicineid: m.medicineid,
                    dosage: m.dosage,
                    frequency: m.frequency,
                    duration: m.duration,
                    remarks: m.remarks
                })),
                tests: addedTests.map(t => ({
                    testid: t.testid
                }))
            };

            const response = await fetch('/api/prescription', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                alert('Prescription submitted successfully!');
                router.push('/dashboard/doctor-appointments');
                router.refresh();
            } else {
                alert('Failed to submit prescription');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('An error occurred');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form className="space-y-8">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Observations / Diagnosis</label>
                <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4} 
                    placeholder="Enter any initial diagnosis or symptoms..."
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                ></textarea>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                <h3 className="text-md font-bold text-slate-800 mb-4">Prescribed Medicines</h3>
                
                {addedMedicines.length > 0 && (
                    <div className="mb-4 space-y-2">
                        {addedMedicines.map((med, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                <div>
                                    <p className="font-semibold text-slate-800 text-sm">{med.medicinename}</p>
                                    <p className="text-xs text-slate-500">Freq: {med.frequency} | Duration: {med.duration}</p>
                                </div>
                                <button type="button" onClick={() => handleRemoveMedicine(idx)} className="text-red-500 hover:text-red-700">
                                    <X size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end bg-white p-4 rounded-xl border border-slate-200">
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Search & Select Medicine</label>
                        <select 
                            value={selectedMedId} 
                            onChange={(e) => setSelectedMedId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white font-sans"
                        >
                            <option value="">-- Choose Medicine --</option>
                            {medicineOptions.map(med => (
                                <option key={med.medicineid} value={med.medicineid}>
                                    {med.medicinename} ({med.manufacturer})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Frequency (Morning / Noon / Night)</label>
                        <div className="flex gap-2">
                            <input type="text" placeholder="M" value={freq1} onChange={e => setFreq1(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm text-center focus:border-blue-500 outline-none" />
                            <span className="text-slate-400 self-center">-</span>
                            <input type="text" placeholder="N" value={freq2} onChange={e => setFreq2(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm text-center focus:border-blue-500 outline-none" />
                            <span className="text-slate-400 self-center">-</span>
                            <input type="text" placeholder="N" value={freq3} onChange={e => setFreq3(e.target.value)} className="w-full rounded-lg border border-slate-300 p-2 text-sm text-center focus:border-blue-500 outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Duration</label>
                        <div className="flex gap-2">
                            <input 
                                type="number" 
                                placeholder="e.g. 5" 
                                value={durationVal}
                                onChange={e => setDurationVal(e.target.value)}
                                className="w-1/2 rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 outline-none"
                            />
                            <select 
                                value={durationUnit} 
                                onChange={e => setDurationUnit(e.target.value)}
                                className="w-1/2 rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 outline-none bg-white"
                            >
                                <option value="Days">Days</option>
                                <option value="Months">Months</option>
                            </select>
                        </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                        <button 
                            type="button" 
                            onClick={handleAddMedicine}
                            className="w-full h-[38px] bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition"
                        >
                            Add Medicine
                        </button>
                    </div>
                </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50">
                 <h3 className="text-md font-bold text-slate-800 mb-4">Tests (Optional)</h3>
                 
                 {addedTests.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-2">
                        {addedTests.map((test, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-slate-200 shadow-sm">
                                <span className="text-sm font-medium text-slate-700">{test.testname}</span>
                                <button type="button" onClick={() => handleRemoveTest(idx)} className="text-slate-400 hover:text-red-500 mt-0.5">
                                    <X size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                 <div className="flex gap-4 items-end">
                     <div className="flex-1">
                        <select 
                            value={selectedTestId} 
                            onChange={(e) => setSelectedTestId(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none bg-white font-sans"
                        >
                            <option value="">-- Select Test --</option>
                            {testOptions.map(test => (
                                <option key={test.testid} value={test.testid}>
                                    {test.testname}
                                </option>
                            ))}
                        </select>
                     </div>
                     <button 
                         type="button" 
                         onClick={handleAddTest}
                         className="h-[38px] px-4 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition whitespace-nowrap"
                     >
                         Add Test
                     </button>
                 </div>
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Follow Up</label>
                <input 
                    type="text" 
                    value={followup}
                    onChange={(e) => setFollowup(e.target.value)}
                    placeholder="e.g. Next review in 7 days" 
                    className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
            </div>

            <button 
                type="button" 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
                {isSubmitting ? 'Submitting...' : 'Submit Prescription'}
            </button>
        </form>
    );
}
