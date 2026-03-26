import { NextRequest, NextResponse } from "next/server";
import { searchDoctors } from "@/lib/repositories/doctor-appointment-repository";
import { getCurrentUser } from "@/lib/auth/current-user";
export async function GET(req: Request) {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    const searchParams = new URL(req.url).searchParams;
    const name = searchParams.get("name") || "";
    const district = searchParams.get("district") || "";
    const thana = searchParams.get("thana") || "";
    const specialization = searchParams.get("specialization") || "";
    const availableDay = searchParams.get("availableDay") || "";

    const doctors = await searchDoctors({
        name: name,
        district: district || null,
        thana: thana || null,
        specialization: specialization || null,
        availableDay: availableDay || null
    });

    return NextResponse.json(doctors);
}

// parameters: name , district ,thana ,specialization, available day