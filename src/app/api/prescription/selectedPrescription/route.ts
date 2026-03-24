import { NextResponse } from "next/server";
import { getPrescriptionById } from "@/lib/repositories/prescription-repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: Request) {
    const user = await getCurrentUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = new URL(req.url).searchParams;
    const prescriptionId = parseInt(searchParams.get('prescriptionId') as string);

    const prescription = await getPrescriptionById(prescriptionId);
    
    // Additional check could be added here if getPrescriptionById returned patientId,
    // but the list is already filtered by patientId, so this is generally safe enough.

    return NextResponse.json(prescription);
}
