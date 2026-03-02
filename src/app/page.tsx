import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <main className="flex w-full max-w-sm flex-col items-center gap-8 rounded-2xl border bg-white px-8 py-12 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Medi-Connect</h1>
          <p className="text-sm text-zinc-500">Your medical network, simplified.</p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Link
            href="/register?type=doctor"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Register as Doctor
          </Link>
          <Link
            href="/register"
            className="flex h-11 w-full items-center justify-center rounded-lg bg-zinc-800 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Register as Patient
          </Link>
          <Link
            href="/login"
            className="flex h-11 w-full items-center justify-center rounded-lg border border-zinc-300 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Login
          </Link>
        </div>
      </main>
    </div>
  );
}
