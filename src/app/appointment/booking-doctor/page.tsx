"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Hospital,
    MapPin,
    ShieldCheck,
    Stethoscope,
    UserRound,
} from "lucide-react";

type CalendarDate = {
    iso: string;
    dateNumber: number;
    monthLabel: string;
    weekdayShort: string;
    weekdayNumber: number;
    isAvailable: boolean;
    isToday: boolean;
};

const PATIENT_TYPES = ["New Patient", "Follow-up Patient"];
const CONSULTATION_TYPES = ["First Visit", "Report Review", "Second Opinion"];
const MORNING_SLOTS = ["09:00 AM", "09:30 AM", "10:15 AM", "11:00 AM"];
const EVENING_SLOTS = ["05:00 PM", "05:30 PM", "06:15 PM", "07:00 PM"];

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "short" });
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });
const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
});

function parseAvailableDays(rawValue: string | null) {
    if (!rawValue) {
        return new Set([0, 1, 3, 5]);
    }

    const values = rawValue
        .split(",")
        .map((value) => Number.parseInt(value, 10))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 6);

    return new Set(values.length > 0 ? values : [0, 1, 3, 5]);
}

function buildCalendar(availableDays: Set<number>) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 21 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() + index);

        return {
            iso: date.toISOString().split("T")[0],
            dateNumber: date.getDate(),
            monthLabel: monthFormatter.format(date),
            weekdayShort: weekdayFormatter.format(date),
            weekdayNumber: date.getDay(),
            isAvailable: availableDays.has(date.getDay()),
            isToday: index === 0,
        } satisfies CalendarDate;
    });
}

function getInitials(name: string) {
    const parts = name.split(" ").filter(Boolean);

    if (parts.length === 0) {
        return "DR";
    }

    return parts
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export default function BookingDoctorPage() {
    const searchParams = useSearchParams();

    const doctorName = searchParams.get("name") ?? "Dr. Munira Zebin Kuasha";
    const specialization = searchParams.get("specialization") ?? "Dentistry";
    const hospitalName = searchParams.get("hospital") ?? "BRAC Healthcare Medical Center";
    const district = searchParams.get("district") ?? "Dhaka";
    const thana = searchParams.get("thana") ?? "Dhanmondi";
    const availableDaySet = useMemo(
        () => parseAvailableDays(searchParams.get("availabledays")),
        [searchParams]
    );
    const calendarDates = useMemo(() => buildCalendar(availableDaySet), [availableDaySet]);

    const firstAvailableDate = calendarDates.find((date) => date.isAvailable)?.iso ?? calendarDates[0]?.iso ?? "";

    const [patientType, setPatientType] = useState(PATIENT_TYPES[0]);
    const [consultationType, setConsultationType] = useState(CONSULTATION_TYPES[0]);
    const [selectedDate, setSelectedDate] = useState(firstAvailableDate);
    const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

    const selectedCalendarDate = calendarDates.find((date) => date.iso === selectedDate) ?? calendarDates[0];

    const dateHeading = selectedCalendarDate
        ? fullDateFormatter.format(new Date(`${selectedCalendarDate.iso}T00:00:00`))
        : "Select a date";

    const feeAmount = consultationType === "Second Opinion" ? "1,500" : consultationType === "Report Review" ? "900" : "1,200";
    const isDateBookable = Boolean(selectedCalendarDate?.isAvailable);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_30%),linear-gradient(180deg,#eff6ff_0%,#f8fafc_42%,#ffffff_100%)] text-slate-900">
            <section className="border-b border-blue-100/80 bg-white/80 backdrop-blur">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-blue-600">MediConnect</p>
                        <h1 className="mt-1 text-xl font-extrabold sm:text-2xl">Doctor appointment booking</h1>
                    </div>

                    <Link
                        href="/dashboard/appoint-doctor"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-600"
                    >
                        <ArrowLeft size={16} />
                        Back to doctor list
                    </Link>
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1.4fr_0.8fr] lg:px-8 lg:py-10">
                <div className="space-y-6">
                    <div className="overflow-hidden rounded-[28px] border border-blue-100 bg-white shadow-[0_24px_70px_-35px_rgba(15,23,42,0.28)]">
                        <div className="grid gap-6 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 px-6 py-8 text-white sm:px-8 lg:grid-cols-[auto_1fr] lg:items-center">
                            <div className="flex h-24 w-24 items-center justify-center rounded-[24px] bg-white/15 text-3xl font-black backdrop-blur-sm">
                                {getInitials(doctorName)}
                            </div>

                            <div>
                                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                                    {specialization.split(",")[0] || "Specialist care"}
                                </p>
                                <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{doctorName}</h2>
                                <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-50 sm:text-base">
                                    Book a structured in-person consultation with a verified MediConnect specialist. Select your preferred appointment type, choose a convenient date, and confirm an available chamber slot.
                                </p>

                                <div className="mt-5 flex flex-wrap gap-3 text-sm text-white/95">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur-sm">
                                        <Stethoscope size={16} />
                                        {specialization}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur-sm">
                                        <Hospital size={16} />
                                        {hospitalName}
                                    </span>
                                    <span className="inline-flex items-center gap-2 rounded-full bg-white/12 px-4 py-2 backdrop-blur-sm">
                                        <MapPin size={16} />
                                        {thana}, {district}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 px-6 py-6 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-500">Consultation setup</p>
                                <div className="mt-5 space-y-5">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Patient Type</p>
                                        <div className="mt-3 flex flex-wrap gap-3">
                                            {PATIENT_TYPES.map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setPatientType(option)}
                                                    className={[
                                                        "rounded-full border px-4 py-2 text-sm font-semibold transition",
                                                        patientType === option
                                                            ? "border-blue-600 bg-blue-600 text-white"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:text-blue-600",
                                                    ].join(" ")}
                                                >
                                                    {option}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-slate-700">Consultation Type</p>
                                        <div className="mt-3 grid gap-3 sm:grid-cols-3">
                                            {CONSULTATION_TYPES.map((option) => (
                                                <button
                                                    key={option}
                                                    type="button"
                                                    onClick={() => setConsultationType(option)}
                                                    className={[
                                                        "rounded-2xl border px-4 py-4 text-left text-sm transition",
                                                        consultationType === option
                                                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-600 hover:border-blue-200",
                                                    ].join(" ")}
                                                >
                                                    <span className="block font-bold">{option}</span>
                                                    <span className="mt-1 block text-xs text-slate-500">
                                                        {option === "First Visit"
                                                            ? "Complete chamber assessment"
                                                            : option === "Report Review"
                                                                ? "Short follow-up review"
                                                                : "Detailed specialist review"}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
                                <p className="text-sm font-bold uppercase tracking-[0.16em] text-blue-700">Consultation details</p>
                                <div className="mt-5 space-y-4 text-sm text-slate-700">
                                    <div className="flex items-start gap-3">
                                        <CalendarDays className="mt-0.5 text-blue-600" size={18} />
                                        <div>
                                            <p className="font-semibold text-slate-900">Selected Date</p>
                                            <p>{dateHeading}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <UserRound className="mt-0.5 text-blue-600" size={18} />
                                        <div>
                                            <p className="font-semibold text-slate-900">Patient Category</p>
                                            <p>{patientType}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="mt-0.5 text-blue-600" size={18} />
                                        <div>
                                            <p className="font-semibold text-slate-900">Estimated Fee</p>
                                            <p>BDT {feeAmount}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Schedule</p>
                                <h3 className="mt-2 text-2xl font-black text-slate-900">Select a time slot to book</h3>
                                <p className="mt-2 text-sm text-slate-500">Choose a date first. Available days are highlighted based on the doctor’s chamber schedule.</p>
                            </div>

                            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-600">
                                <ChevronLeft size={16} />
                                {selectedCalendarDate?.monthLabel} {selectedCalendarDate ? new Date(`${selectedCalendarDate.iso}T00:00:00`).getFullYear() : new Date().getFullYear()}
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7 xl:grid-cols-7">
                            {calendarDates.map((date) => {
                                const isSelected = date.iso === selectedDate;

                                return (
                                    <button
                                        key={date.iso}
                                        type="button"
                                        onClick={() => {
                                            setSelectedDate(date.iso);
                                            setSelectedSlot(null);
                                        }}
                                        className={[
                                            "rounded-2xl border px-3 py-4 text-left transition",
                                            isSelected
                                                ? "border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-200"
                                                : date.isAvailable
                                                    ? "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:bg-blue-50"
                                                    : "border-slate-100 bg-slate-50 text-slate-400",
                                        ].join(" ")}
                                    >
                                        <span className="block text-xs font-bold uppercase tracking-[0.16em]">
                                            {date.weekdayShort}
                                        </span>
                                        <span className="mt-3 block text-2xl font-black">{date.dateNumber}</span>
                                        <span className="mt-1 block text-xs font-medium">
                                            {date.monthLabel} {date.isToday ? "• Today" : ""}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-8 grid gap-4 lg:grid-cols-2">
                            {[
                                { title: "Morning", slots: MORNING_SLOTS },
                                { title: "Evening", slots: EVENING_SLOTS },
                            ].map((period) => (
                                <div key={period.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-lg font-bold text-slate-900">{period.title}</p>
                                            <p className="text-sm text-slate-500">
                                                {isDateBookable ? `${period.slots.length} slots available` : "No slot available"}
                                            </p>
                                        </div>
                                        <Clock3 className="text-blue-600" size={18} />
                                    </div>

                                    <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                                        {isDateBookable ? (
                                            period.slots.map((slot) => {
                                                const slotValue = `${selectedDate}-${period.title}-${slot}`;

                                                return (
                                                    <button
                                                        key={slotValue}
                                                        type="button"
                                                        onClick={() => setSelectedSlot(slotValue)}
                                                        className={[
                                                            "rounded-xl border px-3 py-3 text-sm font-semibold transition",
                                                            selectedSlot === slotValue
                                                                ? "border-blue-600 bg-blue-600 text-white"
                                                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600",
                                                        ].join(" ")}
                                                    >
                                                        {slot}
                                                    </button>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                                This doctor is unavailable on the selected date.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
                    <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Booking summary</p>
                        <div className="mt-5 space-y-4 text-sm text-slate-600">
                            <div className="rounded-2xl bg-slate-50 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Doctor</p>
                                <p className="mt-2 text-lg font-bold text-slate-900">{doctorName}</p>
                                <p className="mt-1">{specialization}</p>
                            </div>

                            <div className="space-y-3 rounded-2xl border border-slate-200 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-500">Hospital</span>
                                    <span className="text-right font-semibold text-slate-900">{hospitalName}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-500">Location</span>
                                    <span className="text-right font-semibold text-slate-900">{thana}, {district}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-500">Visit Type</span>
                                    <span className="text-right font-semibold text-slate-900">{consultationType}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-500">Patient Type</span>
                                    <span className="text-right font-semibold text-slate-900">{patientType}</span>
                                </div>
                                <div className="flex items-start justify-between gap-3">
                                    <span className="text-slate-500">Consultation Fee</span>
                                    <span className="text-right text-lg font-black text-blue-600">BDT {feeAmount}</span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
                                <p className="font-bold text-slate-900">Selected schedule</p>
                                <p className="mt-2">{dateHeading}</p>
                                <p className="mt-1 font-semibold text-blue-700">
                                    {selectedSlot ? selectedSlot.split("-").slice(-2).join(" ") : "Choose an available time slot"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            disabled={!selectedSlot || !isDateBookable}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <CheckCircle2 size={18} />
                            Confirm appointment request
                        </button>
                    </div>

                    <div className="rounded-[28px] border border-blue-100 bg-white p-6 shadow-sm">
                        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600">Before you continue</p>
                        <ul className="mt-4 space-y-3 text-sm text-slate-600">
                            <li className="rounded-2xl bg-slate-50 px-4 py-3">Bring previous prescriptions or test reports for review.</li>
                            <li className="rounded-2xl bg-slate-50 px-4 py-3">Arrive at least 15 minutes early for chamber registration.</li>
                            <li className="rounded-2xl bg-slate-50 px-4 py-3">You can return to the doctor list and choose another specialist at any time.</li>
                        </ul>
                    </div>
                </aside>
            </section>
        </main>
    );
}