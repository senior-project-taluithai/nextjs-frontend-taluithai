"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { trips, Trip } from "@/lib/mock-data";
import { Plus, Clock, CheckCircle2, FileEdit, ChevronDown, ChevronUp, MapPin, CalendarDays } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRouter } from "next/navigation";

export default function MyTripsPage() {
    const router = useRouter();
    const [openCompleted, setOpenCompleted] = useState(false);

    const sortedTrips = useMemo(() => {
        const drafts = trips.filter(t => t.status === 'draft');
        const upcoming = trips.filter(t => t.status === 'upcoming');
        const completed = trips.filter(t => t.status === 'completed');
        return { drafts, upcoming, completed };
    }, []);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen max-w-5xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">My Trips</h1>
                    <p className="text-muted-foreground mt-1">Manage all your travel plans in one place</p>
                </div>
                <Button onClick={() => router.push('/my-trip/new')} className="gap-2">
                    <Plus className="w-4 h-4" />
                    New Trip
                </Button>
            </div>

            <div className="space-y-10">
                {/* Drafts Section - Highest Priority */}
                {sortedTrips.drafts.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <FileEdit className="w-5 h-5 text-indigo-500" />
                            Drafts
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedTrips.drafts.map(trip => (
                                <TripCard key={trip.trip_id} trip={trip} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Upcoming Section */}
                {sortedTrips.upcoming.length > 0 && (
                    <section>
                        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-blue-500" />
                            Upcoming Trips
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {sortedTrips.upcoming.map(trip => (
                                <TripCard key={trip.trip_id} trip={trip} />
                            ))}
                        </div>
                    </section>
                )}

                {/* Completed Section - Collapsible */}
                {sortedTrips.completed.length > 0 && (
                    <section>
                        <Collapsible open={openCompleted} onOpenChange={setOpenCompleted}>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle2 className="w-5 h-5" />
                                    Completed
                                </h2>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground">
                                        {openCompleted ? "Hide" : "Show"}
                                        {openCompleted ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                    </Button>
                                </CollapsibleTrigger>
                            </div>

                            <CollapsibleContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
                                    {sortedTrips.completed.map(trip => (
                                        <TripCard key={trip.trip_id} trip={trip} />
                                    ))}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </section>
                )}
            </div>
        </div>
    );
}

function TripCard({ trip }: { trip: Trip }) {
    const statusColors = {
        draft: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300 hover:bg-indigo-100/80",
        upcoming: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 hover:bg-blue-100/80",
        completed: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-100/80",
    };

    return (
        <Link href={`/my-trip/${trip.trip_id}`} className="group block h-full">
            <div className="h-full bg-card rounded-xl border shadow-sm overflow-hidden group-hover:shadow-md transition-shadow flex flex-col">
                {/* Cover Image */}
                <div className="relative h-40 w-full bg-slate-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={trip.cover_image || "https://picsum.photos/1000/600?grayscale"}
                        alt={trip.name}
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                        <Badge className={`${statusColors[trip.status]} border-0 capitalize shadow-sm`}>
                            {trip.status}
                        </Badge>
                    </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                        {trip.name}
                    </h3>

                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {trip.province_name && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span>{trip.province_name}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 shrink-0" />
                            <span>
                                {new Date(trip.start_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                {" - "}
                                {new Date(trip.end_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}
