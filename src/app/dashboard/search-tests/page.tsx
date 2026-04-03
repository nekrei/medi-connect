"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
    ChevronDown,
    ChevronUp,
    Filter,
    LoaderCircle,
    MapPin,
    Search,
    Stethoscope,
    Phone,
    Mail,
} from 'lucide-react';

import { DiagnosticCenterTestRow } from '@/lib/repositories/test-report-repository';


type LocationOptionRow = {
    districtname: string;
    thananame: string;
};

function formatAddress(center: DiagnosticCenterTestRow) {
    return [center.propertyName, center.holdingNumber, center.road, center.thanaName, center.districtName]
        .filter(Boolean)
        .join(', ');
}

function timeWindow(center: DiagnosticCenterTestRow) {
    if (!center.openingTime && !center.closingTime) {
        return 'Time not available';
    }
    return `${center.openingTime ?? '--:--'} - ${center.closingTime ?? '--:--'}`;
}

export default function SearchTestsPage() {
    const searchParams = useSearchParams();
    const initialTestName = searchParams.get('testName') ?? '';
    const initialTestId = searchParams.get('testId') ?? '';

    const [query, setQuery] = useState(initialTestName);
    const [district, setDistrict] = useState('All');
    const [thana, setThana] = useState('All');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [rows, setRows] = useState<DiagnosticCenterTestRow[]>([]);
    const [displayRows, setDisplayRows] = useState<DiagnosticCenterTestRow[]>([]);
    const [locationOptions, setLocationOptions] = useState<LocationOptionRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedCenterKey, setExpandedCenterKey] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        async function loadLocationOptions() {
            try {
                const response = await fetch('/api/locations/options', { cache: 'no-store' });
                if (!response.ok) {
                    return;
                }

                const payload = (await response.json()) as { data?: LocationOptionRow[] };
                if (isMounted) {
                    setLocationOptions(payload.data ?? []);
                }
            } catch {
                if (isMounted) {
                    setLocationOptions([]);
                }
            }
        }

        async function LoadAvailableTests() {
            try {
                setIsLoading(true);
                const response = await fetch(`/api/diagnostics/search`, { cache: 'no-store' });
                if (!response.ok) {
                    const payload = (await response.json().catch(() => ({ message: 'Search failed' }))) as { message?: string };
                    throw new Error(payload.message ?? 'Search failed');
                }

                const payload = (await response.json()) as { data?: DiagnosticCenterTestRow[] };

                if (isMounted) {
                    setRows(payload.data ?? []);
                }
            } catch (error) {
                if (isMounted) {
                    setRows([]);
                }
            }
            finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        }

        loadLocationOptions();
        LoadAvailableTests();
        return () => {
            isMounted = false;
        };
    }, []);

    useEffect(() => {
        let filtered = rows.filter((row) => {
            return (!query || row.testName.toLowerCase().includes(query.trim().toLowerCase()) || row.centerName.toLowerCase().includes(query.trim().toLowerCase()))
                && (district === 'All' || row.districtName === district)
                && (thana === 'All' || row.thanaName === thana)
                && (!minPrice || Number(row.price) >= Number(minPrice))
                && (!maxPrice || Number(row.price) <= Number(maxPrice));
        });

        filtered = Array.from(
            new Map(
                filtered.map((row) => [
                    `${row.testId}-${row.centerId}-${Number(row.price)}`,
                    row,
                ])
            ).values()
        );

        setDisplayRows(filtered.sort((a, b) => {
            const testCompare = a.testName.localeCompare(b.testName);
            if (testCompare !== 0) return testCompare;
            const priceCompare = Number(a.price) - Number(b.price);
            if (priceCompare !== 0) return priceCompare;
            return a.centerName.localeCompare(b.centerName);
        }));

    }, [rows, district, initialTestId, maxPrice, minPrice, query, thana]);

    const districtOptions = useMemo(() => {
        return ['All', ...Array.from(new Set(locationOptions.map((option) => option.districtname))).sort()];
    }, [locationOptions]);

    const thanaOptions = useMemo(() => {
        const all = district === 'All'
            ? []
            : locationOptions.filter((option) => option.districtname === district);

        return ['All', ...Array.from(new Set(all.map((option) => option.thananame))).sort()];
    }, [district, locationOptions]);


    return (
        <main className="min-h-screen bg-slate-50 p-4 md:p-8 lg:p-12">
            <div className="mx-auto max-w-7xl space-y-8">
                <header className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                                <Stethoscope size={14} />
                                Diagnostic Test Finder
                            </div>
                            <h1 className="text-3xl font-extrabold text-slate-900">Search Diagnostic Centers</h1>
                            <p className="mt-2 max-w-3xl text-sm text-slate-500">
                                Search centers by available tests, location, and price range. Click a center card to reveal
                                detailed address and contact information.
                            </p>

                            {initialTestName ? (
                                <p className="mt-3 inline-flex rounded-md bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
                                    Suggested for pending test: {initialTestName}
                                </p>
                            ) : null}
                        </div>

                        <Link
                            href="/dashboard/check-reports"
                            className="inline-flex items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                            Back to Report Dashboard
                        </Link>
                    </div>
                </header>

                <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-4 flex items-center gap-2 text-slate-800">
                        <Filter size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold">Filter Search</h2>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <label className="space-y-2 xl:col-span-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Test or Center</span>
                            <div className="relative">
                                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    placeholder="e.g. CBC, MRI, Popular Diagnostic"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </div>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">District</span>
                            <select
                                value={district}
                                onChange={(event) => {
                                    setDistrict(event.target.value);
                                    setThana('All');
                                }}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            >
                                {districtOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="space-y-2">
                            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Thana</span>
                            <select
                                value={thana}
                                onChange={(event) => setThana(event.target.value)}
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                            >
                                {thanaOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <fieldset className="grid grid-cols-2 gap-3">
                            <label className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Min Price</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={minPrice}
                                    onChange={(event) => setMinPrice(event.target.value)}
                                    placeholder="0"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>

                            <label className="space-y-2">
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Max Price</span>
                                <input
                                    type="number"
                                    min="0"
                                    value={maxPrice}
                                    onChange={(event) => setMaxPrice(event.target.value)}
                                    placeholder="5000"
                                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-blue-200 transition focus:ring"
                                />
                            </label>
                        </fieldset>
                    </div>
                </section>


                <section className="space-y-4">
                    {isLoading ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            <LoaderCircle className="mx-auto mb-3 animate-spin" size={22} />
                            Searching diagnostic centers...
                        </div>
                    ) : null}

                    {!isLoading && displayRows.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                            No diagnostic centers matched your filters.
                        </div>
                    ) : null}

                    {!isLoading
                        ? displayRows.map((row) => {
                            const isSuggestedTest = initialTestId && Number(initialTestId) === row.testId;
                            const centerKey = `${row.testId}-${row.centerId}-${Number(row.price)}`;
                            const isCenterExpanded = expandedCenterKey === centerKey;

                            return (
                                <article
                                    key={centerKey}
                                    className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                                >
                                    <div className={[
                                        'px-5 py-5',
                                        isSuggestedTest ? 'bg-amber-50/60' : 'bg-white',
                                    ].join(' ')}>
                                        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-start">
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-900">{row.testName}</h3>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Category: <span className="font-medium text-slate-800">{row.testCategory ?? 'General'}</span>
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Price: <span className="font-semibold text-slate-800">Tk {Number(row.price)}</span>
                                                </p>
                                            </div>
                                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                                1 diagnostic center
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 px-5 py-5">
                                        <div className="overflow-hidden rounded-xl border border-slate-200">
                                            <button
                                                type="button"
                                                className="w-full bg-white px-4 py-3 text-left transition hover:bg-slate-50"
                                                onClick={() => setExpandedCenterKey(isCenterExpanded ? null : centerKey)}
                                            >
                                                <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
                                                    <div>
                                                        <h4 className="text-base font-bold text-slate-900">{row.centerName}</h4>
                                                        <p className="mt-1 inline-flex items-center gap-1 text-sm text-slate-600">
                                                            <MapPin size={14} />
                                                            {row.thanaName}, {row.districtName}
                                                        </p>
                                                    </div>
                                                    <div className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">
                                                        Tk {Number(row.price)}
                                                        {isCenterExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                    </div>
                                                </div>
                                            </button>

                                            {isCenterExpanded ? (
                                                <div className="border-t border-slate-100 bg-slate-50 px-4 py-4">
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                        <div>
                                                            <p className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                                <Phone size={14} />
                                                                {row.contactNumber ?? 'No phone listed'}
                                                            </p>
                                                            <p className="mt-2 inline-flex items-center gap-2 text-sm text-slate-700">
                                                                <Mail size={14} />
                                                                {row.email ?? 'No email listed'}
                                                            </p>
                                                            <p className="mt-2 text-sm text-slate-700">Open: {timeWindow(row)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">Location Details</p>
                                                            <p className="mt-1 text-sm text-slate-700">
                                                                {formatAddress(row) || `${row.thanaName}, ${row.districtName}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </article>
                            );
                        })
                        : null}
                </section>
            </div>
        </main>
    );
}
