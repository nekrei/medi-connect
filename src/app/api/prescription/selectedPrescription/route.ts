import { NextResponse } from "next/server";
import { getPrescriptionById } from "@/lib/repositories/prescription-repository";
export async function GET(req: Request) {
    const searchParams = new URL(req.url).searchParams;
    const prescriptionId = parseInt(searchParams.get('prescriptionId') as string);

    const prescription = await getPrescriptionById(prescriptionId);

    return NextResponse.json(prescription);
}
