"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { TripDto } from "@/lib/mock-data";
import { Plus, Clock, CheckCircle2, FileEdit, ChevronDown, ChevronUp, MapPin, CalendarDays, Loader2, Trash2, MoreVertical } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useRouter } from "next/navigation";
import { useTrips, useDeleteTrip } from "@/hooks/api/useTrips";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function MyTripsPage() {
    const router = useRouter();
    const [openCompleted, setOpenCompleted] = useState(false);
    const [tripToDelete, setTripToDelete] = useState<{ id: number; name: string } | null>(null);

    const { data: trips, isLoading, error } = useTrips();
    const deleteTrip = useDeleteTrip();

    const sortedTrips = useMemo(() => {
        if (!trips) return { drafts: [], upcoming: [], completed: [] };

        const drafts = trips.filter(t => t.status === 'draft');
        const upcoming = trips.filter(t => t.status === 'upcoming');
        const completed = trips.filter(t => t.status === 'completed');
        return { drafts, upcoming, completed };
    }, [trips]);

    const handleDeleteClick = (tripId: number, tripName: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTripToDelete({ id: tripId, name: tripName });
    };

    const handleConfirmDelete = async () => {
        if (!tripToDelete) return;

        try {
            await deleteTrip.mutateAsync(tripToDelete.id);
            toast.success(`"${tripToDelete.name}" has been deleted`);
            setTripToDelete(null);
        } catch (error) {
            console.error('Failed to delete trip:', error);
            toast.error('Failed to delete trip. Please try again.');
        }
    };

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-screen max-w-5xl flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading your trips...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="container mx-auto px-4 py-8 min-h-screen max-w-5xl flex items-center justify-center">
                <div className="text-center">
                    <p className="text-destructive mb-4">Failed to load trips</p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <>
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

                {!trips || trips.length === 0 ? (
                    <div className="text-center py-16">
                        <FileEdit className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h2 className="text-2xl font-semibold mb-2">No trips yet</h2>
                        <p className="text-muted-foreground mb-6">Start planning your next adventure!</p>
                        <Button onClick={() => router.push('/my-trip/new')} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Create Your First Trip
                        </Button>
                    </div>
                ) : (
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
                                        <TripCard key={trip.id} trip={trip} onDeleteClick={handleDeleteClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Upcoming Section */}
                        {sortedTrips.upcoming.length > 0 && (
                            <section>
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-blue-500" />
                                    Upcoming
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {sortedTrips.upcoming.map(trip => (
                                        <TripCard key={trip.id} trip={trip} onDeleteClick={handleDeleteClick} />
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Completed Section - Collapsible */}
                        {sortedTrips.completed.length > 0 && (
                            <Collapsible open={openCompleted} onOpenChange={setOpenCompleted}>
                                <section>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="ghost" className="w-full justify-start p-0 h-auto hover:bg-transparent mb-4">
                                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-green-500" />
                                                Completed ({sortedTrips.completed.length})
                                                {openCompleted ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
                                            </h2>
                                        </Button>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {sortedTrips.completed.map(trip => (
                                                <TripCard key={trip.id} trip={trip} onDeleteClick={handleDeleteClick} />
                                            ))}
                                        </div>
                                    </CollapsibleContent>
                                </section>
                            </Collapsible>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={!!tripToDelete} onOpenChange={(open) => !open && setTripToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Trip</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete <span className="font-semibold">"{tripToDelete?.name}"</span>?
                            This action cannot be undone and will permanently delete all trip data including itinerary and saved places.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirmDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

function TripCard({ trip, onDeleteClick }: { trip: TripDto; onDeleteClick: (id: number, name: string, e: React.MouseEvent) => void }) {
    const statusColors = {
        draft: 'bg-gray-100 text-gray-700 border-gray-300',
        upcoming: 'bg-blue-100 text-blue-700 border-blue-300',
        completed: 'bg-green-100 text-green-700 border-green-300',
    };

    // Format province names
    const provinceNames = trip.provinces.map(p => p.name_en).join(", ");

    // Use first province's image as cover, or fallback
    const cover_image = trip.provinces[0]?.image_url || "/fallback.jpg";

    // Calculate trip duration
    const start = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    return (
        <div className="group relative overflow-hidden rounded-xl border bg-card hover:shadow-lg transition-all">
            {/* Province count badge for multi-province trips */}
            {trip.provinces.length > 1 && (
                <div className="absolute top-2 left-2 z-10">
                    <Badge className="bg-primary/90 hover:bg-primary shadow-sm text-xs">
                        {trip.provinces.length} Provinces
                    </Badge>
                </div>
            )}

            {/* Actions Menu */}
            <div className="absolute top-2 right-2 z-10">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                            onClick={(e) => e.preventDefault()}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => onDeleteClick(trip.id, trip.name, e)}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Trip
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Link href={`/my-trip/${trip.id}`}>
                {/* Cover Image */}
                <div className="relative h-48 overflow-hidden">
                    <img
                        src={cover_image}
                        alt={trip.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    <div>
                        <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {trip.name}
                        </h3>
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                        {provinceNames && (
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4 shrink-0" />
                                <span className="line-clamp-1">{provinceNames}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 shrink-0" />
                            <span>
                                {start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                <span className="text-xs ml-1">({days} {days === 1 ? 'day' : 'days'})</span>
                            </span>
                        </div>
                    </div>

                    <div className="pt-2">
                        <Badge variant="outline" className={cn("capitalize text-xs", statusColors[trip.status])}>
                            {trip.status}
                        </Badge>
                    </div>
                </div>
            </Link>
        </div>
    );
}
