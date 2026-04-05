import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/current-user';
import Link from 'next/link';

export default async function DoctorPendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  // Redirect if the user has not applied for doctor privileges
  if (!user.doctorStatus) {
    redirect('/dashboard');
  }

  if (user.doctorStatus === 'Approved') {
    redirect('/dashboard');
  }

  let title = '';
  let message = '';

  if (user.doctorStatus === 'Pending') {
    title = 'Approval Pending';
    message = 'Your request for doctor privileges is awaiting admin approval.';
  } else if (user.doctorStatus === 'Rejected') {
    title = 'Approval Rejected';
    message = 'Your approval has been rejected by the admin.';
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">{title}</h1>
        <p className="text-gray-600 mb-8">{message}</p>
        <Link
          href="/dashboard"
          className="inline-block bg-blue-600 text-white font-medium px-6 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
