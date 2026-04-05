"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, MapPin, Stethoscope, CalendarDays, LocateFixed, Star, ChevronDown, ChevronUp, Building } from "lucide-react";
import { DoctorSearchRow } from "@/lib/repositories/doctor-appointment-repository";
import dynamic from "next/dynamic";
import type { MapCoords, LocDetails } from "@/components/LeafletMap";

const LocationMap = dynamic(() => import("@/components/LeafletMap"), {
    ssr: false,
});

type LocationOptionRow = {
    districtname: string;
    thananame: string;
};


const getUnique = (items: string[]) => ["All", ...Array.from(new Set(items)).sort()];

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
    const [doctors, setDoctors] = useState<DoctorSearchRow[]>([]);
    const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
    const [filteredDoctors, setFilteredDoctors] = useState<DoctorSearchRow[]>([]);
    const [currentLocation, setCurrentLocation] = useState<MapCoords>({
        lat: 23.8103,
        lng: 90.3654,
    });
    
    const [expandedDoctors, setExpandedDoctors] = useState<Record<number, boolean>>({});

    const toggleDoctor = (doctorId: number) => {
        setExpandedDoctors((prev) => ({
            ...prev,
            [doctorId]: !prev[doctorId],
        }));
    };

    useEffect(() => {
        let isMounted = true;

        async function loadDoctors() {
            try {
                setIsLoadingDoctors(true);
                const response = await fetch(`/api/doctors`, { cache: 'no-store' });
                if (!response.ok) {
                    console.error("Failed to fetch doctors:", response.statusText);
                    if (isMounted) {
                        setDoctors([]);
                    }
                    return;
                }
                const doctors = await response.json();
                if (isMounted) {
                    setDoctors(doctors);
                }
            } catch {
                if (isMounted) setDoctors([]);
            } finally {
                if (isMounted) setIsLoadingDoctors(false);
            }
        }

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
                    return;
                }
                const json = (await response.json()) as { data?: string[] };

                if (isMounted) {
                    setSpecialtyOptionsData(json.data ?? []);
                }
            } catch {
                if (isMounted) {
                    setSpecialtyOptionsData([]);
                }
            } finally {

            }
        }

        loadLocationOptions();
        loadSpecialtyOptions();
        loadDoctors();

        return () => {
            isMounted = false;
        };
    }, []);

    // Loading the filter options
    const districtOptions = useMemo(() => {
        const districts = locationOptions.map((row) => row.districtname);
        return [...getUnique(districts)];
    }, [locationOptions]);

    const thanaOptions = useMemo(() => {
        if (district === "All") {
            return ["All"];
        }

        const thanas = locationOptions
            .filter((row) => row.districtname === district)
            .map((row) => row.thananame);

        return [...getUnique(thanas)];
    }, [district, locationOptions]);

    const specialtyOptions = useMemo(
        () => getUnique(specialtyOptionsData),
        [specialtyOptionsData]
    );

    const dayOptions = useMemo(() => getUnique(WEEKDAY_CIRCLES.map((row) => row.key)), []);

    useEffect(() => {
        async function fetchDoctors() {
            const name = query.trim().toLowerCase();

            setFilteredDoctors(
                doctors.filter((row) => {
                    return (!name || row.name.toLowerCase().includes(name))
                        && (!district || district === 'All' || row.district === district)
                        && (!thana || thana === 'All' || row.thana === thana)
                        && (!specialty || specialty === 'All' || row.specialization === specialty)
                        && (!day || day === 'All' || row.availabledays?.includes(DayToNumberMap[day]));
                })
            )

        }
        fetchDoctors();
    }, [doctors, query, district, thana, specialty, day]);


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

    const groupedDoctors = useMemo(() => {
        const groups: Record<number, DoctorSearchRow[]> = {};
        for (const doc of filteredDoctors) {
            if (!groups[doc.doctorid]) {
                groups[doc.doctorid] = [];
            }
            groups[doc.doctorid].push(doc);
        }
        return Object.values(groups);
    }, [filteredDoctors]);

    // Convert filtered doctors to map details
    const doctorMapDetails = useMemo(() => {
        const detailsArray: LocDetails[] = [];

        filteredDoctors.forEach((doctor) => {
            const coords = THANA_COORDS[doctor.thana];
            if (coords) {
                const latOffset = (Math.random() - 0.5) * 0.005;
                const lngOffset = (Math.random() - 0.5) * 0.005;
                detailsArray.push({
                    name: doctor.name,
                    lat: coords.lat + latOffset,
                    lng: coords.lng + lngOffset,
                    address: doctor.hospital,
                });
            }
        });

        return detailsArray;
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

            <section className="mx-auto max-w-7xl px-4 pb-3 py-5 sm:px-6 lg:px-8">
                {/* Map Container */}
                <div className="mb-8 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <div style={{ height: "300px", width: "100%" }}>
                        <LocationMap base={currentLocation} details={doctorMapDetails} />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
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

                <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{groupedDoctors.length}</span>{" "}
                        consultant{groupedDoctors.length === 1 ? "" : "s"}
                    </p>
                    <Link href="/dashboard" className="text-sm font-medium text-blue-600 hover:text-blue-700">
                        Back to Dashboard
                    </Link>
                </div>

                <div className="space-y-4">
                    {
                        isLoadingDoctors ? (
                            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                                Loading doctors...
                            </div>
                        ) :
                            groupedDoctors.length === 0 ? (
                                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                                    No doctors found for the selected filters.
                                </div>
                            ) : (
                                groupedDoctors.map((chambers, index) => {
                                    const doctor = chambers[0];
                                    const isExpanded = expandedDoctors[doctor.doctorid] || false;

                                    return (
                                        <article
                                            key={`${doctor.doctorid}-${index}`}
                                            className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-blue-200 hover:shadow-md"
                                        >
                                            <div 
                                                className="grid cursor-pointer gap-4 p-5 md:grid-cols-[88px_1fr_auto] md:items-center md:gap-5 sm:p-6"
                                                onClick={() => toggleDoctor(doctor.doctorid)}
                                            >
                                                <div className="flex h-[88px] w-[88px] items-center justify-center rounded-2xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white shadow-sm">
                                                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-lg font-bold text-white">
                                                        {getInitials(doctor.name)}
                                                    </div>
                                                </div>

                                                <div>
                                                    <div className="flex items-center justify-between">
                                                        <h2 className="text-xl font-bold text-slate-900">{doctor.name}</h2>
                                                        <div className="flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-sm font-semibold text-amber-600 border border-amber-200">
                                                            <Star className="fill-amber-500 text-amber-500" size={14} />
                                                            <span>{doctor.avgrating > 0 ? doctor.avgrating.toFixed(1) : "New"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                                                        <p className="inline-flex items-center gap-2">
                                                            <Stethoscope size={16} className="text-blue-600" />
                                                            <span>Specialty: {Array.isArray(doctor.specialization) ? doctor.specialization.join(", ") : doctor.specialization}</span>
                                                        </p>
                                                        <p className="inline-flex items-center gap-2">
                                                            <Building size={16} className="text-blue-600" />
                                                            <span>{chambers.length} Chamber{chambers.length > 1 ? "s" : ""}</span>
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end pr-2 text-slate-400">
                                                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                                </div>
                                            </div>

                                            {isExpanded && (
                                                <div className="border-t border-slate-100 bg-slate-50 p-5 sm:p-6 space-y-4">
                                                    {chambers.map((chamber, cIndex) => (
                                                        <div key={`${chamber.doctorid}-${cIndex}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                                            <div>
                                                                <h3 className="font-semibold text-slate-900">{chamber.hospital}</h3>
                                                                <p className="inline-flex flex-wrap items-center gap-2 mt-1 text-sm text-slate-600">
                                                                    <MapPin size={16} className="text-blue-600" />
                                                                    <span>Location: {chamber.thana}, {chamber.district}</span>
                                                                </p>
                                                                <div className="mt-2 flex items-center gap-2 sm:col-span-2">
                                                                    <CalendarDays size={16} className="text-blue-600" />
                                                                    <span className="flex items-center gap-1.5 flex-wrap">
                                                                        {WEEKDAY_CIRCLES.map((weekday, index) => {
                                                                            const activeDays = new Set(chamber.availabledays ?? []);
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
                                                                </div>
                                                            </div>
                                                            <div className="sm:self-end mt-2 sm:mt-0">
                                                                <Link
                                                                    href={{
                                                                        pathname: "/appointment/booking-doctor",
                                                                        query: {
                                                                            doctorId: chamber.doctorid,
                                                                            name: chamber.name,
                                                                            hospital: chamber.hospital,
                                                                            specialization: Array.isArray(chamber.specialization)
                                                                                ? chamber.specialization.join(", ")
                                                                                : chamber.specialization,
                                                                            district: chamber.district,
                                                                            thana: chamber.thana,
                                                                            avgrating: chamber.avgrating,
                                                                            availabledays: (chamber.availabledays ?? []).join(","),
                                                                        },
                                                                    }}
                                                                    className="inline-flex w-full items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
                                                                >
                                                                    Appoint Now
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </article>
                                    );
                                })
                            )}
                </div>
            </section>
        </main>
    );
}
