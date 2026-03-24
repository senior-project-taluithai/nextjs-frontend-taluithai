"use client";

import { use, useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Plus,
  MapPin,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Map as MapIcon,
  List,
  Sparkles,
  Navigation,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  Edit2,
  Heart,
  SlidersHorizontal,
  Check,
  AlertCircle,
  Star,
  Wallet,
  Bed,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
  useTrip,
  useTripRecommendedPlaces,
  useTripPlaces,
  useTripEvents,
  useTripSavedItems,
  useAddTripDayItem,
  useRemoveTripDayItem,
  useUpdateTripDayItem,
  useReorderTripDayItems,
  useUpdateTrip,
} from "@/hooks/api/useTrips";
import {
  useTripHotels,
  useSetDayHotel,
  useRemoveDayHotel,
} from "@/hooks/api/useHotels";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { TripTimelineItem } from "@/components/my-trip/trip-timeline-item";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import TripMap to avoid SSR issues
const TripMap = dynamic(() => import("@/components/my-trip/trip-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">
      Loading Map...
    </div>
  ),
});

import { EditTripDialog } from "@/components/my-trip/edit-trip-dialog";
import { RecommendationSection } from "@/components/my-trip/recommendation-section";
import { BudgetPanel } from "@/components/ai-planner/budget-panel";
import { EditBudgetDialog } from "@/components/my-trip/edit-budget-dialog";
import { api } from "@/lib/api-client";
import type { RouteGeometry } from "@/components/my-trip/trip-map";
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
import { useDeleteTrip } from "@/hooks/api/useTrips";
import { TripFilters } from "@/components/my-trip/trip-filters";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; dot: string }
> = {
  draft: {
    label: "Draft",
    color: "text-gray-500",
    bg: "bg-gray-100",
    dot: "bg-gray-400",
  },
  planned: {
    label: "Planned",
    color: "text-blue-600",
    bg: "bg-blue-50",
    dot: "bg-blue-500",
  },
  upcoming: {
    label: "Upcoming",
    color: "text-amber-600",
    bg: "bg-amber-50",
    dot: "bg-amber-500",
  },
  completed: {
    label: "Completed",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    dot: "bg-emerald-500",
  },
};

export default function TripDetailPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = use(params);
  const router = useRouter();
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [orderedItems, setOrderedItems] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<string>("places");
  const [isEditTripOpen, setIsEditTripOpen] = useState(false);
  const [isEditBudgetOpen, setIsEditBudgetOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Filter States for "All Places"
  const [filters, setFilters] = useState<any>({});
  const [placesPage, setPlacesPage] = useState(1);
  const [eventsPage, setEventsPage] = useState(1);
  const [savedPage, setSavedPage] = useState(1);
  const [savedType, setSavedType] = useState<"place" | "event">("place");
  const [recommendationsPage, setRecommendationsPage] = useState(1);
  const [hotelsPage, setHotelsPage] = useState(1);
  const [showMap, setShowMap] = useState(false);
  const [routeGeometries, setRouteGeometries] = useState<RouteGeometry[]>([]);
  const [activeMobilePanel, setActiveMobilePanel] = useState<
    "itinerary" | "discover"
  >("itinerary");
  const ITEMS_PER_PAGE = 12; // increased for a nicer grid
  const RECOMMENDATIONS_PER_PAGE = 8;

  const handleSetFilters = (updater: any) => {
    setFilters((prev: any) => {
      const next = typeof updater === "function" ? updater(prev) : updater;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setPlacesPage(1);
        setEventsPage(1);
      }
      return next;
    });
  };

  // Load trip data from API
  const {
    data: trip,
    isLoading: tripLoading,
    error: tripError,
  } = useTrip(parseInt(tripId));

  // Load recommendations
  const { data: recommendedPlaces, isLoading: recommendationsLoading } =
    useTripRecommendedPlaces(
      parseInt(tripId),
      recommendationsPage,
      RECOMMENDATIONS_PER_PAGE,
    );

  // Load places with filters
  const { data: placesData, isLoading: placesLoading } = useTripPlaces(
    parseInt(tripId),
    { ...filters, page: placesPage, limit: ITEMS_PER_PAGE },
  );

  // Load events
  const { data: eventsData, isLoading: eventsLoading } = useTripEvents(
    parseInt(tripId),
    { ...filters, page: eventsPage, limit: ITEMS_PER_PAGE },
  );

  // Load saved items
  const { data: savedData, isLoading: savedLoading } = useTripSavedItems(
    parseInt(tripId),
    savedType,
    savedPage,
    ITEMS_PER_PAGE,
  );

  // Load hotels
  const { data: hotelsData, isLoading: hotelsLoading } = useTripHotels(
    parseInt(tripId),
    { ...filters, page: hotelsPage, limit: ITEMS_PER_PAGE },
  );

  // Mutations
  const addItemMutation = useAddTripDayItem();
  const removeItemMutation = useRemoveTripDayItem();
  const updateItemMutation = useUpdateTripDayItem();
  const reorderItemMutation = useReorderTripDayItems();
  const deleteTripMutation = useDeleteTrip();
  const updateTripMutation = useUpdateTrip();
  const setDayHotelMutation = useSetDayHotel();
  const removeDayHotelMutation = useRemoveDayHotel();

  // Helper: parse price_range string into a numeric average
  const parsePriceRange = useCallback((priceRange: string | undefined | null): number => {
    if (!priceRange) return 0;
    const cleaned = priceRange.replace(/[฿,$,\s]/g, "").replace(/[^\d.-]/g, "");
    const parts = cleaned
      .split("-")
      .map((p) => parseFloat(p.trim()))
      .filter((n) => !isNaN(n) && isFinite(n));
    if (parts.length === 0) return 0;
    if (parts.length === 1) return parts[0];
    return (parts[0] + parts[1]) / 2;
  }, []);

  // Recalculate accommodation budget after hotel changes
  const recalculateAccommodationBudget = useCallback(
    (updatedDays: any[], currentBudget: any, changedDayNumber: number, newHotel: any | null) => {
      if (!currentBudget || !currentBudget.categories) return;

      // Build the accommodation expenses from all days
      const hotelExpenses: any[] = [];
      let totalAccommodationCost = 0;

      for (const day of updatedDays) {
        const dayNum = day.day_number;
        // For the changed day, use the new hotel; otherwise use existing
        const hotel = dayNum === changedDayNumber ? newHotel : day.hotel;
        if (hotel) {
          const price = parsePriceRange(hotel.price_range);
          if (price > 0) {
            totalAccommodationCost += price;
            hotelExpenses.push({
              id: `hotel-expense-day-${dayNum}`,
              name: `${hotel.name_en || hotel.name} - Night ${dayNum}`,
              amount: price,
              categoryId: "accommodation",
              day: dayNum,
            });
          }
        }
      }

      // Find accommodation category
      const accommodationKeywords = ["accommodation", "hotel", "stay", "lodging", "room"];
      const updatedCategories = currentBudget.categories.map((cat: any) => {
        const catIdLower = (cat.id || "").toLowerCase();
        if (accommodationKeywords.some((kw) => catIdLower.includes(kw))) {
          return { ...cat, allocated: totalAccommodationCost };
        }
        return cat;
      });

      // Rebuild expenses: keep non-accommodation + new hotel expenses
      const existingNonAccommodation = (currentBudget.expenses || []).filter(
        (e: any) => e && e.id && !e.id.startsWith("hotel-expense-"),
      );

      const newBudget = {
        ...currentBudget,
        categories: updatedCategories,
        expenses: [...existingNonAccommodation, ...hotelExpenses],
      };

      updateTripMutation.mutate({
        id: parseInt(tripId),
        data: { budget: newBudget },
      });
    },
    [parsePriceRange, updateTripMutation, tripId],
  );

  const sortedDays = useMemo(() => {
    if (!trip?.TripDays) return [];
    return [...trip.TripDays].sort((a, b) => a.day_number - b.day_number);
  }, [trip?.TripDays]);

  const currentDay = sortedDays.find((d) => d.day_number === selectedDay);

  useEffect(() => {
    if (currentDay?.items) {
      setOrderedItems(currentDay.items);
    }
  }, [currentDay]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id && currentDay) {
      setOrderedItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);

        const newItems = arrayMove(items, oldIndex, newIndex);

        // Call API to reorder
        reorderItemMutation.mutate({
          tripId: parseInt(tripId),
          dayNumber: selectedDay,
          items: {
            items: newItems.map((item, index) => ({
              id: item.id,
              order: index + 1, // 1-based index
            })),
          },
        });

        return newItems;
      });
    }
  };

  // Collect all items for the map
  const mapItems = useMemo(() => {
    if (!currentDay) return [];
    const items: any[] = currentDay.items
      .map((item) => {
        const detail = item.place || item.event;
        if (!detail) return null;
        return {
          id: detail.id,
          type: item.place ? "place" : "event",
          name: detail.name,
          name_en: detail.name_en,
          latitude: detail.latitude,
          longitude: detail.longitude,
          rating: detail.rating,
          thumbnail_url: detail.thumbnail_url,
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null && !!item.latitude && !!item.longitude,
      );

    // Add hotel if exists
    if (
      currentDay.hotel &&
      currentDay.hotel.latitude &&
      currentDay.hotel.longitude
    ) {
      items.unshift({
        id: currentDay.hotel.id,
        type: "hotel",
        name: currentDay.hotel.name,
        name_en: currentDay.hotel.name_en,
        latitude: currentDay.hotel.latitude,
        longitude: currentDay.hotel.longitude,
        rating: currentDay.hotel.rating,
        thumbnail_url: currentDay.hotel.thumbnail_url,
        category: "hotel",
        priceRange: currentDay.hotel.price_range || "",
        bookingUrl: currentDay.hotel.booking_url || "",
      });
    }

    return items;
  }, [currentDay]);

  // Fetch route geometries when mapItems changes
  useEffect(() => {
    async function fetchRoute() {
      if (mapItems.length < 2) {
        setRouteGeometries([]);
        return;
      }

      try {
        const waypoints = mapItems.map((item) => ({
          latitude: item.latitude,
          longitude: item.longitude,
        }));

        const res = await api.post("/tools/route", { waypoints });
        if (res.data && res.data.geometry) {
          setRouteGeometries([
            {
              day: selectedDay,
              coordinates: res.data.geometry.coordinates,
            },
          ]);
        }
      } catch (error) {
        console.error("Failed to fetch route:", error);
        setRouteGeometries([]);
      }
    }

    fetchRoute();
  }, [mapItems, selectedDay]);

  // Loading state - must be before any early returns
  if (!trip) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading trip...
      </div>
    );
  }

  const checkIsAdded = (type: "place" | "event", id: number) => {
    // Simple check if item exists in ANY day of the trip
    return sortedDays.some((day) =>
      day.items.some(
        (item) =>
          (type === "place" && item.place_id === id) ||
          (type === "event" && item.event_id === id),
      ),
    );
  };

  const handleAddToDay = (item: any, type: "place" | "event") => {
    if (!currentDay) return;

    // Use real API mutation
    addItemMutation.mutate(
      {
        tripId: parseInt(tripId),
        dayNumber: selectedDay,
        item: {
          item_type: type,
          item_id: item.id,
          order: currentDay.items.length + 1,
          start_time: "09:00",
          end_time: "10:00",
        },
      },
      {
        onSuccess: () => {
          toast.success(`Added ${type} to Day ${selectedDay}`);
        },
        onError: (error: any) => {
          toast.error(`Failed to add ${type}: ${error.message}`);
        },
      },
    );
  };

  const handleRemoveFromDay = (itemId: number) => {
    if (!currentDay) return;

    removeItemMutation.mutate(
      {
        tripId: parseInt(tripId),
        dayNumber: selectedDay,
        itemId,
      },
      {
        onSuccess: () => {
          toast.success("Item removed from timeline");
        },
        onError: (error: any) => {
          toast.error(`Failed to remove item: ${error.message}`);
        },
      },
    );
  };

  const handleTimeChange = (
    itemId: number,
    field: "start_time" | "end_time",
    value: string,
  ) => {
    if (!currentDay) return;

    updateItemMutation.mutate(
      {
        tripId: parseInt(tripId),
        dayNumber: selectedDay,
        itemId,
        updates: {
          [field]: value,
        },
      },
      {
        onSuccess: () => {
          toast.success("Time updated");
        },
        onError: (error: any) => {
          toast.error(`Failed to update time: ${error.message}`);
        },
      },
    );
  };

  const handleDeleteTrip = () => {
    deleteTripMutation.mutate(parseInt(tripId), {
      onSuccess: () => {
        toast.success("Trip deleted successfully");
        router.push("/my-trip");
      },
      onError: (error: any) => {
        toast.error(`Failed to delete trip: ${error.message}`);
      },
    });
  };

  const categories = ["All", "Nature", "Culture", "Food", "Shopping"];

  // Loading state
  if (tripLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-8 h-8 animate-spin text-gray-600" />
          </div>
          <p className="text-gray-600 font-medium">Loading trip details...</p>
          <p className="text-gray-400 text-sm mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-white border-b border-gray-100/80 z-10 shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button
            onClick={() => router.push("/my-trip")}
            className="w-9 h-9 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all shrink-0 border border-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-gray-900 text-base sm:text-lg truncate tracking-tight">
                {trip.name}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full shrink-0 border ${statusConfig.bg} ${statusConfig.color}`}
                style={{ borderColor: 'transparent' }}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`}
                />
                {statusConfig.label}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1 hidden sm:flex">
              <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md">
                <Calendar className="w-3 h-3 text-gray-400" />
                {format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}
              </span>
              {trip.provinces && trip.provinces.length > 0 && (
                <span className="flex items-center gap-1.5 bg-gray-50 px-2 py-0.5 rounded-md">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  {trip.provinces.map((p: any) => p.name_en).join(", ")}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditTripOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-xl transition-all border border-gray-200 hover:border-gray-300"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </button>

          <button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-all border border-red-100 hover:border-red-200"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      <EditTripDialog
        open={isEditTripOpen}
        onOpenChange={setIsEditTripOpen}
        trip={trip}
      />

      <EditBudgetDialog
        open={isEditBudgetOpen}
        onOpenChange={setIsEditBudgetOpen}
        trip={trip}
      />

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              trip and remove all your planned items.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTrip}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Main Two-Panel Content ── */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ── LEFT: Itinerary Panel ── */}
        <div
          className={`
                    flex flex-col bg-white border-r border-gray-100/80 overflow-hidden shadow-sm
                    w-full sm:w-[360px] md:w-[400px] lg:w-[440px] shrink-0
                    absolute sm:relative inset-0 z-20 sm:z-auto transition-transform duration-300
                    ${activeMobilePanel === "itinerary" ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}
                `}
        >
          {/* Mobile header */}
          <div className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0">
            <p className="font-bold text-gray-900 text-sm">Itinerary</p>
            <button
              onClick={() => setActiveMobilePanel("discover")}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Day tabs */}
          <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-gray-100/50 overflow-x-auto scrollbar-hide">
            {sortedDays.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.day_number)}
                className={`relative px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 ${
                  selectedDay === day.day_number
                    ? "bg-gray-900 text-white shadow-lg"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100"
                }`}
              >
                <span className="relative z-10">Day {day.day_number}</span>
                {selectedDay === day.day_number && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-gray-900 rotate-45" />
                )}
              </button>
            ))}
            <button className="w-10 h-10 shrink-0 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all border border-dashed border-gray-200 hover:border-gray-300">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Date header + cost summary */}
          <div className="px-4 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-transparent">
            <div>
              <p className="font-bold text-gray-900 text-base tracking-tight">
                {currentDay
                  ? format(new Date(currentDay.date), "EEEE, MMMM do")
                  : "Select a Day"}
              </p>
              <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                {currentDay?.items.length || 0} places planned
              </p>
            </div>
          </div>

          {/* Hotel for the day */}
          {currentDay?.hotel && (
            <div className="mx-4 mb-4 bg-gradient-to-br from-indigo-50 to-violet-50 border border-indigo-100/60 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-indigo-500 flex items-center justify-center">
                    <Bed className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-900">
                    Day {selectedDay} Hotel
                  </span>
                </div>
                <button
                  onClick={() => {
                    removeDayHotelMutation.mutate({
                      tripId: parseInt(tripId),
                      dayNumber: selectedDay,
                    });
                    if (trip?.TripDays) {
                      recalculateAccommodationBudget(
                        trip.TripDays, trip.budget, selectedDay, null,
                      );
                    }
                  }}
                  className="text-xs text-red-500 hover:text-red-600 font-semibold px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Remove
                </button>
              </div>
              <div className="flex gap-3">
                {(currentDay.hotel.thumbnail_url || currentDay.hotel.images?.[0]?.url) && (
                  <img
                    src={currentDay.hotel.thumbnail_url || currentDay.hotel.images?.[0]?.url}
                    alt={currentDay.hotel.name}
                    className="w-14 h-14 object-cover rounded-xl shadow-sm border border-white"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {currentDay.hotel.name_en || currentDay.hotel.name}
                  </h4>
                  {currentDay.hotel.rating > 0 && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md">
                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-semibold text-amber-700">
                          {currentDay.hotel.rating.toFixed(1)}
                        </span>
                      </div>
                      {currentDay.hotel.price_range && (
                        <span className="text-xs font-semibold text-emerald-600">
                          {currentDay.hotel.price_range}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Check-in/Check-out times */}
              <div className="flex items-center gap-3 mt-3 bg-white/60 rounded-xl p-2.5">
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-indigo-600 block mb-1">
                    Check-in
                  </label>
                  <input
                    type="time"
                    className="h-8 text-xs px-2.5 py-1.5 bg-white border border-indigo-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-gray-700"
                    value={currentDay.hotel_checkin_time || "14:00"}
                    onChange={(e) => {
                      setDayHotelMutation.mutate({
                        tripId: parseInt(tripId),
                        dayNumber: selectedDay,
                        data: {
                          hotelId: currentDay.hotel!.id,
                          checkinTime: e.target.value,
                          checkoutTime:
                            currentDay.hotel_checkout_time || "12:00",
                        },
                      });
                    }}
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-medium text-indigo-600 block mb-1">
                    Check-out
                  </label>
                  <input
                    type="time"
                    className="h-8 text-xs px-2.5 py-1.5 bg-white border border-indigo-100 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-200 font-medium text-gray-700"
                    value={currentDay.hotel_checkout_time || "12:00"}
                    onChange={(e) => {
                      setDayHotelMutation.mutate({
                        tripId: parseInt(tripId),
                        dayNumber: selectedDay,
                        data: {
                          hotelId: currentDay.hotel!.id,
                          checkinTime: currentDay.hotel_checkin_time || "14:00",
                          checkoutTime: e.target.value,
                        },
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Place list */}
          <div className="flex-1 overflow-y-auto px-4 pb-20 sm:pb-4 space-y-3">
            {currentDay?.items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center py-16 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-100">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Plus className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No places added yet</p>
                <p className="text-xs text-gray-400 text-center px-6 mt-1 max-w-[200px]">
                  Explore recommendations on the right panel
                </p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={orderedItems.map((i) => i.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {orderedItems.map((item, index) => (
                      <TripTimelineItem
                        key={item.id}
                        item={item}
                        index={index}
                        isLast={index === orderedItems.length - 1}
                        onRemove={handleRemoveFromDay}
                        onTimeChange={handleTimeChange}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add place button inside timeline */}
            {currentDay?.items.length !== 0 && (
              <div className="pt-3 pb-2">
                <button className="w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 hover:border-sky-300 bg-gray-50/50 hover:bg-sky-50/50 text-gray-400 hover:text-sky-600 text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 group">
                  <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Add place to Day {selectedDay}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile overlay backdrop */}
        {activeMobilePanel === "itinerary" && (
          <div
            className="sm:hidden fixed inset-0 bg-black/30 z-10"
            onClick={() => setActiveMobilePanel("discover")}
          />
        )}

        {/* ── RIGHT: Discover or Map ── */}
        <div
          className={`
                    flex-1 flex flex-col
                    ${activeMobilePanel === "discover" ? "flex" : "hidden sm:flex"}
                `}
        >
          {/* Mobile header */}
          <div className="sm:hidden flex items-center justify-between px-4 py-3 border-b border-gray-100 shrink-0 bg-white">
            <p className="font-bold text-gray-900 text-sm">Discover</p>
            <button
              onClick={() => setActiveMobilePanel("itinerary")}
              className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Right panel tab bar */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-white border-b border-gray-100/80 shrink-0">
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
              {(["places", "events", "hotels", "saved", "budget"] as const).map(
                (tab) => {
                  const isActive = activeTab === tab && !showMap;
                  const tabConfig: Record<string, { icon: typeof MapPin; activeColor: string }> = {
                    places: { icon: MapPin, activeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
                    events: { icon: Calendar, activeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
                    hotels: { icon: Bed, activeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                    saved: { icon: Heart, activeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
                    budget: { icon: Wallet, activeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                  };
                  const config = tabConfig[tab];
                  const IconComponent = config.icon;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setShowMap(false);
                      }}
                      className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 capitalize shrink-0 border ${
                        isActive
                          ? config.activeColor
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
            <button
              onClick={() => setShowMap(!showMap)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 shrink-0 border ${
                showMap
                  ? "bg-gray-900 text-white border-gray-900 shadow-lg"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
              }`}
            >
              <MapIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Map View</span>
            </button>
          </div>

          {/* Content Areas */}
          <div className="flex-1 relative overflow-hidden">
            {/* Map View */}
            <AnimatePresence>
              {showMap && (
                <motion.div
                  key="map"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-10"
                >
                  <TripMap items={mapItems} routeGeometries={routeGeometries} />
                  {/* Place markers legend */}
                  <div className="absolute bottom-6 right-6 bg-white/98 backdrop-blur-md rounded-2xl shadow-xl p-4 min-w-[220px] border border-gray-200/50 hidden md:block">
                    <p className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-gray-900 flex items-center justify-center">
                        <MapPin className="w-3.5 h-3.5 text-white" />
                      </div>
                      Day {selectedDay} Places
                    </p>
                    <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                      {currentDay?.items.map((p, i) => (
                        <div key={p.id} className="flex items-center gap-2.5 group">
                          <div className="w-6 h-6 rounded-lg bg-sky-500 flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-sm">
                            {i + 1}
                          </div>
                          <p className="text-xs text-gray-600 line-clamp-1 font-medium group-hover:text-gray-900 transition-colors">
                            {p.place?.name_en ||
                              p.place?.name ||
                              p.event?.name_en ||
                              p.event?.name}
                          </p>
                        </div>
                      ))}
                      {(!currentDay?.items ||
                        currentDay.items.length === 0) && (
                        <p className="text-xs text-gray-400 italic py-2">
                          No places added yet
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* List Views */}
            <AnimatePresence>
              {!showMap && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col bg-[#f8f9fa]"
                >
                  {/* --- PLACES TAB --- */}
                  {activeTab === "places" && (
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 space-y-8">
                      <RecommendationSection
                        title="Recommended for You"
                        icon={Sparkles}
                        items={recommendedPlaces?.data}
                        type="place"
                        onAdd={(item: any, type: string) =>
                          addItemMutation.mutate({
                            tripId: parseInt(tripId),
                            dayNumber: selectedDay,
                            item: {
                              item_type: type as "place" | "event",
                              item_id: item.id,
                              order: currentDay?.items.length
                                ? currentDay.items.length + 1
                                : 1,
                              start_time: "09:00",
                              end_time: "10:00",
                            },
                          })
                        }
                        checkIsAdded={(type: string, id: number) => {
                          return (
                            trip?.TripDays?.some((d) =>
                              d.items?.some(
                                (i) => i[type as "place" | "event"]?.id === id,
                              ),
                            ) || false
                          );
                        }}
                      />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-bold text-gray-900 text-lg tracking-tight">
                              Explore Places
                            </h3>
                            <p className="text-xs text-gray-500 mt-0.5">
                              in {trip.provinces && trip.provinces.length > 0
                                ? trip.provinces
                                    .map((p: any) => p.name_en)
                                    .join(" & ")
                                : "Selected Provinces"}
                            </p>
                          </div>
                        </div>

                        {/* Search and Filter Bar */}
                        <div className="flex gap-2.5 sticky top-0 z-10 bg-[#f8f9fa]/95 backdrop-blur-md py-3 -mx-1 px-1">
                          <div className="flex-1 flex items-center gap-2.5 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-sky-100 focus-within:border-sky-300 transition-all hover:border-gray-300">
                            <Search className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                              type="text"
                              placeholder="Search places..."
                              value={filters.search || ""}
                              onChange={(e) =>
                                handleSetFilters((prev: any) => ({
                                  ...prev,
                                  search: e.target.value,
                                }))
                              }
                              className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400 font-medium"
                            />
                            {filters.search && (
                              <button
                                onClick={() =>
                                  handleSetFilters((prev: any) => ({
                                    ...prev,
                                    search: "",
                                  }))
                                }
                                className="w-5 h-5 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <Sheet>
                            <SheetTrigger asChild>
                              <button className="w-11 h-11 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:border-gray-300 flex items-center justify-center text-gray-600 transition-all shrink-0 shadow-sm relative">
                                <SlidersHorizontal className="h-4 w-4" />
                                {Object.keys(filters).filter(
                                  (k) =>
                                    k !== "search" &&
                                    k !== "page" &&
                                    filters[k],
                                ).length > 0 && (
                                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-sky-500 rounded-full border-2 border-white shadow-sm" />
                                )}
                              </button>
                            </SheetTrigger>
                            <SheetContent
                              side="right"
                              className="w-full sm:w-[400px] overflow-y-auto"
                            >
                              <SheetHeader>
                                <SheetTitle>Filters</SheetTitle>
                              </SheetHeader>
                              <div className="mt-6">
                                <TripFilters
                                  filters={filters}
                                  setFilters={handleSetFilters}
                                  tripProvinces={trip.provinces || []}
                                  activeTab="place"
                                />
                              </div>
                            </SheetContent>
                          </Sheet>
                        </div>

                        {/* Results Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          {placesLoading ? (
                            <div className="col-span-full flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                              <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-500" />
                              <p className="text-sm font-medium">Loading places...</p>
                            </div>
                          ) : placesData && placesData.data.length > 0 ? (
                            placesData.data.map((place: any) => (
                              <PlannerCard
                                key={place.id}
                                item={place}
                                type="place"
                                onAdd={() =>
                                  addItemMutation.mutate({
                                    tripId: parseInt(tripId),
                                    dayNumber: selectedDay,
                                    item: {
                                      item_type: "place",
                                      item_id: place.id,
                                      order: currentDay?.items.length
                                        ? currentDay.items.length + 1
                                        : 1,
                                      start_time: "09:00",
                                      end_time: "10:00",
                                    },
                                  })
                                }
                                isAdded={
                                  trip?.TripDays?.some((d) =>
                                    d.items?.some(
                                      (i) => i.place?.id === place.id,
                                    ),
                                  ) || false
                                }
                              />
                            ))
                          ) : (
                            <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                              <Search className="w-10 h-10 mb-3 opacity-20" />
                              <p className="text-sm font-medium text-gray-500">
                                No places found
                              </p>
                              <p className="text-xs mt-1">
                                Try adjusting your search or filters.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Pagination Controls */}
                        {placesData && placesData.last_page > 1 && (
                          <div className="mt-8 pb-4">
                            <Pagination>
                              <PaginationContent>
                                <PaginationItem>
                                  <PaginationPrevious
                                    onClick={() =>
                                      setPlacesPage((p) => Math.max(1, p - 1))
                                    }
                                    className={cn(
                                      "cursor-pointer",
                                      placesPage === 1 &&
                                        "pointer-events-none opacity-50",
                                    )}
                                  />
                                </PaginationItem>
                                {Array.from({
                                  length: placesData.last_page,
                                }).map((_, i) => {
                                  const page = i + 1;
                                  if (
                                    page === 1 ||
                                    page === placesData.last_page ||
                                    (page >= placesPage - 1 &&
                                      page <= placesPage + 1)
                                  ) {
                                    return (
                                      <PaginationItem key={page}>
                                        <PaginationLink
                                          isActive={page === placesPage}
                                          onClick={() => setPlacesPage(page)}
                                          className="cursor-pointer"
                                        >
                                          {page}
                                        </PaginationLink>
                                      </PaginationItem>
                                    );
                                  } else if (
                                    page === placesPage - 2 ||
                                    page === placesPage + 2
                                  ) {
                                    return <PaginationEllipsis key={page} />;
                                  }
                                  return null;
                                })}
                                <PaginationItem>
                                  <PaginationNext
                                    onClick={() =>
                                      setPlacesPage((p) =>
                                        Math.max(
                                          1,
                                          Math.min(
                                            placesData.last_page || 1,
                                            p + 1,
                                          ),
                                        ),
                                      )
                                    }
                                    className={cn(
                                      "cursor-pointer",
                                      placesPage ===
                                        (placesData.last_page || 1) &&
                                        "pointer-events-none opacity-50",
                                    )}
                                  />
                                </PaginationItem>
                              </PaginationContent>
                            </Pagination>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* --- EVENTS TAB --- */}
                  {activeTab === "events" && (
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-6">
                      {/* Date filter info banner */}
                      <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4 text-amber-900 shadow-sm">
                        <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
                          <Calendar className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-1">
                            Filtered by Trip Dates
                          </h4>
                          <p className="text-xs opacity-80 leading-relaxed">
                            Showing events happening between{" "}
                            <strong className="font-semibold">
                              {trip?.start_date
                                ? format(new Date(trip.start_date), "MMM do")
                                : "..."}
                            </strong>{" "}
                            and{" "}
                            <strong className="font-semibold">
                              {trip?.end_date
                                ? format(
                                    new Date(trip.end_date),
                                    "MMM do, yyyy",
                                  )
                                : "..."}
                            </strong>{" "}
                            in your selected provinces.
                          </p>
                        </div>
                      </div>

                      {/* Search and Filter Bar for Events */}
                      <div className="flex gap-2 sticky top-0 z-10 bg-[#f8f9fa]/90 backdrop-blur-md pt-1 pb-3 -mx-1 px-1">
                        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
                          <Search className="w-4 h-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search events..."
                            value={filters.search || ""}
                            onChange={(e) =>
                              handleSetFilters((prev: any) => ({
                                ...prev,
                                search: e.target.value,
                              }))
                            }
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                          />
                          {filters.search && (
                            <button
                              onClick={() =>
                                handleSetFilters((prev: any) => ({
                                  ...prev,
                                  search: "",
                                }))
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <Sheet>
                          <SheetTrigger asChild>
                            <button className="w-10 h-10 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-500 transition-colors shrink-0 shadow-sm relative">
                              <SlidersHorizontal className="h-4 w-4" />
                              {Object.keys(filters).filter(
                                (k) =>
                                  k !== "search" && k !== "page" && filters[k],
                              ).length > 0 && (
                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                              )}
                            </button>
                          </SheetTrigger>
                          <SheetContent
                            side="right"
                            className="w-full sm:w-[400px] overflow-y-auto"
                          >
                            <SheetHeader>
                              <SheetTitle>Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                              <TripFilters
                                filters={filters}
                                setFilters={handleSetFilters}
                                tripProvinces={trip.provinces || []}
                                activeTab="event"
                              />
                            </div>
                          </SheetContent>
                        </Sheet>
                      </div>

                      {eventsLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-3 text-amber-500" />
                          <p className="text-sm">Loading events...</p>
                        </div>
                      ) : eventsData && eventsData.data.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {eventsData.data.map((event: any) => (
                              <PlannerCard
                                key={event.id}
                                item={event}
                                type="event"
                                onAdd={() =>
                                  addItemMutation.mutate({
                                    tripId: parseInt(tripId),
                                    dayNumber: selectedDay,
                                    item: {
                                      item_type: "event",
                                      item_id: event.id,
                                      order: currentDay?.items.length
                                        ? currentDay.items.length + 1
                                        : 1,
                                      start_time: "09:00",
                                      end_time: "10:00",
                                    },
                                  })
                                }
                                isAdded={
                                  trip?.TripDays?.some((d) =>
                                    d.items?.some(
                                      (i) => i.event?.id === event.id,
                                    ),
                                  ) || false
                                }
                              />
                            ))}
                          </div>

                          {/* Pagination for Events */}
                          {eventsData.last_page > 1 && (
                            <div className="mt-8 pb-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() =>
                                        setEventsPage((p) => Math.max(1, p - 1))
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        eventsPage === 1 &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                  {Array.from({
                                    length: eventsData.last_page,
                                  }).map((_, i) => {
                                    const page = i + 1;
                                    if (
                                      page === 1 ||
                                      page === eventsData.last_page ||
                                      (page >= eventsPage - 1 &&
                                        page <= eventsPage + 1)
                                    ) {
                                      return (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            isActive={page === eventsPage}
                                            onClick={() => setEventsPage(page)}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    } else if (
                                      page === eventsPage - 2 ||
                                      page === eventsPage + 2
                                    ) {
                                      return <PaginationEllipsis key={page} />;
                                    }
                                    return null;
                                  })}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() =>
                                        setEventsPage((p) =>
                                          Math.max(
                                            1,
                                            Math.min(
                                              eventsData.last_page || 1,
                                              p + 1,
                                            ),
                                          ),
                                        )
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        eventsPage ===
                                          (eventsData.last_page || 1) &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                          <Calendar className="w-10 h-10 mb-3 opacity-20" />
                          <p className="text-sm font-medium text-gray-500">
                            No events found
                          </p>
                          <p className="text-xs mt-1">
                            No events match your trip dates in this province.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- HOTELS TAB --- */}
                  {activeTab === "hotels" && (
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-6">
                      {/* Current Day Hotel */}
                      {currentDay?.hotel && (
                        <div className="bg-purple-50 border border-purple-100 rounded-2xl p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Bed className="w-5 h-5 text-purple-600" />
                              <span className="text-sm font-semibold text-purple-700">
                                Day {selectedDay} Hotel
                              </span>
                            </div>
                            <button
                              onClick={() => {
                                removeDayHotelMutation.mutate({
                                  tripId: parseInt(tripId),
                                  dayNumber: selectedDay,
                                });
                                if (trip?.TripDays) {
                                  recalculateAccommodationBudget(
                                    trip.TripDays, trip.budget, selectedDay, null,
                                  );
                                }
                              }}
                              className="text-xs text-red-500 hover:text-red-600 font-medium"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="flex gap-3">
                            {(currentDay.hotel.thumbnail_url || currentDay.hotel.images?.[0]?.url) && (
                              <img
                                src={currentDay.hotel.thumbnail_url || currentDay.hotel.images?.[0]?.url}
                                alt={currentDay.hotel.name}
                                className="w-20 h-20 object-cover rounded-xl"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 line-clamp-1">
                                {currentDay.hotel.name_en ||
                                  currentDay.hotel.name}
                              </h4>
                              {currentDay.hotel.address && (
                                <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                                  {currentDay.hotel.address}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {currentDay.hotel.rating > 0 && (
                                  <span className="flex items-center gap-0.5 text-xs">
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                    {currentDay.hotel.rating.toFixed(1)}
                                  </span>
                                )}
                                {currentDay.hotel.price_range && (
                                  <span className="text-xs text-emerald-600 font-medium">
                                    ฿{currentDay.hotel.price_range}
                                  </span>
                                )}
                              </div>
                              {currentDay.hotel_checkin_time && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Check-in: {currentDay.hotel_checkin_time}
                                  {currentDay.hotel_checkout_time &&
                                    ` | Check-out: ${currentDay.hotel_checkout_time}`}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Search and Filter Bar for Hotels */}
                      <div className="flex gap-2 sticky top-0 z-10 bg-[#f8f9fa]/90 backdrop-blur-md pt-1 pb-3 -mx-1 px-1">
                        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-purple-100 focus-within:border-purple-300 transition-all">
                          <Search className="w-4 h-4 text-gray-400 shrink-0" />
                          <input
                            type="text"
                            placeholder="Search hotels..."
                            value={filters.search || ""}
                            onChange={(e) =>
                              handleSetFilters((prev: any) => ({
                                ...prev,
                                search: e.target.value,
                              }))
                            }
                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                          />
                          {filters.search && (
                            <button
                              onClick={() =>
                                handleSetFilters((prev: any) => ({
                                  ...prev,
                                  search: "",
                                }))
                              }
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {hotelsLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                          <p className="text-sm font-medium">Loading hotels...</p>
                        </div>
                      ) : hotelsData && hotelsData.data.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {hotelsData.data.map((hotel: any) => {
                              const isSelected = currentDay?.hotel?.id === hotel.id;
                              return (
                                <div
                                  key={hotel.id}
                                  className={`relative bg-white rounded-2xl overflow-hidden border transition-all duration-300 group ${
                                    isSelected
                                      ? "border-indigo-400 shadow-lg shadow-indigo-100 ring-2 ring-indigo-100"
                                      : "border-gray-100 hover:border-gray-200 hover:shadow-lg"
                                  }`}
                                >
                                  <div className="relative aspect-[4/3] overflow-hidden">
                                    <img
                                      src={
                                        hotel.thumbnail_url ||
                                        hotel.images?.[0]?.url ||
                                        `/placeholder-hotel.jpg`
                                      }
                                      alt={hotel.name_en || hotel.name}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                                    {isSelected && (
                                      <div className="absolute top-3 left-3 bg-indigo-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 shadow-lg">
                                        <Check className="w-3 h-3" />
                                        Selected
                                      </div>
                                    )}
                                    {hotel.rating > 0 && (
                                      <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                                        <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                        <span className="text-xs font-bold text-gray-800">{hotel.rating.toFixed(1)}</span>
                                      </div>
                                    )}
                                    {hotel.price_range && (
                                      <div className="absolute bottom-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-lg shadow-sm">
                                        {hotel.price_range}
                                      </div>
                                    )}
                                  </div>
                                  <div className="p-3.5">
                                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                                      {hotel.name_en || hotel.name}
                                    </h4>
                                    {hotel.address && (
                                      <p className="text-xs text-gray-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {hotel.address}
                                      </p>
                                    )}
                                    {hotel.amenities && hotel.amenities.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {hotel.amenities.slice(0, 2).map((amenity: string, i: number) => (
                                          <span key={i} className="text-[10px] bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100 font-medium">
                                            {amenity}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    <button
                                      onClick={() => {
                                        if (isSelected) {
                                          removeDayHotelMutation.mutate({
                                            tripId: parseInt(tripId),
                                            dayNumber: selectedDay,
                                          });
                                          if (trip?.TripDays) {
                                            recalculateAccommodationBudget(
                                              trip.TripDays, trip.budget, selectedDay, null,
                                            );
                                          }
                                        } else {
                                          setDayHotelMutation.mutate({
                                            tripId: parseInt(tripId),
                                            dayNumber: selectedDay,
                                            data: {
                                              hotelId: hotel.id,
                                              checkinTime: "14:00",
                                              checkoutTime: "12:00",
                                            },
                                          });
                                          if (trip?.TripDays) {
                                            recalculateAccommodationBudget(
                                              trip.TripDays, trip.budget, selectedDay, hotel,
                                            );
                                          }
                                        }
                                      }}
                                      disabled={
                                        setDayHotelMutation.isPending ||
                                        removeDayHotelMutation.isPending
                                      }
                                      className={`w-full mt-3 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                        isSelected
                                          ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                                          : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm hover:shadow-md"
                                      } disabled:opacity-50`}
                                    >
                                      {isSelected
                                        ? "Remove Hotel"
                                        : "Select for Day " + selectedDay}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {hotelsData.last_page > 1 && (
                            <div className="mt-8 pb-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() =>
                                        setHotelsPage((p) => Math.max(1, p - 1))
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        hotelsPage === 1 &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                  {Array.from({
                                    length: hotelsData.last_page,
                                  }).map((_, i) => {
                                    const page = i + 1;
                                    if (
                                      page === 1 ||
                                      page === hotelsData.last_page ||
                                      (page >= hotelsPage - 1 &&
                                        page <= hotelsPage + 1)
                                    ) {
                                      return (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            isActive={page === hotelsPage}
                                            onClick={() => setHotelsPage(page)}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    } else if (
                                      page === hotelsPage - 2 ||
                                      page === hotelsPage + 2
                                    ) {
                                      return <PaginationEllipsis key={page} />;
                                    }
                                    return null;
                                  })}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() =>
                                        setHotelsPage((p) =>
                                          Math.max(
                                            1,
                                            Math.min(
                                              hotelsData.last_page || 1,
                                              p + 1,
                                            ),
                                          ),
                                        )
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        hotelsPage ===
                                          (hotelsData.last_page || 1) &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-16 text-center flex flex-col items-center">
                          <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mb-4">
                            <Bed className="w-8 h-8 text-purple-200" />
                          </div>
                          <h3 className="font-bold text-gray-700 mb-2">
                            No Hotels Found
                          </h3>
                          <p className="text-sm text-gray-400 max-w-sm">
                            No hotels available in your selected provinces. Try
                            adjusting your trip location.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- SAVED TAB --- */}
                  {activeTab === "saved" && (
                    <div className="flex-1 overflow-y-auto px-3 sm:px-5 py-4 sm:py-6 space-y-6">
                      <div className="flex items-center gap-2 pb-2">
                        <button
                          onClick={() => {
                            setSavedType("place");
                            setSavedPage(1);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            savedType === "place"
                              ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Saved Places
                        </button>
                        <button
                          onClick={() => {
                            setSavedType("event");
                            setSavedPage(1);
                          }}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                            savedType === "event"
                              ? "bg-rose-500 text-white shadow-sm shadow-rose-200"
                              : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          Saved Events
                        </button>
                      </div>

                      {savedLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[200px] text-gray-400">
                          <Loader2 className="w-8 h-8 animate-spin mb-3 text-rose-400" />
                          <p className="text-sm">Loading saved items...</p>
                        </div>
                      ) : savedData && savedData.data.length > 0 ? (
                        <>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {savedData.data.map((item: any) => (
                              <PlannerCard
                                key={item.id}
                                item={item}
                                type={savedType}
                                onAdd={() =>
                                  addItemMutation.mutate({
                                    tripId: parseInt(tripId),
                                    dayNumber: selectedDay,
                                    item: {
                                      item_type: savedType as "place" | "event",
                                      item_id: item.id,
                                      order: currentDay?.items.length
                                        ? currentDay.items.length + 1
                                        : 1,
                                      start_time: "09:00",
                                      end_time: "10:00",
                                    },
                                  })
                                }
                                isAdded={
                                  trip?.TripDays?.some((d) =>
                                    d.items?.some((i) =>
                                      savedType === "place"
                                        ? i.place?.id === item.id
                                        : i.event?.id === item.id,
                                    ),
                                  ) || false
                                }
                              />
                            ))}
                          </div>

                          {savedData.last_page > 1 && (
                            <div className="mt-8 pb-4">
                              <Pagination>
                                <PaginationContent>
                                  <PaginationItem>
                                    <PaginationPrevious
                                      onClick={() =>
                                        setSavedPage((p) => Math.max(1, p - 1))
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        savedPage === 1 &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                  {Array.from({
                                    length: savedData.last_page,
                                  }).map((_, i) => {
                                    const page = i + 1;
                                    if (
                                      page === 1 ||
                                      page === savedData.last_page ||
                                      (page >= savedPage - 1 &&
                                        page <= savedPage + 1)
                                    ) {
                                      return (
                                        <PaginationItem key={page}>
                                          <PaginationLink
                                            isActive={page === savedPage}
                                            onClick={() => setSavedPage(page)}
                                            className="cursor-pointer"
                                          >
                                            {page}
                                          </PaginationLink>
                                        </PaginationItem>
                                      );
                                    } else if (
                                      page === savedPage - 2 ||
                                      page === savedPage + 2
                                    ) {
                                      return <PaginationEllipsis key={page} />;
                                    }
                                    return null;
                                  })}
                                  <PaginationItem>
                                    <PaginationNext
                                      onClick={() =>
                                        setSavedPage((p) =>
                                          Math.max(
                                            1,
                                            Math.min(
                                              savedData.last_page || 1,
                                              p + 1,
                                            ),
                                          ),
                                        )
                                      }
                                      className={cn(
                                        "cursor-pointer",
                                        savedPage ===
                                          (savedData.last_page || 1) &&
                                          "pointer-events-none opacity-50",
                                      )}
                                    />
                                  </PaginationItem>
                                </PaginationContent>
                              </Pagination>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-16 text-center flex flex-col items-center">
                          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mb-4">
                            <Heart className="w-8 h-8 text-rose-200" />
                          </div>
                          <h3 className="font-bold text-gray-700 mb-2">
                            No Saved{" "}
                            {savedType === "place" ? "Places" : "Events"}
                          </h3>
                          <p className="text-sm text-gray-400 max-w-sm">
                            Items you save in this app will appear here for easy
                            planning.
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* --- BUDGET TAB --- */}
                  {activeTab === "budget" && (
                    <div className="flex-1 flex flex-col bg-[#f8f9fa] overflow-hidden">
                      <div className="flex items-center justify-between px-3 sm:px-5 py-4 border-b border-gray-100 bg-white shrink-0">
                        <div>
                          <h3 className="font-bold text-gray-900 text-[1.05rem]">
                            Trip Budget
                          </h3>
                          <p className="text-xs text-gray-400">
                            Manage your estimated expenses
                          </p>
                        </div>
                        <button
                          onClick={() => setIsEditBudgetOpen(true)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit Budget
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto">
                        <BudgetPanel
                          data={trip.budget || { total: 0, categories: [] }}
                          daysCount={trip.TripDays?.length || 1}
                          onUpdateBudget={(newData) => {
                            updateTripMutation.mutate({
                              id: parseInt(tripId),
                              data: { budget: newData },
                            });
                          }}
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-around gap-2 safe-area-inset-bottom">
          <button
            onClick={() => setActiveMobilePanel("itinerary")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeMobilePanel === "itinerary"
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-500"
            }`}
          >
            <List className="w-5 h-5" />
            <span className="text-[10px] font-medium">Itinerary</span>
          </button>
          <button
            onClick={() => setActiveMobilePanel("discover")}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
              activeMobilePanel === "discover"
                ? "text-emerald-600 bg-emerald-50"
                : "text-gray-500"
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span className="text-[10px] font-medium">Discover</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function PlannerCard({
  item,
  type,
  onAdd,
  isAdded,
}: {
  item: any;
  type: string;
  onAdd: () => void;
  isAdded: boolean;
}) {
  const imageUrl = item.thumbnail_url || null;
  const categories = item.categories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`bg-white rounded-2xl overflow-hidden border transition-all duration-300 group flex flex-col h-full ${
        isAdded 
          ? "border-sky-200 shadow-md ring-1 ring-sky-100" 
          : "border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200"
      }`}
    >
      {/* Image */}
      <div className="relative h-32 overflow-hidden shrink-0">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={item.name_en || item.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
            <MapPin className="w-8 h-8 text-gray-300" />
          </div>
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span className="text-[10px] font-bold bg-white/95 backdrop-blur-sm text-gray-700 px-2 py-1 rounded-lg shadow-sm border border-gray-100">
            {categories[0] || type}
          </span>
        </div>

        {/* Rating badge */}
        {item.rating && (
          <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
            <span className="text-[11px] font-bold text-gray-800">{item.rating}</span>
          </div>
        )}

        {/* Added checkmark */}
        {isAdded && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-sky-500 flex items-center justify-center shadow-lg">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3.5 flex flex-col flex-1">
        <div className="mb-2 flex-1">
          <h4
            className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug group-hover:text-sky-600 transition-colors"
            title={item.name_en || item.name}
          >
            {item.name_en || item.name}
          </h4>
          {item.name !== item.name_en && (
            <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">
              {item.name}
            </p>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          disabled={isAdded}
          className={`w-full py-2 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 ${
            isAdded
              ? "bg-sky-50 text-sky-600 border border-sky-200 cursor-default"
              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-sky-500 hover:text-white hover:border-sky-500 hover:shadow-md"
          }`}
        >
          {isAdded ? (
            <>
              <Check className="w-3.5 h-3.5" />
              Added
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              Add to Day
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
