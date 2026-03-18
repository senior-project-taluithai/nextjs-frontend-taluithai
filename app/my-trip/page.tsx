"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Map,
  Calendar,
  MapPin,
  Clock,
  Trash2,
  MoreHorizontal,
  ChevronRight,
  Loader2,
  Check,
  CalendarCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTrips, useDeleteTrip, useUpdateTrip } from "@/hooks/api/useTrips";
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
import { TripDto } from "@/lib/mock-data";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-600",
    bg: "bg-gray-100 border-gray-200",
    dot: "bg-gray-400",
  },
  planned: {
    label: "Planned",
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-100",
    dot: "bg-blue-500",
  },
  upcoming: {
    label: "Upcoming",
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-100",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-100",
    dot: "bg-emerald-500",
  },
  pass: {
    label: "Passed",
    color: "text-red-600",
    bg: "bg-red-50 border-red-100",
    dot: "bg-red-400",
  },
};

export default function MyTripsPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "draft" | "planned" | "upcoming" | "completed" | "pass"
  >("all");
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [tripToDelete, setTripToDelete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [tripToComplete, setTripToComplete] = useState<{
    id: number;
    name: string;
  } | null>(null);
  const [tripToPlan, setTripToPlan] = useState<{
    id: number;
    name: string;
  } | null>(null);

  const { data: rawTrips, isLoading, error } = useTrips();
  const deleteTrip = useDeleteTrip();
  const updateTrip = useUpdateTrip();

  // Map the raw API data to the format expected by the new UI
  const trips = useMemo(() => {
    if (!rawTrips) return [];

    return rawTrips.map((t) => {
      const start = new Date(t.start_date);
      const end = new Date(t.end_date);
      const days =
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) +
        1;

      // Format destination (provinces)
      const destination =
        t.provinces && t.provinces.length > 0
          ? t.provinces.map((p) => p.name_en).join(", ")
          : "Multiple Destinations";

      // Cover image fallback
      const coverImage =
        t.provinces && t.provinces.length > 0 && t.provinces[0].image_url
          ? t.provinces[0].image_url
          : "https://picsum.photos/1000/600?grayscale"; // Fallback image

      // Calculate total estimated budget from items if available (defaulting to 0 for now as it needs deep items fetch, could mock it or calculate if day items are embedded)
      // Assuming for now it's 0 or we mock it, or if it's available in the DTO
      const budget = 0; // The API doesn't return total cost in the basic DTO yet

      // Calculate total places planned
      // The API doesn't return total places in the basic DTO yet, defaulting to 0 or estimating based on days
      const placesCount = (t as any).TripDays
        ? (t as any).TripDays.reduce(
            (acc: number, day: any) => acc + (day.items?.length || 0),
            0,
          )
        : 0;

      const dateStr = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

      return {
        id: t.id,
        title: t.name,
        destination: destination,
        days: days,
        places: placesCount,
        status: t.status as
          | "draft"
          | "planned"
          | "upcoming"
          | "completed"
          | "pass",
        date: dateStr,
        coverImage: coverImage,
        budget: budget > 0 ? `฿${budget.toLocaleString()}` : "Budget TBD",
        rawItem: t,
      };
    });
  }, [rawTrips]);

  const filtered =
    activeFilter === "all"
      ? trips
      : trips.filter((t) => t.status === activeFilter);

  // Calculate overall stats
  const stats = useMemo(() => {
    return [
      { label: "Total Trips", value: trips.length, icon: "🗺️" },
      {
        label: "Places Visited",
        value: trips.reduce((s, t) => s + t.places, 0) || "-",
        icon: "📍",
      }, // Might need deeper data for real places count
      {
        label: "Days Traveled",
        value: trips.reduce((s, t) => s + t.days, 0),
        icon: "📅",
      },
      {
        label: "Completed",
        value: trips.filter((t) => t.status === "completed").length,
        icon: "✅",
      },
      {
        label: "Passed",
        value: trips.filter((t) => t.status === "pass").length,
        icon: "⏳",
      },
    ];
  }, [trips]);

  const handleDeleteClick = (
    tripId: number,
    tripName: string,
    e: React.MouseEvent,
  ) => {
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
      console.error("Failed to delete trip:", error);
      toast.error("Failed to delete trip. Please try again.");
    }
  };

  const handleCompleteClick = (
    tripId: number,
    tripName: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setTripToComplete({ id: tripId, name: tripName });
  };

  const handleConfirmComplete = async () => {
    if (!tripToComplete) return;

    try {
      await updateTrip.mutateAsync({
        id: tripToComplete.id,
        data: { status: "completed" },
      });
      toast.success(`"${tripToComplete.name}" marked as completed!`);
      setTripToComplete(null);
    } catch (error) {
      console.error("Failed to complete trip:", error);
      toast.error("Failed to complete trip. Please try again.");
    }
  };

  const handlePlanClick = (
    tripId: number,
    tripName: string,
    e: React.MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setTripToPlan({ id: tripId, name: tripName });
  };

  const handleConfirmPlan = async () => {
    if (!tripToPlan) return;

    try {
      await updateTrip.mutateAsync({
        id: tripToPlan.id,
        data: { status: "planned" },
      });
      toast.success(`"${tripToPlan.name}" marked as planned!`);
      setTripToPlan(null);
    } catch (error) {
      console.error("Failed to plan trip:", error);
      toast.error("Failed to plan trip. Please try again.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-muted-foreground">Loading your trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 overflow-y-auto bg-[#f8f9fa] flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-destructive mb-4">Failed to load trips</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-[#f8f9fa] min-h-screen">
      <div className="px-8 py-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1
              className="text-gray-900 mb-1"
              style={{ fontSize: "1.875rem", fontWeight: 700 }}
            >
              My Trips
            </h1>
            <p className="text-gray-500">
              Manage and review your Thailand adventures
            </p>
          </div>
          <button
            onClick={() => router.push("/my-trip/new")}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-xl font-medium transition-colors shadow-md shadow-emerald-200"
          >
            <Plus className="w-4 h-4" />
            New Trip
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center"
            >
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(
            [
              "all",
              "draft",
              "planned",
              "upcoming",
              "completed",
              "pass",
            ] as const
          ).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all duration-200 ${
                activeFilter === filter
                  ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300"
              }`}
            >
              {filter === "pass" ? "passed" : filter}
              {filter !== "all" && (
                <span
                  className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeFilter === filter ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {trips.filter((t) => t.status === filter).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Trip cards grid */}
        {trips.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
            <Map className="w-16 h-16 mx-auto mb-4 text-emerald-200" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No trips yet
            </h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Start planning your next adventure in Thailand! Discover amazing
              places and create your perfect itinerary.
            </p>
            <button
              onClick={() => router.push("/my-trip/new")}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-md shadow-emerald-200 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Plan Your First Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((trip, i) => {
              const sc = statusConfig[trip.status] || statusConfig.draft;
              return (
                <motion.div
                  key={trip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  whileHover={{ y: -4 }}
                  onHoverStart={() => setHoveredId(trip.id)}
                  onHoverEnd={() => setHoveredId(null)}
                >
                  <div
                    className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer group h-full flex flex-col"
                    onClick={() => router.push(`/my-trip/${trip.id}`)}
                  >
                    {/* Cover image */}
                    <div className="relative h-44 overflow-hidden shrink-0">
                      <img
                        src={trip.coverImage || undefined}
                        alt={trip.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                      {/* Status badge */}
                      <div className="absolute top-3 left-3">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${sc.bg} ${sc.color}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${sc.dot}`}
                          />
                          {sc.label}
                        </span>
                      </div>

                      {/* Actions Menu */}
                      <div
                        className="absolute top-3 right-3 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="w-8 h-8 rounded-lg bg-black/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/50 transition-colors">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive cursor-pointer"
                              onClick={(e) =>
                                handleDeleteClick(trip.id, trip.title, e)
                              }
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Trip
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Budget (Optional, depends on data) */}
                      {trip.budget !== "Budget TBD" && (
                        <div className="absolute bottom-3 right-3 bg-black/50 backdrop-blur-sm text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                          {trip.budget}
                        </div>
                      )}

                      {/* Hover: View overlay */}
                      <AnimatePresence>
                        {hoveredId === trip.id && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-emerald-500/20 backdrop-blur-[1px] flex items-center justify-center"
                          >
                            <div className="bg-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-xl">
                              <span className="text-sm font-bold text-gray-900">
                                Open Trip
                              </span>
                              <ChevronRight className="w-4 h-4 text-emerald-500" />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Content */}
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                        {trip.title}
                      </h3>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="line-clamp-1">{trip.destination}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          {trip.days} days
                        </span>
                        {trip.places > 0 && (
                          <span className="flex items-center gap-1">
                            <Map className="w-3 h-3 text-emerald-500" />
                            {trip.places} places
                          </span>
                        )}
                      </div>

                      <div className="text-xs text-gray-400 mb-4 flex items-center gap-1 flex-1">
                        <Clock className="w-3 h-3" />
                        {trip.date}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 mt-auto">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/my-trip/${trip.id}`);
                          }}
                          className="flex-1 flex items-center justify-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 py-2 rounded-xl text-xs font-medium transition-colors"
                        >
                          <Map className="w-3.5 h-3.5" />
                          View Trip
                        </button>
                        {trip.status === "draft" && (
                          <button
                            onClick={(e) =>
                              handlePlanClick(trip.id, trip.title, e)
                            }
                            className="w-9 h-9 flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-colors shrink-0"
                            title="Mark as Planned"
                          >
                            <CalendarCheck className="w-4 h-4" />
                          </button>
                        )}
                        {(trip.status === "planned" ||
                          trip.status === "upcoming") && (
                          <button
                            onClick={(e) =>
                              handleCompleteClick(trip.id, trip.title, e)
                            }
                            className="w-9 h-9 flex items-center justify-center bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-colors shrink-0"
                            title="Mark as Completed"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* New trip card */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: filtered.length * 0.08 }}
              onClick={() => router.push("/my-trip/new")}
              className="bg-white rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/50 transition-all duration-300 flex flex-col items-center justify-center gap-3 p-8 min-h-[340px] group h-full"
            >
              <div className="w-12 h-12 rounded-2xl bg-gray-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <p className="text-sm font-medium text-gray-400 group-hover:text-emerald-600 transition-colors">
                Plan a new trip
              </p>
              <p className="text-xs text-gray-300 group-hover:text-emerald-400 transition-colors text-center px-4">
                Create your perfect Thailand itinerary
              </p>
            </motion.button>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!tripToDelete}
        onOpenChange={(open) => !open && setTripToDelete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Trip?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold text-gray-900">
                "{tripToDelete?.name}"
              </span>
              ? This action cannot be undone and will permanently delete all
              trip data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="rounded-xl bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-200"
            >
              Delete Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Trip Confirmation Dialog */}
      <AlertDialog
        open={!!tripToComplete}
        onOpenChange={(open) => !open && setTripToComplete(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Completed?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark{" "}
              <span className="font-semibold text-gray-900">
                "{tripToComplete?.name}"
              </span>
              as completed? This will indicate that your trip has been
              successfully completed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmComplete}
              className="rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 shadow-sm shadow-emerald-200"
            >
              <Check className="w-4 h-4 mr-1" />
              Complete Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Plan Trip Confirmation Dialog */}
      <AlertDialog
        open={!!tripToPlan}
        onOpenChange={(open) => !open && setTripToPlan(null)}
      >
        <AlertDialogContent className="rounded-2xl border-gray-100">
          <AlertDialogHeader>
            <AlertDialogTitle>Mark as Planned?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark{" "}
              <span className="font-semibold text-gray-900">
                "{tripToPlan?.name}"
              </span>
              as planned? The trip will be marked as planned and will
              automatically change to "Upcoming" when it is within 7 days of the
              start date.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-2">
            <AlertDialogCancel className="rounded-xl border-gray-200 hover:bg-gray-50 hover:text-gray-900">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPlan}
              className="rounded-xl bg-blue-500 text-white hover:bg-blue-600 shadow-sm shadow-blue-200"
            >
              <CalendarCheck className="w-4 h-4 mr-1" />
              Plan Trip
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
