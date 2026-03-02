'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type ApiError = { message?: string };

const inputCls = 'w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400';
const selectCls = inputCls;

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="text-sm font-medium">{label}</label>
            {children}
        </div>
    );
}

// ── Shared basic fields ───────────────────────────────────────────────────────

type BasicFields = {
    username: string;
    firstname: string;
    lastname: string;
    email: string;
    dateofbirth: string;
    sex: string;
    bloodtype: string;
    password: string;
    confirmPassword: string;
};

// ── Doctor-specific fields ────────────────────────────────────────────────────

type DoctorFields = {
    registrationnumber: string;
    designation: string;
    startpracticedate: string;
    registrationexpiry: string;
};

// ── Step 1 ────────────────────────────────────────────────────────────────────

function StepOne({
    isDoctor,
    fields,
    onChange,
    error,
    onSubmit,
}: {
    isDoctor: boolean;
    fields: BasicFields;
    onChange: (key: keyof BasicFields, value: string) => void;
    error: string;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {/* Header */}
            <div className="space-y-1 pb-1">
                {isDoctor && (
                    <div className="mb-3 flex items-center gap-2">
                        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                            Doctor registration
                        </span>
                        <span className="text-xs text-zinc-400">Step 1 of 2</span>
                    </div>
                )}
                <h1 className="text-xl font-semibold">
                    {isDoctor ? 'Basic information' : 'Create account'}
                </h1>
                {isDoctor && (
                    <p className="text-sm text-zinc-500">
                        Your BMDC registration details will be collected on the next step.
                    </p>
                )}
            </div>

            <Field id="username" label="Username">
                <input id="username" type="text" value={fields.username}
                    onChange={(e) => onChange('username', e.target.value)}
                    className={inputCls} minLength={3} maxLength={50} required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field id="firstname" label="First name">
                    <input id="firstname" type="text" value={fields.firstname}
                        onChange={(e) => onChange('firstname', e.target.value)}
                        className={inputCls} maxLength={50} required />
                </Field>
                <Field id="lastname" label="Last name">
                    <input id="lastname" type="text" value={fields.lastname}
                        onChange={(e) => onChange('lastname', e.target.value)}
                        className={inputCls} maxLength={50} required />
                </Field>
            </div>

            <Field id="email" label="Email">
                <input id="email" type="email" value={fields.email}
                    onChange={(e) => onChange('email', e.target.value)}
                    className={inputCls} required />
            </Field>

            <Field id="dateofbirth" label="Date of birth">
                <input id="dateofbirth" type="date" value={fields.dateofbirth}
                    onChange={(e) => onChange('dateofbirth', e.target.value)}
                    className={inputCls} required />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field id="sex" label="Sex">
                    <select id="sex" value={fields.sex}
                        onChange={(e) => onChange('sex', e.target.value)}
                        className={selectCls}>
                        <option value="">Prefer not to say</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </Field>
                <Field id="bloodtype" label="Blood type">
                    <select id="bloodtype" value={fields.bloodtype}
                        onChange={(e) => onChange('bloodtype', e.target.value)}
                        className={selectCls}>
                        <option value="">Unknown</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bt) => (
                            <option key={bt} value={bt}>{bt}</option>
                        ))}
                    </select>
                </Field>
            </div>

            <Field id="password" label="Password">
                <input id="password" type="password" value={fields.password}
                    onChange={(e) => onChange('password', e.target.value)}
                    className={inputCls} minLength={8} maxLength={128} required />
            </Field>

            <Field id="confirmPassword" label="Confirm password">
                <input id="confirmPassword" type="password" value={fields.confirmPassword}
                    onChange={(e) => onChange('confirmPassword', e.target.value)}
                    className={inputCls} minLength={8} maxLength={128} required />
            </Field>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>}

            <button type="submit"
                className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-60 ${isDoctor
                        ? 'bg-blue-600 hover:bg-blue-700'
                        : 'bg-zinc-900 hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200'
                    }`}>
                {isDoctor ? 'Continue to doctor details →' : 'Create account'}
            </button>
        </form>
    );
}

// ── Step 2 ────────────────────────────────────────────────────────────────────

function StepTwo({
    fields,
    onChange,
    error,
    isSubmitting,
    onBack,
    onSubmit,
}: {
    fields: DoctorFields;
    onChange: (key: keyof DoctorFields, value: string) => void;
    error: string;
    isSubmitting: boolean;
    onBack: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}) {
    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
            {/* Header */}
            <div className="space-y-1 pb-1">
                <div className="mb-3 flex items-center gap-2">
                    <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        Doctor registration
                    </span>
                    <span className="text-xs text-zinc-400">Step 2 of 2</span>
                </div>
                <h1 className="text-xl font-semibold">Doctor details</h1>
                <p className="text-sm text-zinc-500">
                    Your BMDC number will be manually verified by an admin before doctor-level
                    access is granted.
                </p>
            </div>

            {/* Approval notice */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                After submitting, your account will be <strong>pending approval</strong>. You can
                log in but doctor features will unlock once an admin verifies your registration.
            </div>

            <Field id="registrationnumber" label="BMDC Registration Number *">
                <input id="registrationnumber" type="text" value={fields.registrationnumber}
                    onChange={(e) => onChange('registrationnumber', e.target.value)}
                    className={inputCls} placeholder="e.g. A-12345" maxLength={50} required />
            </Field>

            <Field id="designation" label="Designation (optional)">
                <input id="designation" type="text" value={fields.designation}
                    onChange={(e) => onChange('designation', e.target.value)}
                    className={inputCls} placeholder="e.g. Cardiologist" maxLength={100} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
                <Field id="startpracticedate" label="Practice start date (optional)">
                    <input id="startpracticedate" type="date" value={fields.startpracticedate}
                        onChange={(e) => onChange('startpracticedate', e.target.value)}
                        className={inputCls} />
                </Field>
                <Field id="registrationexpiry" label="Registration expiry (optional)">
                    <input id="registrationexpiry" type="date" value={fields.registrationexpiry}
                        onChange={(e) => onChange('registrationexpiry', e.target.value)}
                        className={inputCls} />
                </Field>
            </div>

            {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">{error}</p>}

            <div className="flex gap-3">
                <button type="button" onClick={onBack} disabled={isSubmitting}
                    className="flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800">
                    ← Back
                </button>
                <button type="submit" disabled={isSubmitting}
                    className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-60">
                    {isSubmitting ? 'Submitting…' : 'Submit registration'}
                </button>
            </div>
        </form>
    );
}

// ── Root export ───────────────────────────────────────────────────────────────

export default function RegisterForm({ isDoctor }: { isDoctor: boolean }) {
    const router = useRouter();

    const [step, setStep] = useState<1 | 2>(1);

    const [basic, setBasic] = useState<BasicFields>({
        username: '', firstname: '', lastname: '', email: '',
        dateofbirth: '', sex: '', bloodtype: '', password: '', confirmPassword: '',
    });

    const [doctor, setDoctor] = useState<DoctorFields>({
        registrationnumber: '', designation: '', startpracticedate: '', registrationexpiry: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    function handleBasicChange(key: keyof BasicFields, value: string) {
        setBasic((prev) => ({ ...prev, [key]: value }));
    }

    function handleDoctorChange(key: keyof DoctorFields, value: string) {
        setDoctor((prev) => ({ ...prev, [key]: value }));
    }

    function handleStep1Submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErrorMessage('');
        if (basic.password !== basic.confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }
        if (isDoctor) {
            setStep(2);
        } else {
            void submitRegistration();
        }
    }

    function handleStep2Submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        void submitRegistration();
    }

    async function submitRegistration() {
        setErrorMessage('');
        setIsSubmitting(true);
        try {
            const body = {
                username: basic.username.trim(),
                firstname: basic.firstname.trim(),
                lastname: basic.lastname.trim(),
                email: basic.email.trim().toLowerCase(),
                dateofbirth: basic.dateofbirth,
                sex: basic.sex || null,
                bloodtype: basic.bloodtype || null,
                password: basic.password,
                ...(isDoctor && {
                    registrationnumber: doctor.registrationnumber.trim(),
                    designation: doctor.designation.trim() || null,
                    startpracticedate: doctor.startpracticedate || null,
                    registrationexpiry: doctor.registrationexpiry || null,
                }),
            };

            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = (await res.json()) as ApiError;
                setErrorMessage(err.message ?? 'Registration failed');
                return;
            }

            router.push(isDoctor ? '/doctor/pending' : '/dashboard');
            router.refresh();
        } catch {
            setErrorMessage('Unexpected error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (step === 2 && isDoctor) {
        return (
            <StepTwo
                fields={doctor}
                onChange={handleDoctorChange}
                error={errorMessage}
                isSubmitting={isSubmitting}
                onBack={() => { setErrorMessage(''); setStep(1); }}
                onSubmit={handleStep2Submit}
            />
        );
    }

    return (
        <StepOne
            isDoctor={isDoctor}
            fields={basic}
            onChange={handleBasicChange}
            error={errorMessage}
            onSubmit={handleStep1Submit}
        />
    );
}