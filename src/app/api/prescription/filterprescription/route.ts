import { NextResponse } from "next/server";
import { getSearchedPrescriptions } from "@/lib/repositories/prescription-repository";
export async function GET(req: Request) {
    const searchParams = new URL(req.url).searchParams;
    const prescriptionId = searchParams.get('prescriptionId');
    const doctorname = searchParams.get('doctorname');
    const fromDateStr = searchParams.get('fromDate');
    const toDateStr = searchParams.get('toDate');

    const doctors = await getSearchedPrescriptions({
        prescriptionId: prescriptionId ? parseInt(prescriptionId) : null,
        doctorname: doctorname || null,
        fromDate: fromDateStr ? new Date(fromDateStr) : null,
        toDate: toDateStr ? new Date(toDateStr) : null
    });

    return NextResponse.json(doctors);
}
