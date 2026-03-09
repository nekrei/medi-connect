'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Phone, ShieldCheck, Stethoscope, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type BasicInfo = {
    email: string;
    dateofbirth: string;
    sex: string | null;
    bloodtype: string | null;
    propertyname: string | null;
    holdingnumber: string | null;
    road: string | null;
    thananame: string | null;
    districtname: string | null;
    postalcode: string | null;
};

type ContactInfo = {
    email: string;
    phonenumbers: string[];
} | null;

type DoctorDetails = {
    designation: string | null;
    registrationnumber: string | null;
    startpracticedate: string | null;
    registrationexpiry: string | null;
    approvalstatus: 'Approved' | 'Pending' | 'Rejected' | null;
    specializations: string[];
};

type EditSection = 'basic' | 'contact' | 'doctor' | null;

type SavePayload =
    | {
        section: 'basic';
        data: {
            email: string;
            dateofbirth: string;
            sex: string | null;
            bloodtype: string | null;
            propertyname: string | null;
            holdingnumber: string | null;
            road: string | null;
            districtname: string | null;
            thananame: string | null;
            postalcode: string | null;
        };
    }
    | {
        section: 'contact';
        data: {
            email: string;
            phonenumbers: string[];
        };
    }
    | {
        section: 'doctor';
        data: {
            designation: string | null;
            registrationnumber: string | null;
            startpracticedate: string | null;
            registrationexpiry: string | null;
            specializations: string[];
        };
    };

type ProfileSectionsProps = {
    basicInfo: BasicInfo;
    contactInfo: ContactInfo;
    doctorDetails: DoctorDetails;
    isDoctor: boolean;
};

type LocationOptionRow = {
    districtname: string;
    thananame: string;
};

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;
const SEX_OPTIONS = ['M', 'F', 'O'] as const;

const DIVISION_DISTRICTS: Record<string, string[]> = {
    Dhaka: [
        'Dhaka',
        'Gazipur',
        'Narayanganj',
        'Kishoreganj',
        'Manikganj',
        'Munshiganj',
        'Narsingdi',
        'Tangail',
        'Faridpur',
        'Gopalganj',
        'Madaripur',
        'Rajbari',
        'Shariatpur',
    ],
    Chattogram: ['Chattogram', 'Cox\'s Bazar', 'Comilla', 'Feni', 'Brahmanbaria', 'Noakhali', 'Lakshmipur', 'Rangamati', 'Khagrachari', 'Bandarban', 'Chandpur'],
    Khulna: ['Khulna', 'Bagerhat', 'Satkhira', 'Jessore', 'Jhenaidah', 'Narail', 'Magura', 'Kushtia', 'Chuadanga', 'Meherpur'],
    Rajshahi: ['Rajshahi', 'Natore', 'Naogaon', 'Chapainawabganj', 'Pabna', 'Bogura', 'Joypurhat', 'Sirajganj'],
    Barishal: ['Barishal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur'],
    Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon'],
    Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
};

const DIVISION_NAMES = Object.keys(DIVISION_DISTRICTS);

function normalizeDistrictName(name: string): string {
    return name.trim().toLowerCase();
}

function findDivisionByDistrict(districtName: string | null): string {
    if (!districtName) {
        return '';
    }

    const normalized = normalizeDistrictName(districtName);
    for (const [division, districts] of Object.entries(DIVISION_DISTRICTS)) {
        if (districts.some((district) => normalizeDistrictName(district) === normalized)) {
            return division;
        }
    }

    return '';
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-2 last:border-b-0">
            <span className="text-sm text-slate-500">{label}</span>
            <span className="text-right text-sm font-medium text-slate-800">{value}</span>
        </div>
    );
}

function SectionCard({
    title,
    icon,
    onEdit,
    children,
}: {
    title: string;
    icon: ReactNode;
    onEdit: () => void;
    children: ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                    <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</div>
                    <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
                </div>
                <button
                    type="button"
                    onClick={onEdit}
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                >
                    Edit
                </button>
            </div>
            {children}
        </section>
    );
}

function FloatingEditModal({
    activeSection,
    onClose,
    onSave,
    basicInfo,
    contactInfo,
    doctorDetails,
}: {
    activeSection: Exclude<EditSection, null>;
    onClose: () => void;
    onSave: (payload: SavePayload) => Promise<void>;
    basicInfo: BasicInfo;
    contactInfo: ContactInfo;
    doctorDetails: DoctorDetails;
}) {
    const sectionTitle =
        activeSection === 'basic'
            ? 'Edit Basic Information'
            : activeSection === 'contact'
                ? 'Edit Contact'
                : 'Edit Doctor Details';

    const fields = useMemo(() => {
        if (activeSection === 'basic') {
            return [
                { label: 'Email', value: basicInfo.email ?? '' },
                { label: 'Date of Birth', value: basicInfo.dateofbirth ?? '' },
                { label: 'Sex', value: basicInfo.sex ?? '' },
                { label: 'Blood Group', value: basicInfo.bloodtype ?? '' },
                { label: 'Property', value: basicInfo.propertyname ?? '' },
                { label: 'Holding No.', value: basicInfo.holdingnumber ?? '' },
                { label: 'Road', value: basicInfo.road ?? '' },
                { label: 'Thana', value: basicInfo.thananame ?? '' },
                { label: 'District', value: basicInfo.districtname ?? '' },
                { label: 'Postal Code', value: basicInfo.postalcode ?? '' },
            ];
        }

        if (activeSection === 'contact') {
            return [
                { label: 'Email', value: contactInfo?.email ?? basicInfo.email ?? '' },
                {
                    label: 'Phone Numbers',
                    value: (contactInfo?.phonenumbers ?? []).join(', '),
                },
            ];
        }

        return [
            { label: 'Designation', value: doctorDetails.designation ?? '' },
            { label: 'Registration No.', value: doctorDetails.registrationnumber ?? '' },
            { label: 'Practice Start', value: doctorDetails.startpracticedate ?? '' },
            { label: 'Registration Expiry', value: doctorDetails.registrationexpiry ?? '' },
            { label: 'Approval Status', value: doctorDetails.approvalstatus ?? '' },
            {
                label: 'Specializations',
                value: doctorDetails.specializations.join(', '),
            },
        ];
    }, [activeSection, basicInfo, contactInfo, doctorDetails]);

    const [basicForm, setBasicForm] = useState({
        email: basicInfo.email ?? '',
        dateofbirth: basicInfo.dateofbirth ?? '',
        sex: basicInfo.sex ?? '',
        bloodtype: basicInfo.bloodtype ?? '',
        propertyname: basicInfo.propertyname ?? '',
        holdingnumber: basicInfo.holdingnumber ?? '',
        road: basicInfo.road ?? '',
        districtname: basicInfo.districtname ?? '',
        thananame: basicInfo.thananame ?? '',
        postalcode: basicInfo.postalcode ?? '',
    });
    const [selectedDivision, setSelectedDivision] = useState<string>(findDivisionByDistrict(basicInfo.districtname));
    const [locationOptions, setLocationOptions] = useState<LocationOptionRow[]>([]);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const [contactForm, setContactForm] = useState({
        email: contactInfo?.email ?? basicInfo.email ?? '',
        phonenumbers: (contactInfo?.phonenumbers ?? []).join(', '),
    });

    const [doctorForm, setDoctorForm] = useState({
        designation: doctorDetails.designation ?? '',
        registrationnumber: doctorDetails.registrationnumber ?? '',
        startpracticedate: doctorDetails.startpracticedate ?? '',
        registrationexpiry: doctorDetails.registrationexpiry ?? '',
        specializations: doctorDetails.specializations.join(', '),
    });

    useEffect(() => {
        if (activeSection !== 'basic') {
            return;
        }

        let mounted = true;

        async function loadLocationOptions() {
            try {
                setIsLoadingLocations(true);
                const response = await fetch('/api/locations/options', { cache: 'no-store' });
                if (!response.ok) {
                    return;
                }
                const json = (await response.json()) as { data?: LocationOptionRow[] };
                if (mounted) {
                    setLocationOptions(json.data ?? []);
                }
            } finally {
                if (mounted) {
                    setIsLoadingLocations(false);
                }
            }
        }

        loadLocationOptions();

        return () => {
            mounted = false;
        };
    }, [activeSection]);

    const districtOptions = useMemo(() => {
        if (!selectedDivision) {
            return [];
        }
        return DIVISION_DISTRICTS[selectedDivision] ?? [];
    }, [selectedDivision]);

    const thanaOptions = useMemo(() => {
        if (!basicForm.districtname) {
            return [];
        }

        const district = normalizeDistrictName(basicForm.districtname);
        return locationOptions
            .filter((row) => normalizeDistrictName(row.districtname) === district)
            .map((row) => row.thananame)
            .sort((a, b) => a.localeCompare(b));
    }, [basicForm.districtname, locationOptions]);

    async function handleSave() {
        setSaveError(null);
        setIsSaving(true);

        try {
            if (activeSection === 'basic') {
                await onSave({
                    section: 'basic',
                    data: {
                        email: basicForm.email.trim(),
                        dateofbirth: basicForm.dateofbirth,
                        sex: basicForm.sex || null,
                        bloodtype: basicForm.bloodtype || null,
                        propertyname: basicForm.propertyname.trim() || null,
                        holdingnumber: basicForm.holdingnumber.trim() || null,
                        road: basicForm.road.trim() || null,
                        districtname: basicForm.districtname || null,
                        thananame: basicForm.thananame || null,
                        postalcode: basicForm.postalcode.trim() || null,
                    },
                });
                return;
            }

            if (activeSection === 'contact') {
                await onSave({
                    section: 'contact',
                    data: {
                        email: contactForm.email.trim(),
                        phonenumbers: contactForm.phonenumbers
                            .split(',')
                            .map((value) => value.trim())
                            .filter(Boolean),
                    },
                });
                return;
            }

            await onSave({
                section: 'doctor',
                data: {
                    designation: doctorForm.designation.trim() || null,
                    registrationnumber: doctorForm.registrationnumber.trim() || null,
                    startpracticedate: doctorForm.startpracticedate.trim() || null,
                    registrationexpiry: doctorForm.registrationexpiry.trim() || null,
                    specializations: doctorForm.specializations
                        .split(',')
                        .map((value) => value.trim())
                        .filter(Boolean),
                },
            });
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to save changes';
            setSaveError(message);
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-section-title"
            onClick={onClose}
        >
            <div
                className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-5 flex items-center justify-between gap-3">
                    <h3 id="edit-section-title" className="text-xl font-semibold text-slate-900">
                        {sectionTitle}
                    </h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Close edit modal"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form className="space-y-4">
                    {activeSection === 'basic' ? (
                        <>
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                                <input
                                    type="email"
                                    value={basicForm.email}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Date of Birth</span>
                                <input
                                    type="date"
                                    value={basicForm.dateofbirth}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, dateofbirth: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Sex</span>
                                <select
                                    value={basicForm.sex}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, sex: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="">Select sex</option>
                                    {SEX_OPTIONS.map((option) => (
                                        <option key={option} value={option}>
                                            {option}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Blood Group</span>
                                <select
                                    value={basicForm.bloodtype}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, bloodtype: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="">Select blood group</option>
                                    {BLOOD_GROUP_OPTIONS.map((group) => (
                                        <option key={group} value={group}>
                                            {group}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Division</span>
                                <select
                                    value={selectedDivision}
                                    onChange={(event) => {
                                        const division = event.target.value;
                                        setSelectedDivision(division);
                                        setBasicForm((prev) => ({
                                            ...prev,
                                            districtname: '',
                                            thananame: '',
                                            postalcode: '',
                                        }));
                                    }}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                >
                                    <option value="">Select division</option>
                                    {DIVISION_NAMES.map((division) => (
                                        <option key={division} value={division}>
                                            {division}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">District</span>
                                <select
                                    value={basicForm.districtname}
                                    onChange={(event) => {
                                        const district = event.target.value;
                                        setBasicForm((prev) => ({
                                            ...prev,
                                            districtname: district,
                                            thananame: '',
                                        }));
                                    }}
                                    disabled={!selectedDivision}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    <option value="">Select district</option>
                                    {districtOptions.map((district) => (
                                        <option key={district} value={district}>
                                            {district}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Thana</span>
                                <select
                                    value={basicForm.thananame}
                                    onChange={(event) => {
                                        const thana = event.target.value;
                                        setBasicForm((prev) => ({
                                            ...prev,
                                            thananame: thana,
                                        }));
                                    }}
                                    disabled={!basicForm.districtname || isLoadingLocations}
                                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100"
                                >
                                    <option value="">{isLoadingLocations ? 'Loading thanas...' : 'Select thana'}</option>
                                    {thanaOptions.map((thana) => (
                                        <option key={thana} value={thana}>
                                            {thana}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Postal Code</span>
                                <input
                                    type="text"
                                    value={basicForm.postalcode}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, postalcode: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Property</span>
                                <input
                                    type="text"
                                    value={basicForm.propertyname}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, propertyname: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Holding No.</span>
                                <input
                                    type="text"
                                    value={basicForm.holdingnumber}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, holdingnumber: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Road</span>
                                <input
                                    type="text"
                                    value={basicForm.road}
                                    onChange={(event) => setBasicForm((prev) => ({ ...prev, road: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>
                        </>
                    ) : activeSection === 'contact' ? (
                        <>
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Email</span>
                                <input
                                    type="email"
                                    value={contactForm.email}
                                    onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Phone Numbers</span>
                                <input
                                    type="text"
                                    value={contactForm.phonenumbers}
                                    onChange={(event) => setContactForm((prev) => ({ ...prev, phonenumbers: event.target.value }))}
                                    placeholder="Comma separated, e.g. 01700000000, 01800000000"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>
                        </>
                    ) : (
                        <>
                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Designation</span>
                                <input
                                    type="text"
                                    value={doctorForm.designation}
                                    onChange={(event) => setDoctorForm((prev) => ({ ...prev, designation: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Registration No.</span>
                                <input
                                    type="text"
                                    value={doctorForm.registrationnumber}
                                    onChange={(event) => setDoctorForm((prev) => ({ ...prev, registrationnumber: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Practice Start</span>
                                <input
                                    type="date"
                                    value={doctorForm.startpracticedate}
                                    onChange={(event) => setDoctorForm((prev) => ({ ...prev, startpracticedate: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Registration Expiry</span>
                                <input
                                    type="date"
                                    value={doctorForm.registrationexpiry}
                                    onChange={(event) => setDoctorForm((prev) => ({ ...prev, registrationexpiry: event.target.value }))}
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>

                            <label className="block">
                                <span className="mb-1 block text-sm font-medium text-slate-700">Specializations</span>
                                <input
                                    type="text"
                                    value={doctorForm.specializations}
                                    onChange={(event) => setDoctorForm((prev) => ({ ...prev, specializations: event.target.value }))}
                                    placeholder="Comma separated, e.g. Cardiology, Medicine"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                                />
                            </label>
                        </>
                    )}

                    {saveError && <p className="text-sm text-red-600">{saveError}</p>}

                    <div className="mt-6 flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSaving}
                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
                        >
                            {isSaving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export function ProfileSections({ basicInfo, contactInfo, doctorDetails, isDoctor }: ProfileSectionsProps) {
    const [activeSection, setActiveSection] = useState<EditSection>(null);
    const router = useRouter();

    const saveInfo = async (payload: SavePayload) => {
        const response = await fetch('/api/profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const result = (await response.json().catch(() => ({}))) as { message?: string };
        if (!response.ok) {
            throw new Error(result.message ?? 'Failed to save changes');
        }

        setActiveSection(null);
        router.refresh();
    };

    return (
        <>
            <div className="grid grid-cols-1 gap-5">
                <SectionCard title="Basic Information" icon={<ShieldCheck className="h-4 w-4" />} onEdit={() => setActiveSection('basic')}>
                    <InfoRow label="Email" value={basicInfo.email} />
                    <InfoRow label="Date of Birth" value={basicInfo.dateofbirth} />
                    <InfoRow label="Sex" value={basicInfo.sex || 'Not specified'} />
                    <InfoRow label="Blood Group" value={basicInfo.bloodtype || 'Not specified'} />
                    <InfoRow label="Property" value={basicInfo.propertyname || 'Not specified'} />
                    <InfoRow label="Holding No." value={basicInfo.holdingnumber || 'Not specified'} />
                    <InfoRow label="Road" value={basicInfo.road || 'Not specified'} />
                    <InfoRow label="Thana" value={basicInfo.thananame || 'Not specified'} />
                    <InfoRow label="District" value={basicInfo.districtname || 'Not specified'} />
                    <InfoRow label="Postal Code" value={basicInfo.postalcode || 'Not specified'} />
                </SectionCard>

                <SectionCard title="Contact" icon={<Phone className="h-4 w-4" />} onEdit={() => setActiveSection('contact')}>
                    <InfoRow label="Email" value={contactInfo?.email ?? basicInfo.email} />
                    {(contactInfo?.phonenumbers ?? []).map((phone, idx) => (
                        <InfoRow key={phone} label={`Phone ${idx + 1}`} value={phone} />
                    ))}
                    {(!contactInfo?.phonenumbers || contactInfo.phonenumbers.length === 0) && <InfoRow label="Phone" value="Not specified" />}
                </SectionCard>

                {isDoctor && (
                    <SectionCard title="Doctor Details" icon={<Stethoscope className="h-4 w-4" />} onEdit={() => setActiveSection('doctor')}>
                        <InfoRow label="Designation" value={doctorDetails.designation || 'Not specified'} />
                        <InfoRow label="Registration No." value={doctorDetails.registrationnumber || 'Not specified'} />
                        <InfoRow label="Practice Start" value={doctorDetails.startpracticedate || 'Not specified'} />
                        <InfoRow label="Registration Expiry" value={doctorDetails.registrationexpiry || 'Not specified'} />
                        <InfoRow label="Approval Status" value={doctorDetails.approvalstatus || 'Not specified'} />
                        <InfoRow
                            label="Specializations"
                            value={doctorDetails.specializations.length > 0 ? doctorDetails.specializations.join(', ') : 'Not specified'}
                        />
                    </SectionCard>
                )}
            </div>

            {activeSection && (
                <FloatingEditModal
                    activeSection={activeSection}
                    onClose={() => setActiveSection(null)}
                    onSave={saveInfo}
                    basicInfo={basicInfo}
                    contactInfo={contactInfo}
                    doctorDetails={doctorDetails}
                />
            )}
        </>
    );
}
