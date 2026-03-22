import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db'; // hypothetical or using pool

export default async function PrescribePage(props: { params: Promise<{ appointmentId: string }> }) {
    const user = await getCurrentUser();
    
    if (!user || user.role !== 'Doctor') {
        redirect('/login');
    }

    const { appointmentId } = await props.params;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-6">Write Prescription</h1>
            <p className="text-slate-500 mb-8">For Appointment #{appointmentId}</p>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                <form className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Observations / Diagnosis</label>
                        <textarea 
                            rows={4} 
                            placeholder="Enter any initial diagnosis or symptoms..."
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Prescribed Medicines</label>
                        <div className="p-4 border border-blue-100 bg-blue-50 rounded-xl mb-3">
                            <p className="text-sm text-blue-700">In a full implementation, this section allows adding medicines with dosage instructions.</p>
                        </div>
                        <input 
                            type="text" 
                            placeholder="e.g. Paracetamol 500mg, 1+0+1" 
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">Tests (Optional)</label>
                        <input 
                            type="text" 
                            placeholder="e.g. Blood Test, X-Ray" 
                            className="w-full rounded-xl border border-slate-300 p-3 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <button type="button" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700">
                        Submit Prescription
                    </button>
                </form>
            </div>
        </div>
    );
}
