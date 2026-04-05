'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type ApiError = {
    message?: string;
};

type LoginApiSuccess = {
    user?: {
        role?: 'Admin' | 'Doctor' | 'User';
        doctorStatus?: 'Approved' | 'Pending' | 'Rejected';
    };
};

export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsSubmitting(true);
        setErrorMessage('');

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const error = (await response.json()) as ApiError;
                setErrorMessage(error.message ?? 'Login failed');
                return;
            }

            const payload = (await response.json()) as LoginApiSuccess;
            const nextPath =
                payload.user?.role === 'Doctor' && payload.user.doctorStatus !== 'Approved'
                    ? '/doctor/pending'
                    : '/dashboard';

            router.push(nextPath);
            router.refresh();
        } catch {
            setErrorMessage('Unexpected error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-6">
            <h1 className="text-xl font-semibold">Login</h1>

            <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    required
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    minLength={8}
                    required
                />
            </div>

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            >
                {isSubmitting ? 'Logging in...' : 'Login'}
            </button>
        </form>
    );
}
