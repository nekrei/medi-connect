import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import AddChamberClient from "./add-chamber-client";

export default async function AddChamberPage() {
    const user = await getCurrentUser();
    
    if (!user || (user.role !== "Doctor" && user.role !== "Admin")) {
        redirect("/dashboard");
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-800 mb-6">Add New Chamber</h1>
            <AddChamberClient doctorId={parseInt(user.id)} />
        </div>
    );
}
