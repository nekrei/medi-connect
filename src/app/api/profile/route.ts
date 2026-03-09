import { NextResponse } from 'next/server';
import { z } from 'zod';

import { getCurrentUser } from '@/lib/auth/current-user';
import {
    updateBasicProfileInfo,
    updateContactProfileInfo,
    updateDoctorProfileInfo,
} from '@/lib/repositories/user-repository';

const basicSchema = z.object({
    email: z.string().email(),
    dateofbirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    sex: z.enum(['M', 'F', 'O']).or(z.literal('')).nullable().transform((value) => value || null),
    bloodtype: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).or(z.literal('')).nullable().transform((value) => value || null),
    propertyname: z.string().nullable().transform((value) => value?.trim() || null),
    holdingnumber: z.string().nullable().transform((value) => value?.trim() || null),
    road: z.string().nullable().transform((value) => value?.trim() || null),
    districtname: z.string().nullable().transform((value) => value?.trim() || null),
    thananame: z.string().nullable().transform((value) => value?.trim() || null),
    postalcode: z.string().nullable().transform((value) => value?.trim() || null),
});

const contactSchema = z.object({
    email: z.string().email(),
    phonenumbers: z.array(z.string().trim()).max(10),
});

const doctorSchema = z.object({
    designation: z.string().nullable().transform((value) => value?.trim() || null),
    registrationnumber: z.string().nullable().transform((value) => value?.trim() || null),
    startpracticedate: z.string().nullable().transform((value) => value?.trim() || null),
    registrationexpiry: z.string().nullable().transform((value) => value?.trim() || null),
    specializations: z.array(z.string().trim()).max(20),
});

const payloadSchema = z.discriminatedUnion('section', [
    z.object({ section: z.literal('basic'), data: basicSchema }),
    z.object({ section: z.literal('contact'), data: contactSchema }),
    z.object({ section: z.literal('doctor'), data: doctorSchema }),
]);

export async function PATCH(request: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = Number(currentUser.id);
    if (!Number.isFinite(userId)) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const payload = payloadSchema.parse(body);

        if (payload.section === 'basic') {
            await updateBasicProfileInfo(userId, payload.data);
        }

        if (payload.section === 'contact') {
            await updateContactProfileInfo(userId, {
                ...payload.data,
                phonenumbers: payload.data.phonenumbers.filter(Boolean),
            });
        }

        if (payload.section === 'doctor') {
            if (currentUser.role !== 'Doctor') {
                return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
            }

            await updateDoctorProfileInfo(userId, {
                ...payload.data,
                specializations: payload.data.specializations.filter(Boolean),
            });
        }

        return NextResponse.json({ message: 'Profile updated successfully' }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ message: 'Invalid request data', errors: error.issues }, { status: 400 });
        }

        console.error('Profile update failed:', error);
        return NextResponse.json({ message: 'Failed to update profile' }, { status: 500 });
    }
}
