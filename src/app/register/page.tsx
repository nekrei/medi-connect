import Link from 'next/link';

import RegisterForm from '@/components/auth/register-form';

export default function RegisterPage() {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
            <div className="w-full space-y-4">
                <RegisterForm />
                <p className="text-center text-sm text-neutral-600">
                    Already have an account?{' '}
                    <Link href="/login" className="font-medium underline">
                        Login
                    </Link>
                </p>
            </div>
        </div>
    );
}
