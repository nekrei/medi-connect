'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';

type ApiError = {
    message?: string;
};

export default function RegisterForm() {
    const router = useRouter();

    const [username, setUsername] = useState('');
    const [firstname, setFirstname] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [dateofbirth, setDateofbirth] = useState('');
    const [sex, setSex] = useState<string>('');
    const [bloodtype, setBloodtype] = useState<string>('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setErrorMessage('');

        if (password !== confirmPassword) {
            setErrorMessage('Passwords do not match.');
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: username.trim(),
                    firstname: firstname.trim(),
                    lastname: lastname.trim(),
                    email: email.trim().toLowerCase(),
                    dateofbirth, // YYYY-MM-DD from input[type="date"]
                    sex: sex || null,
                    bloodtype: bloodtype || null,
                    password,
                    role: 'User',
                }),
            });

            if (!response.ok) {
                const error = (await response.json()) as ApiError;
                setErrorMessage(error.message ?? 'Registration failed');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch {
            setErrorMessage('Unexpected error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4 rounded-lg border p-6">
            <h1 className="text-xl font-semibold">Create account</h1>

            <div className="space-y-1">
                <label htmlFor="username" className="text-sm font-medium">Username</label>
                <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    minLength={3}
                    maxLength={50}
                    required
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label htmlFor="firstname" className="text-sm font-medium">First name</label>
                    <input
                        id="firstname"
                        type="text"
                        value={firstname}
                        onChange={(e) => setFirstname(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        maxLength={50}
                        required
                    />
                </div>

                <div className="space-y-1">
                    <label htmlFor="lastname" className="text-sm font-medium">Last name</label>
                    <input
                        id="lastname"
                        type="text"
                        value={lastname}
                        onChange={(e) => setLastname(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                        maxLength={50}
                        required
                    />
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">Email</label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    required
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="dateofbirth" className="text-sm font-medium">Date of birth</label>
                <input
                    id="dateofbirth"
                    type="date"
                    value={dateofbirth}
                    onChange={(e) => setDateofbirth(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    required
                />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                    <label htmlFor="sex" className="text-sm font-medium">Sex</label>
                    <select
                        id="sex"
                        value={sex}
                        onChange={(e) => setSex(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="">Prefer not to say</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </div>

                <div className="space-y-1">
                    <label htmlFor="bloodtype" className="text-sm font-medium">Blood type</label>
                    <select
                        id="bloodtype"
                        value={bloodtype}
                        onChange={(e) => setBloodtype(e.target.value)}
                        className="w-full rounded-md border px-3 py-2"
                    >
                        <option value="">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">Password</label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    minLength={8}
                    maxLength={128}
                    required
                />
            </div>

            <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-sm font-medium">Confirm password</label>
                <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-md border px-3 py-2"
                    minLength={8}
                    maxLength={128}
                    required
                />
            </div>

            {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

            <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-black px-4 py-2 text-white disabled:opacity-60"
            >
                {isSubmitting ? 'Creating account...' : 'Create account'}
            </button>
        </form>
    );
}
