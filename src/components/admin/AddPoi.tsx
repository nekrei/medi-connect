'use client';

import { useEffect, useState } from 'react';

type District = { districtid: number; districtname: string };
type Thana = { thanaid: number; thananame: string };

type Props = {
    type: 'hospital' | 'dgcenter';
};

export default function AddPoi({ type }: Props) {
    const label = type === 'hospital' ? 'Hospital' : 'Diagnostic Center';

    const [districts, setDistricts] = useState<District[]>([]);
    const [thanas, setThanas] = useState<Thana[]>([]);

    const [name, setName] = useState('');
    const [district, setDistrict] = useState('');
    const [thana, setThana] = useState('');
    const [road, setRoad] = useState('');
    const [holdingnumber, setHoldingnumber] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        fetch('/api/locations/districts')
            .then(r => r.json())
            .then(json => setDistricts(json.data ?? []));
    }, []);

    useEffect(() => {
        if (!district) { setThanas([]); setThana(''); return; }
        fetch(`/api/locations/thanas?district=${encodeURIComponent(district)}`)
            .then(r => r.json())
            .then(json => { setThanas(json.data ?? []); setThana(''); });
    }, [district]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setMessage(null);
        setLoading(true);
        try {
            const res = await fetch('/api/locations/add-poi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    name,
                    thana,
                    district,
                    holdingnumber: holdingnumber || null,
                    road: road || null,
                }),
            });
            const json = await res.json();
            if (!res.ok) {
                setMessage({ type: 'error', text: json.message ?? 'Failed to add location.' });
            } else {
                setMessage({ type: 'success', text: `${label} added successfully.` });
                setName(''); setDistrict(''); setThana(''); setRoad(''); setHoldingnumber('');
            }
        } catch {
            setMessage({ type: 'error', text: 'Network error.' });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Add {label}</h2>
            <p className="text-sm text-neutral-500 mb-6">
                Register a new {label.toLowerCase()} location in the system.
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
                        {label} Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder={`Enter ${label.toLowerCase()} name`}
                        required
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        District <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={district}
                        onChange={e => setDistrict(e.target.value)}
                        required
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select district</option>
                        {districts.map(d => (
                            <option key={d.districtid} value={d.districtname}>{d.districtname}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Thana <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={thana}
                        onChange={e => setThana(e.target.value)}
                        required
                        disabled={!district}
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-neutral-100 disabled:text-neutral-400"
                    >
                        <option value="">{district ? 'Select thana' : 'Select district first'}</option>
                        {thanas.map(t => (
                            <option key={t.thanaid} value={t.thananame}>{t.thananame}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Road <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={road}
                        onChange={e => setRoad(e.target.value)}
                        placeholder="e.g. Road 5"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Holding Number <span className="text-neutral-400 font-normal">(optional)</span>
                    </label>
                    <input
                        type="text"
                        value={holdingnumber}
                        onChange={e => setHoldingnumber(e.target.value)}
                        placeholder="e.g. 12/A"
                        className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition text-sm"
                >
                    {loading ? 'Adding...' : `Add ${label}`}
                </button>
            </form>
        </div>
    );
}
