import { UserCircle2 } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { fetchBasicUserInfo, fetchContactUserInfo, fetchDoctorProfileInfo } from '@/lib/repositories/user-repository';
import { ProfileSections } from '@/components/profile/profile-sections';

export default async function ProfilePage() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        redirect('/login');
    }
    const userid = Number(currentUser.id);
    if (!Number.isFinite(userid)) {
        redirect('/login');
    }
    const [basicInfo, contactInfo, doctorInfo] = await Promise.all([
        fetchBasicUserInfo(userid),
        fetchContactUserInfo(userid),
        fetchDoctorProfileInfo(userid),
    ]);
    if (!basicInfo) {
        redirect('/login');
    }
    const isDoctor = basicInfo.role?.toLowerCase() === 'doctor';
    const doctorDetails = doctorInfo ?? {
        designation: null,
        registrationnumber: null,
        startpracticedate: null,
        registrationexpiry: null,
        approvalstatus: null,
        specializations: [] as string[],
    };
    return (
        <main className="min-h-screen bg-slate-50 px-4 py-10 md:px-6">
            <div className="mx-auto max-w-3xl">
                <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow">
                        <UserCircle2 className="h-16 w-16 text-slate-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">{basicInfo.firstname + ' ' + basicInfo.lastname}</h1>
                    <p className="mt-1 text-sm text-slate-500">@{basicInfo.username}</p>
                </div>

                <ProfileSections
                    basicInfo={basicInfo}
                    contactInfo={contactInfo}
                    doctorDetails={doctorDetails}
                    isDoctor={isDoctor}
                />
            </div>
        </main>
    );
}
