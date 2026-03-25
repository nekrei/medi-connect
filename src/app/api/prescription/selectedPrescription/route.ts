import { NextResponse } from "next/server";
import { getPrescriptionById } from "@/lib/repositories/prescription-repository";
import { getCurrentUser } from "@/lib/auth/current-user";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const searchParams = new URL(req.url).searchParams;
        const prescriptionIdParam = searchParams.get('prescriptionId');
        
        if (!prescriptionIdParam) {
            return NextResponse.json({ error: "Missing prescriptionId" }, { status: 400 });
        }

        const prescriptionId = parseInt(prescriptionIdParam);

        console.log(`Fetching prescription API, ID: ${prescriptionId} by user: ${user.id}`);
        const prescription = await getPrescriptionById(prescriptionId);
        
        if (!prescription) {
            console.warn(`Prescription ID ${prescriptionId} not found`);
            return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
        }

        return NextResponse.json(prescription);
    } catch (error) {
        console.error("Error in /api/prescription/selectedPrescription API route:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
