'use client';

import { useState } from 'react';

export default function AddMedicine() {
    const [medicinename, setMedicinename] = useState('');
    const [manufacturer, setManufacturer] = useState('');
    const [price, setPrice] = useState<number | ''>('');
    const [details, setDetails] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        try {
            const res = await fetch('/api/admin/medicine', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    medicinename,
                    manufacturer,
                    price: Number(price),
                    details,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: json.message ?? 'Failed to add medicine.' });
            } else {
                setMessage({ type: 'success', text: 'Medicine added successfully.' });
                setMedicinename(''); setManufacturer(''); setPrice(''); setDetails('');
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Add Medicine</h2>
            <p className="text-sm text-neutral-500 mb-6">
                Register a new medicine in the system.
            </p>

            {message && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Medicine Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={medicinename}
                        onChange={e => setMedicinename(e.target.value)}
                        placeholder="Enter medicine name"
                        required
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Manufacturer <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={manufacturer}
                        onChange={e => setManufacturer(e.target.value)}
                        placeholder="Enter manufacturer name"
                        required
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={price}
                        onChange={e => setPrice(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Enter price"
                        required
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Details <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={details}
                        onChange={e => setDetails(e.target.value)}
                        placeholder="Enter medicine details"
                        required
                        rows={4}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                >
                    {loading ? 'Adding...' : 'Add Medicine'}
                </button>
            </form>
        </div>
    );
}