"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Hospital = {
    hospitalid: number;
    hospitalname: string;
    address: string;
};

type ChamberSchedule = {
    weekday: string;
    startTime: string;
    endTime: string;
};

export default function AddChamberClient({ doctorId }: { doctorId: number }) {
    const router = useRouter();
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [hospitalId, setHospitalId] = useState<number | "">("");
    const [cuprice, setCuprice] = useState("");
    const [appcontact, setAppcontact] = useState("");
    
    const [schedules, setSchedules] = useState<ChamberSchedule[]>([
        { weekday: "Monday", startTime: "09:00", endTime: "17:00" }
    ]);
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetch("/api/doctor/hospitals")
            .then((res) => res.json())
            .then((data) => setHospitals(data))
            .catch((err) => console.error("Error fetching hospitals:", err));
    }, []);

    const addSchedule = () => {
        setSchedules([...schedules, { weekday: "Monday", startTime: "09:00", endTime: "17:00" }]);
    };

    const updateSchedule = (index: number, field: keyof ChamberSchedule, value: string) => {
        const newSchedules = [...schedules];
        newSchedules[index][field] = value;
        setSchedules(newSchedules);
    };

    const removeSchedule = (index: number) => {
        const newSchedules = schedules.filter((_, i) => i !== index);
        setSchedules(newSchedules);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (hospitalId === "") {
            setError("Please select a hospital");
            return;
        }

        if (schedules.length === 0) {
            setError("Please add at least one schedule");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await fetch("/api/doctor/chambers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    doctorId,
                    hospitalId: Number(hospitalId),
                    cuprice: Number(cuprice),
                    appcontact,
                    chamberSchedules: schedules
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || "Failed to add chamber");
            }

            router.push("/dashboard/doctor-appointments"); // or simply some success state / toast
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 p-6 max-w-3xl">
            {error && (
                <div className="mb-6 rounded-md bg-red-50 p-4 text-red-600">
                    {error}
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                        Select Hospital
                    </label>
                    <select
                        required
                        value={hospitalId}
                        onChange={(e) => setHospitalId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                    >
                        <option value="">-- Choose a hospital --</option>
                        {hospitals.map((h) => (
                            <option key={h.hospitalid} value={h.hospitalid}>
                                {h.hospitalname} ({h.address})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Consultation Fee
                        </label>
                        <input
                            type="number"
                            required
                            min="0"
                            value={cuprice}
                            onChange={(e) => setCuprice(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="e.g. 500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Appointment Contact
                        </label>
                        <input
                            type="text"
                            required
                            value={appcontact}
                            onChange={(e) => setAppcontact(e.target.value)}
                            className="w-full rounded-lg border border-slate-300 p-2.5 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                            placeholder="e.g. 01XXXXXXXXX"
                        />
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-slate-800">Schedules</h3>
                        <button
                            type="button"
                            onClick={addSchedule}
                            className="text-sm rounded-lg bg-blue-50 text-blue-600 px-3 py-1.5 font-medium hover:bg-blue-100 transition"
                        >
                            + Add Schedule
                        </button>
                    </div>

                    <div className="space-y-4">
                        {schedules.map((schedule, index) => (
                            <div key={index} className="flex gap-4 items-center bg-slate-50 p-4 rounded-lg border border-slate-100">
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Day</label>
                                    <select
                                        value={schedule.weekday}
                                        onChange={(e) => updateSchedule(index, "weekday", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 p-2 outline-none focus:border-blue-600"
                                    >
                                        {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={schedule.startTime}
                                        onChange={(e) => updateSchedule(index, "startTime", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 p-2 outline-none focus:border-blue-600"
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-medium text-slate-500 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={schedule.endTime}
                                        onChange={(e) => updateSchedule(index, "endTime", e.target.value)}
                                        className="w-full rounded-md border border-slate-300 p-2 outline-none focus:border-blue-600"
                                    />
                                </div>
                                {schedules.length > 1 && (
                                    <div className="pt-5">
                                        <button
                                            type="button"
                                            onClick={() => removeSchedule(index)}
                                            className="text-red-500 hover:text-red-700 p-2"
                                            title="Remove"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-200">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full lg:w-auto rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                    >
                        {loading ? "Saving..." : "Save Chamber"}
                    </button>
                </div>
            </form>
        </div>
    );
}
