import { Phone, UserCircle2, ShieldCheck, Stethoscope } from 'lucide-react';

import { getCurrentUser } from '@/lib/auth/current-user';
import { redirect } from 'next/navigation';
import { fetchBasicUserInfo, fetchContactUserInfo, fetchDoctorProfileInfo } from '@/lib/repositories/user-repository';


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
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
                <div className="rounded-lg bg-slate-100 p-2 text-slate-700">{icon}</div>
                <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            {children}
        </section>
    );
}

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

                <div className="grid grid-cols-1 gap-5">
                    <SectionCard title="Basic Information" icon={<ShieldCheck className="h-4 w-4" />}>
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

                    <SectionCard title="Contact" icon={<Phone className="h-4 w-4" />}>
                        <InfoRow label="Email" value={contactInfo?.email ?? basicInfo.email} />
                        {(contactInfo?.phonenumbers ?? []).map((phone, idx) => (
                            <InfoRow key={phone} label={`Phone ${idx + 1}`} value={phone} />
                        ))}
                        {(!contactInfo?.phonenumbers || contactInfo.phonenumbers.length === 0) && (
                            <InfoRow label="Phone" value="Not specified" />
                        )}
                    </SectionCard>

                    {isDoctor && (
                        <SectionCard title="Doctor Details" icon={<Stethoscope className="h-4 w-4" />}>
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
            </div>
        </main>
    );
}
