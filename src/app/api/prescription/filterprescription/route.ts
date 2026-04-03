import { NextResponse } from "next/server";
import { getSearchedPrescriptions } from "@/lib/repositories/prescription-repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET() {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prescriptions = await getSearchedPrescriptions({
        patientId: user.id,
    });

    return NextResponse.json(prescriptions);
}
