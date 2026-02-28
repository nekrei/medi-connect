import Link from 'next/link';

import LoginForm from '@/components/auth/login-form';

export default function LoginPage() {
    return (
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
            <div className="w-full space-y-4">
                <LoginForm />
                <p className="text-center text-sm text-neutral-600">
                    New here?{' '}
                    <Link href="/register" className="font-medium underline">
                        Create an account
                    </Link>
                </p>
            </div>
        </div>
    );
}
