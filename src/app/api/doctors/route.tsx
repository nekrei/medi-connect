import { NextRequest, NextResponse } from "next/server";
import { searchDoctors } from "@/lib/repositories/doctor-appointment-repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const doctors = await searchDoctors();

    return NextResponse.json(doctors);
}

// parameters: name , district ,thana ,specialization, available day