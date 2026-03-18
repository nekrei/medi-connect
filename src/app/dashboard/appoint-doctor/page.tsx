"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Stethoscope, CalendarDays, LocateFixed } from "lucide-react";
import { DoctorSearchRow } from "@/lib/repositories/doctor-appointment-repository";
import LocationMap, { MapCoords, LocDetails } from "@/components/LeafletMap";

type LocationOptionRow = {
    districtname: string;
    thananame: string;
};

type Doctor = {
    id: number;
    name: string;
    degrees: string;
    specialty: string;
    district: string;
    thana: string;
    availableDay: string;
    visitTime: string;
    onLeave?: string;
};

const doctors: Doctor[] = [
    {
        id: 1,
        name: "Prof. Dr. M. Nazrul Islam",
        degrees: "MBBS, FCPS, FRCP (London), FACC, FESC",
        specialty: "Cardiology",
        district: "Dhaka",
        thana: "Dhanmondi",
        availableDay: "Sunday",
        visitTime: "10:00 AM - 01:00 PM",
    },
    {
        id: 2,
        name: "Prof. Dr. A. A. Shafi Majumder",
        degrees: "MBBS, D.Card, MD (Card), FACC",
        specialty: "Cardiology",
        district: "Dhaka",
        thana: "Dhanmondi",
        availableDay: "Monday",
        visitTime: "04:00 PM - 07:00 PM",
    },
    {
        id: 3,
        name: "Prof. Dr. Enamul Karim",
        degrees: "MBBS, FCPS (Medicine), FACP (USA)",
        specialty: "Medicine",
        district: "Dhaka",
        thana: "Uttara",
        availableDay: "Tuesday",
        visitTime: "05:00 PM - 08:00 PM",
    },
    {
        id: 4,
        name: "Dr. Rajashis Chakraborti",
        degrees: "MBBS, FCPS (Medicine), MD (Chest Diseases)",
        specialty: "Chest Medicine",
        district: "Dhaka",
        thana: "Mirpur",
        availableDay: "Wednesday",
        visitTime: "06:00 PM - 09:00 PM",
    },
    {
        id: 5,
        name: "Prof. Dr. Hasan Zahidur Rahman",
        degrees: "MBBS, MD (Neurology)",
        specialty: "Neurology",
        district: "Dhaka",
        thana: "Dhanmondi",
        availableDay: "Thursday",
        visitTime: "07:00 PM - 09:00 PM",
    },
    {
        id: 6,
        name: "Prof. Dr. Anisul Haque",
        degrees: "MBBS, Ph.D, FCPS, FRCP (Edin)",
        specialty: "Neurology",
        district: "Dhaka",
        thana: "Dhanmondi",
        availableDay: "Saturday",
        visitTime: "11:00 AM - 01:00 PM",
        onLeave: "On leave until Jun 30, 2026",
    },
    {
        id: 7,
        name: "Prof. Dr. M.T. Rahman",
        degrees: "MBBS, FCPS, Trained in France & Japan",
        specialty: "Gastroenterology",
        district: "Dhaka",
        thana: "Shantinagar",
        availableDay: "Sunday",
        visitTime: "03:00 PM - 06:00 PM",
    },
    {
        id: 8,
        name: "Dr. Faria Afsana",
        degrees: "MBBS, DEM, MD (Endocrinology), FACE",
        specialty: "Endocrine Medicine",
        district: "Dhaka",
        thana: "Uttara",
        availableDay: "Monday",
        visitTime: "06:00 PM - 08:00 PM",
    },
];

const getUnique = (items: string[]) => ["All", ...Array.from(new Set(items))];

const THANA_COORDS: Record<string, { lat: number; lng: number }> = {
    Dhanmondi: { lat: 23.7465, lng: 90.3760 },
    Uttara: { lat: 23.8759, lng: 90.3795 },
    Mirpur: { lat: 23.8103, lng: 90.3654 },
    Shantinagar: { lat: 23.7386, lng: 90.4140 },
};

const toRad = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) => {
    const earthRadiusKm = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return earthRadiusKm * c;
};

const getInitials = (name: string) => {
    const parts = name
        .replace("Prof.", "")
        .replace("Dr.", "")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (parts.length === 0) return "DR";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};


const WEEKDAY_CIRCLES = [
    { key: "Sunday", label: "S" },
    { key: "Monday", label: "M" },
    { key: "Tuesday", label: "T" },
    { key: "Wednesday", label: "W" },
    { key: "Thursday", label: "T" },
    { key: "Friday", label: "F" },
    { key: "Saturday", label: "S" },
];

const getAvailableDaySet = (availableDay: string) => {
    return new Set(
        availableDay
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
    );
};

const DayToNumberMap: Record<string, number> = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

export default function AppointDoctorPage() {
    const [query, setQuery] = useState("");
    const [district, setDistrict] = useState("All");
    const [thana, setThana] = useState("All");
    const [specialty, setSpecialty] = useState("All");
    const [day, setDay] = useState("All");
    const [isLocating, setIsLocating] = useState(false);
    const [isLoadingLocations, setIsLoadingLocations] = useState(false);
    const [locationMessage, setLocationMessage] = useState("");
    const [locationOptions, setLocationOptions] = useState<LocationOptionRow[]>([]);
    const [specialtyOptionsData, setSpecialtyOptionsData] = useState<string[]>([]);
    const [filteredDoctors, setFilteredDoctors] = useState<DoctorSearchRow[]>([]);
    const [currentLocation, setCurrentLocation] = useState<MapCoords>({
        lat: 23.8103,
        lng: 90.3654,
    });

    useEffect(() => {
        let isMounted = true;

        async function loadLocationOptions() {
            try {
                setIsLoadingLocations(true);
                const response = await fetch('/api/locations/options', { cache: 'no-store' });
                if (!response.ok) {
                    return;
                }
                const json = (await response.json()) as { data?: LocationOptionRow[] };
                if (isMounted) {
                    setLocationOptions(json.data ?? []);
                }
            } catch {
                if (isMounted) {
                    setLocationOptions([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoadingLocations(false);
                }
            }
        }

        async function loadSpecialtyOptions() {
            try {
                const response = await fetch('/api/specializations/options', { cache: 'no-store' });
                if (!response.ok) {
                    return [];
                }
                const json = (await response.json()) as { data?: string[] };

                if (isMounted) {
                    setSpecialtyOptionsData(json.data ?? []);
                }
            } catch {
                if (isMounted) {
                    setLocationOptions([]);
                }
            } finally {

            }
        }

        loadLocationOptions();
        loadSpecialtyOptions();



        return () => {
            isMounted = false;
        };
    }, []);

    const districtOptions = useMemo(() => {
        const districts = Array.from(new Set(locationOptions.map((row) => row.districtname)));
        return ["All", ...districts.sort()];
    }, [locationOptions]);

    const thanaOptions = useMemo(() => {
        if (district === "All") {
            return ["All"];
        }

        const thanas = locationOptions
            .filter((row) => row.districtname === district)
            .map((row) => row.thananame);

        return ["All", ...Array.from(new Set(thanas)).sort()];
    }, [district, locationOptions]);



    const specialtyOptions = useMemo(
        () => getUnique(specialtyOptionsData),
        [specialtyOptionsData]
    );
    const dayOptions = useMemo(() => getUnique(doctors.map((d) => d.availableDay)), []);

    useEffect(() => {
        async function fetchDoctors() {
            const params = new URLSearchParams();
            const name = query.trim().toLowerCase();

            if (name) params.set("name", name);
            if (district && district !== "All") params.set("district", district);
            if (thana && thana !== "All") params.set("thana", thana);
            if (specialty && specialty !== "All") params.set("specialization", specialty);
            if (day && day !== "All") params.set("availableDay", String(DayToNumberMap[day]));

            try {
                const response = await fetch(`/api/doctors?${params.toString()}`, { cache: 'no-store' });
                if (!response.ok) {
                    setFilteredDoctors([]);
                    return;
                }
                const doctors = await response.json();
                setFilteredDoctors(doctors);
            } catch {
                setFilteredDoctors([]);
            }
        }
        fetchDoctors();
    }, [query, district, thana, specialty, day]);

    const handleFindNearYou = () => {
        if (!("geolocation" in navigator)) {
            setLocationMessage("Geolocation is not supported on this browser.");
            return;
        }

        setIsLocating(true);
        setLocationMessage("Detecting your current location...");

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;

                // Update map location
                setCurrentLocation({ lat: latitude, lng: longitude });

                const nearestThana = Object.entries(THANA_COORDS).reduce(
                    (closest, [name, coords]) => {
                        const distance = getDistanceKm(latitude, longitude, coords.lat, coords.lng);

                        if (distance < closest.distance) {
                            return { name, distance };
                        }
                        return closest;
                    },
                    { name: "Dhanmondi", distance: Number.POSITIVE_INFINITY }
                );

                setDistrict("Dhaka");
                setThana(nearestThana.name);
                setIsLocating(false);
                setLocationMessage(`Nearest location selected: ${nearestThana.name}, Dhaka`);
            },
            () => {
                setIsLocating(false);
                setLocationMessage("Could not access your location. Please allow permission.");
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    // Convert filtered doctors to map details
    const doctorMapDetails = useMemo(() => {
        const detailsMap: Record<string, LocDetails> = {};

        filteredDoctors.forEach((doctor) => {
            const coords = THANA_COORDS[doctor.thana];
            if (coords && !detailsMap[doctor.thana]) {
                detailsMap[doctor.thana] = {
                    name: doctor.thana,
                    lat: coords.lat,
                    lng: coords.lng,
                    address: `${doctor.thana}, ${doctor.district}`,
                };
            }
        });

        return Object.values(detailsMap);
    }, [filteredDoctors]);

    return (
        <main className="min-h-screen bg-slate-50">
            <section className="border-b border-blue-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <p className="text-sm font-semibold uppercase tracking-[0.14em] text-blue-600">
                        Our Expert Consultants
                    </p>
                    <h1 className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                        Find and appoint doctors
                    </h1>
                    <p className="mt-3 max-w-3xl text-slate-600">
                        Search by doctor name, specialization, district, thana, and day to
                        quickly book an appointment with the right specialist.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={handleFindNearYou}
                            disabled={isLocating}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <LocateFixed size={16} />
                            {isLocating ? "Finding nearby doctors..." : "Find Doctors Near You"}
                        </button>

                        {locationMessage ? (
                            <p className="text-sm text-slate-500">{locationMessage}</p>
                        ) : null}
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5">
                        <label className="relative">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Search Doctor
                            </span>
                            <Search
                                className="pointer-events-none absolute left-3 top-[38px] text-slate-400"
                                size={18}
                            />
                            <input
                                value={query}
                                onChange={(event) => setQuery(event.target.value)}
                                placeholder="Name or specialty"
                                className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm outline-none ring-blue-200 transition focus:ring"
                            />
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                District
                            </span>
                            <select
                                value={district}
                                onChange={(event) => {
                                    setDistrict(event.target.value);
                                    setThana("All");
                                }}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                {districtOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Thana
                            </span>
                            <select
                                value={thana}
                                onChange={(event) => setThana(event.target.value)}
                                disabled={isLoadingLocations}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                {thanaOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Specialization
                            </span>
                            <select
                                value={specialty}
                                onChange={(event) => setSpecialty(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                {specialtyOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label>
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Available Day
                            </span>
                            <select
                                value={day}
                                onChange={(event) => setDay(event.target.value)}
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-blue-200 transition focus:ring"
                            >
                                {dayOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
                {/* Map Container */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div style={{ height: "400px", width: "100%" }}>
                        <LocationMap base={currentLocation} details={doctorMapDetails} />
                    </div>
                </div>

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredDoctors.length}</span>{" "}
                        consultant{filteredDoctors.length === 1 ? "" : "s"}
                    </p>
                    <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Back to Dashboard
                    </Link>
                </div>

                <div className="space-y-4">
                    {filteredDoctors.length === 0 ? (
                        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                            No doctors found for the selected filters.
                        </div>
                    ) : (
                        filteredDoctors.map((doctor, index) => (
                            <article
                                key={`${doctor.name}-${index}`}
                                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-6"
                            >
                                <div className="grid gap-4 md:grid-cols-[88px_1fr_auto] md:items-center md:gap-5">
                                    <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white shadow-sm">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                                            {getInitials(doctor.name)}
                                        </div>
                                    </div>

                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
                                        <p className="mt-1 text-sm text-slate-500">{doctor.hospital}</p>

                                        <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                            <p className="inline-flex items-center gap-2">
                                                <Stethoscope size={16} className="text-blue-600" />
                                                <span>Specialty: {Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization}</span>
                                            </p>
                                            <p className="inline-flex items-center gap-2">
                                                <MapPin size={16} className="text-blue-600" />
                                                <span>Location: {doctor.thana}, {doctor.district}</span>
                                            </p>
                                            <p className="inline-flex items-center gap-2 sm:col-span-2">
                                                <CalendarDays size={16} className="text-blue-600" />
                                                <span className="flex items-center gap-1.5">
                                                    {WEEKDAY_CIRCLES.map((weekday, index) => {
                                                        const activeDays = new Set(doctor.availabledays ?? []);
                                                        const isActive = activeDays.has(DayToNumberMap[weekday.key]);

                                                        return (
                                                            <span
                                                                key={`${weekday.key}-${index}`}
                                                                className={[
                                                                    "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold",
                                                                    isActive
                                                                        ? "bg-blue-600 text-white"
                                                                        : "border border-slate-300 bg-white text-slate-500",
                                                                ].join(" ")}
                                                                title={weekday.key}
                                                            >
                                                                {weekday.label}
                                                            </span>
                                                        );
                                                    })}
                                                </span>
                                            </p>
                                        </div>

                                    </div>

                                    <div className="md:justify-self-end">
                                        <Link
                                            href={{
                                                pathname: "/appointment/booking-doctor",
                                                query: {
                                                    name: doctor.name,
                                                    hospital: doctor.hospital,
                                                    specialization: Array.isArray(doctor.specialization)
                                                        ? doctor.specialization.join(", ")
                                                        : doctor.specialization,
                                                    district: doctor.district,
                                                    thana: doctor.thana,
                                                    availabledays: (doctor.availabledays ?? []).join(","),
                                                },
                                            }}
                                            className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 md:w-auto"
                                        >
                                            Appoint Now
                                        </Link>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </section>
        </main>
    );
}
