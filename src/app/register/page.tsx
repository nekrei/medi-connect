import Link from 'next/link';

import RegisterForm from '@/components/auth/register-form';

type Props = {
    searchParams: Promise<{ type?: string }>;
};

export default async function RegisterPage({ searchParams }: Props) {
    const params = await searchParams;
    const isDoctor = params.type === 'doctor';

    return (
        <div className="mx-auto flex min-h-screen w-full max-w-md items-center px-4">
            <div className="w-full space-y-4">
                <RegisterForm isDoctor={isDoctor} />
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
