"use client";

import Link from "next/link";
import { Suspense, useMemo, useState, useEffect } from "react";
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
    Star
} from "lucide-react";

import { fetchDoctorSchedules, createPatientAppointment, fetchScheduleAvailability, getChamberPrice } from "./actions";
import { Schedule, slot } from "@/lib/repositories/appointment-repository";
import { useRouter } from "next/navigation";

type CalendarDate = {
    iso: string;
    dateNumber: number;
    monthLabel: string;
    weekdayShort: string;
    weekdayNumber: number;
    isAvailable: boolean;
    isToday: boolean;
};

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
        
        // Correctly format to local ISO date string, bypassing UTC timezone shifts
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const localIsoDate = `${year}-${month}-${day}`;

        return {
            iso: localIsoDate,
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

function BookingDoctorContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const doctorId = searchParams.get("doctorId");
    const doctorName = searchParams.get("name") ?? "Dr. Munira Zebin Kuasha";
    const specialization = searchParams.get("specialization") ?? "Dentistry";
    const hospitalName = searchParams.get("hospital") ?? "BRAC Healthcare Medical Center";
    const district = searchParams.get("district") ?? "Dhaka";
    const thana = searchParams.get("thana") ?? "Dhanmondi";
    const avgrating = searchParams.get("avgrating") ? parseFloat(searchParams.get("avgrating")!) : 0;
    const availableDaySet = useMemo(
        () => parseAvailableDays(searchParams.get("availabledays")),
        [searchParams]
    );
    const calendarDates = useMemo(() => buildCalendar(availableDaySet), [availableDaySet]);

    const firstAvailableDate = calendarDates.find((date) => date.isAvailable)?.iso ?? calendarDates[0]?.iso ?? "";

    const [selectedDate, setSelectedDate] = useState(firstAvailableDate);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [selectedScheduleId, setSelectedScheduleId] = useState<number | null>(null);
    const [feeAmount, setFeeAmount] = useState<number | string>("...");
    const [isBooking, setIsBooking] = useState(false);
    
    // State to store availability data for the currently selected schedule and date
    const [availability, setAvailability] = useState<{ slots: slot[], pendingCount: number } | null>(null);
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

    useEffect(() => {
        if (!doctorId) return;
        fetchDoctorSchedules(parseInt(doctorId, 10)).then(setSchedules);
    }, [doctorId]);

    // Fetch availability when schedule or date changes
    useEffect(() => {
        if (!selectedScheduleId || !selectedDate) {
            setAvailability(null);
            return;
        }

        let isMounted = true;
        setIsLoadingAvailability(true);

        fetchScheduleAvailability(selectedScheduleId, selectedDate)
            .then(data => {
                if (isMounted) {
                    setAvailability(data);
                }
            })
            .catch(err => console.error("Failed to fetch availability", err))
            .finally(() => {
                if (isMounted) setIsLoadingAvailability(false);
            });

        return () => {
            isMounted = false;
        };
    }, [selectedScheduleId, selectedDate]);

    useEffect(() => {
        if (!selectedScheduleId) {
            setFeeAmount("...");
            return;
        }
        let isMounted = true;
        setFeeAmount("Loading...");
        getChamberPrice(selectedScheduleId).then(price => {
            if (isMounted) setFeeAmount(price);
        }).catch(err => {
            console.error("Failed to fetch price", err);
            if (isMounted) setFeeAmount("N/A");
        });
        return () => {
            isMounted = false;
        };
    }, [selectedScheduleId]);

    const handleBooking = async () => {
        if (!doctorId || !selectedScheduleId || !selectedDate) return;
        try {
            setIsBooking(true);
            await createPatientAppointment(parseInt(doctorId, 10), selectedScheduleId, selectedDate);
            router.push('/dashboard/appointments');
        } catch (error) {
            console.error("Failed to book appointment", error);
        } finally {
            setIsBooking(false);
        }
    };

    const selectedCalendarDate = calendarDates.find((date) => date.iso === selectedDate) ?? calendarDates[0];

    const dateHeading = selectedCalendarDate
        ? fullDateFormatter.format(new Date(`${selectedCalendarDate.iso}T00:00:00`))
        : "Select a date";

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
                                <div className="flex items-center gap-3 mt-2">                                    <h2 className="text-3xl font-black leading-tight sm:text-4xl">{doctorName}</h2>                                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full text-white text-sm font-medium backdrop-blur-sm self-start mt-1">                                        <Star className="h-4 w-4 fill-current text-yellow-400" />                                        <span>{avgrating > 0 ? avgrating.toFixed(1) : "New"}</span>                                    </div>                                </div>
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

                        <div className="px-6 py-6 sm:px-8">
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
                                            setSelectedScheduleId(null);
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

                        <div className="mt-8">
                            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <p className="text-lg font-bold text-slate-900">Available Schedules</p>
                                        <p className="text-sm text-slate-500">
                                            {isDateBookable ? "Select a chamber schedule" : "No schedules available"}
                                        </p>
                                    </div>
                                    <Clock3 className="text-blue-600" size={18} />
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {isDateBookable ? (
                                        schedules
                                            .filter(s => s.week === selectedCalendarDate?.weekdayNumber)
                                            .map((schedule) => {
                                                return (
                                                    <button
                                                        key={schedule.scheduleid}
                                                        type="button"
                                                        onClick={() => setSelectedScheduleId(schedule.scheduleid)}
                                                        className={[
                                                            "flex flex-col gap-1 rounded-xl border px-4 py-3 text-left text-sm transition",
                                                            selectedScheduleId === schedule.scheduleid
                                                                ? "border-blue-600 bg-blue-600 text-white"
                                                                : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-600",
                                                        ].join(" ")}
                                                    >
                                                        <span className="font-bold text-base">{schedule.starttime} - {schedule.endtime}</span>
                                                        <span className="text-xs opacity-90">{schedule.chamberhosp}</span>
                                                        
                                                        {selectedScheduleId === schedule.scheduleid && availability && (
                                                            <div className="mt-2 pt-2 border-t border-blue-400/50 text-xs">
                                                                <p>{availability.slots.length > 0 ? "Booked slots:" : "No scheduled slots yet."}</p>
                                                                <ul className="mt-1 space-y-1">
                                                                    {availability.slots.map((slot, idx) => (
                                                                        <li key={idx}>
                                                                             {slot.starttime.substring(0,5)} - {slot.endtime.substring(0,5)}: {slot.cnt} booked
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <p className="mt-1.5 font-semibold text-blue-100">{availability.pendingCount} pending requests</p>
                                                            </div>
                                                        )}
                                                        {selectedScheduleId === schedule.scheduleid && isLoadingAvailability && (
                                                            <span className="mt-2 text-xs italic opacity-80">Loading availability...</span>
                                                        )}
                                                    </button>
                                                );
                                        })
                                    ) : (
                                        <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                            This doctor is unavailable on the selected date.
                                        </div>
                                    )}
                                    {isDateBookable && schedules.filter(s => s.week === selectedCalendarDate?.weekdayNumber).length === 0 && (
                                        <div className="col-span-full rounded-xl border border-dashed border-slate-300 bg-white px-4 py-6 text-center text-sm text-slate-500">
                                            No schedules found for this day.
                                        </div>
                                    )}
                                </div>
                            </div>
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
                                    <span className="text-slate-500">Consultation Fee</span>
                                    <span className="text-right text-lg font-black text-blue-600">BDT {feeAmount}</span>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
                                <p className="font-bold text-slate-900">Selected schedule</p>
                                <p className="mt-2">{dateHeading}</p>
                                <p className="mt-1 font-semibold text-blue-700">
                                    {selectedScheduleId
                                        ? (() => {
                                            const s = schedules.find(x => x.scheduleid === selectedScheduleId);
                                            return s ? `${s.starttime} - ${s.endtime}` : "Unknown";
                                        })()
                                        : "Choose an available schedule"}
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleBooking}
                            disabled={!selectedScheduleId || !isDateBookable || isBooking}
                            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-4 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                        >
                            <CheckCircle2 size={18} />
                            {isBooking ? "Confirming..." : "Confirm appointment request"}
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

export default function BookingDoctorPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            </div>
        }>
            <BookingDoctorContent />
        </Suspense>
    );
}
