import { NextResponse } from "next/server";
import { getSearchedPrescriptions } from "@/lib/repositories/prescription-repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const prescriptionId = searchParams.get('prescriptionId');
    const doctorname = searchParams.get('doctorname');
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');

    const doctors = await getSearchedPrescriptions({
        patientId: user.id,
        prescriptionId: prescriptionId ? parseInt(prescriptionId) : null,
        doctorname: doctorname || null,
        fromDate: fromDateStr || null,
        toDate: toDateStr || null
    });

    return NextResponse.json(doctors);
}
