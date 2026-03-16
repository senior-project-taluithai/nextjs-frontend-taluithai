"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MapPin, Calendar, Clock, MoreVertical, Trash2, CheckCircle2, Map as MapIcon, List, Sparkles, Navigation, Search, X, ChevronLeft, ChevronRight, Loader2, GripVertical, ChevronUp, ChevronDown, Edit2, Heart, SlidersHorizontal, Check, AlertCircle, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination";
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
    useReorderTripDayItems
} from "@/hooks/api/useTrips";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TripTimelineItem } from '@/components/my-trip/trip-timeline-item';
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// Dynamically import TripMap to avoid SSR issues
const TripMap = dynamic(() => import("@/components/my-trip/trip-map"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">Loading Map...</div>
});

import { EditTripDialog } from "@/components/my-trip/edit-trip-dialog";
import { RecommendationSection } from "@/components/my-trip/recommendation-section";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
    draft: { label: "Draft", color: "text-gray-500", bg: "bg-gray-100", dot: "bg-gray-400" },
    planned: { label: "Planned", color: "text-blue-600", bg: "bg-blue-50", dot: "bg-blue-500" },
    upcoming: { label: "Upcoming", color: "text-amber-600", bg: "bg-amber-50", dot: "bg-amber-500" },
    completed: { label: "Completed", color: "text-emerald-600", bg: "bg-emerald-50", dot: "bg-emerald-500" },
};

export default function TripDetailPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = use(params);
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [orderedItems, setOrderedItems] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<string>("places");
    const [isEditTripOpen, setIsEditTripOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Filter States for "All Places"
    const [filters, setFilters] = useState<any>({});
    const [placesPage, setPlacesPage] = useState(1);
    const [eventsPage, setEventsPage] = useState(1);
    const [savedPage, setSavedPage] = useState(1);
    const [savedType, setSavedType] = useState<'place' | 'event'>('place');
    const [recommendationsPage, setRecommendationsPage] = useState(1);
    const [showMap, setShowMap] = useState(false);
    const ITEMS_PER_PAGE = 12; // increased for a nicer grid
    const RECOMMENDATIONS_PER_PAGE = 8;

    const handleSetFilters = (updater: any) => {
        setFilters((prev: any) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            if (JSON.stringify(prev) !== JSON.stringify(next)) {
                setPlacesPage(1);
                setEventsPage(1);
            }
            return next;
        });
    };

    // Load trip data from API
    const { data: trip, isLoading: tripLoading, error: tripError } = useTrip(parseInt(tripId));

    // Load recommendations
    const { data: recommendedPlaces, isLoading: recommendationsLoading } = useTripRecommendedPlaces(
        parseInt(tripId),
        recommendationsPage,
        RECOMMENDATIONS_PER_PAGE
    );

    // Load places with filters
    const { data: placesData, isLoading: placesLoading } = useTripPlaces(
        parseInt(tripId),
        { ...filters, page: placesPage, limit: ITEMS_PER_PAGE }
    );

    // Load events
    const { data: eventsData, isLoading: eventsLoading } = useTripEvents(
        parseInt(tripId),
        { ...filters, page: eventsPage, limit: ITEMS_PER_PAGE }
    );

    // Load saved items
    const { data: savedData, isLoading: savedLoading } = useTripSavedItems(
        parseInt(tripId),
        savedType,
        savedPage,
        ITEMS_PER_PAGE
    );

    // Mutations
    const addItemMutation = useAddTripDayItem();
    const removeItemMutation = useRemoveTripDayItem();
    const updateItemMutation = useUpdateTripDayItem();
    const reorderItemMutation = useReorderTripDayItems();
    const deleteTripMutation = useDeleteTrip();

    const sortedDays = useMemo(() => {
        if (!trip?.TripDays) return [];
        return [...trip.TripDays].sort((a, b) => a.day_number - b.day_number);
    }, [trip?.TripDays]);

    const currentDay = sortedDays.find(d => d.day_number === selectedDay);



    useEffect(() => {
        if (currentDay?.items) {
            setOrderedItems(currentDay.items);
        }
    }, [currentDay]);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
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
                            order: index + 1 // 1-based index
                        }))
                    }
                });

                return newItems;
            });
        }
    };

    // Collect all items for the map
    const mapItems = useMemo(() => {
        if (!currentDay) return [];
        return currentDay.items.map(item => {
            const detail = item.place || item.event;
            if (!detail) return null;
            return {
                id: detail.id,
                type: item.place ? 'place' : 'event',
                name: detail.name,
                name_en: detail.name_en,
                latitude: detail.latitude,
                longitude: detail.longitude,
                rating: detail.rating,
                thumbnail_url: detail.thumbnail_url
            };
        }).filter((item): item is NonNullable<typeof item> => item !== null && !!item.latitude && !!item.longitude);
    }, [currentDay]);


    // Loading state - must be before any early returns
    if (!trip) {
        return <div className="p-8 text-center text-muted-foreground">Loading trip...</div>;
    }



    const checkIsAdded = (type: 'place' | 'event', id: number) => {
        // Simple check if item exists in ANY day of the trip
        return sortedDays.some(day =>
            day.items.some(item =>
                (type === 'place' && item.place_id === id) ||
                (type === 'event' && item.event_id === id)
            )
        );
    };

    const handleAddToDay = (item: any, type: 'place' | 'event') => {
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
            }
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
                    toast.success('Item removed from timeline');
                },
                onError: (error: any) => {
                    toast.error(`Failed to remove item: ${error.message}`);
                },
            }
        );
    };

    const handleTimeChange = (itemId: number, field: 'start_time' | 'end_time', value: string) => {
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
                    toast.success('Time updated');
                },
                onError: (error: any) => {
                    toast.error(`Failed to update time: ${error.message}`);
                },
            }
        );
    }

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
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading trip details...</p>
                </div>
            </div>
        );
    }

    const statusConfig = STATUS_CONFIG[trip.status] || STATUS_CONFIG.draft;

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f8f9fa]">
            {/* ── Top Header Bar ── */}
            <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shadow-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/my-trip")}
                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="font-bold text-gray-900" style={{ fontSize: "1rem" }}>
                                {trip.name}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot}`} />
                                {statusConfig.label}
                            </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            <span>{format(new Date(trip.start_date), "MMM d")} – {format(new Date(trip.end_date), "MMM d, yyyy")}</span>
                            {trip.provinces && trip.provinces.length > 0 && (
                                <>
                                    <span className="text-gray-300">•</span>
                                    <MapPin className="w-3 h-3" />
                                    <span>{trip.provinces.map((p: any) => p.name_en).join(', ')}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsEditTripOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    >
                        <Edit2 className="w-3.5 h-3.5" />
                        Edit
                    </button>

                    <button
                        onClick={() => setIsDeleteDialogOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-md shadow-red-200"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                    </button>
                </div>
            </div>

            <EditTripDialog
                open={isEditTripOpen}
                onOpenChange={setIsEditTripOpen}
                trip={trip}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your trip
                            and remove all your planned items.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteTrip} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Main Two-Panel Content ── */}
            <div className="flex-1 flex overflow-hidden">
                {/* ── LEFT: Itinerary Panel ── */}
                <div className="w-[430px] shrink-0 flex flex-col bg-white border-r border-gray-100 overflow-hidden">
                    {/* Day tabs */}
                    <div className="flex items-center gap-1.5 px-4 pt-4 pb-3 border-b border-gray-50 overflow-x-auto scrollbar-none">
                        {sortedDays.map((day) => (
                            <button
                                key={day.id}
                                onClick={() => setSelectedDay(day.day_number)}
                                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shrink-0 ${selectedDay === day.day_number
                                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-200"
                                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                    }`}
                            >
                                Day {day.day_number}
                            </button>
                        ))}
                        <button className="w-9 h-9 shrink-0 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-400 transition-colors">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Date header + cost summary */}
                    <div className="px-4 py-3 flex items-center justify-between">
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">
                                {currentDay ? format(new Date(currentDay.date), "EEEE, MMMM do") : 'Select a Day'}
                            </p>
                            <p className="text-xs text-gray-400">{currentDay?.items.length || 0} places planned</p>
                        </div>
                    </div>

                    {/* Place list */}
                    <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2.5">
                        {currentDay?.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/50">
                                <Plus className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm font-medium">No items yet</p>
                                <p className="text-xs opacity-70">Add from map or suggestions on the right</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={orderedItems.map(i => i.id)}
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

                        {/* Add place button inside timeline (future enhancement) */}
                        {currentDay?.items.length !== 0 && (
                            <div className="pt-2">
                                <button className="w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 hover:border-emerald-400 text-gray-400 hover:text-emerald-600 text-sm font-medium transition-all duration-200 flex items-center justify-center gap-2 group">
                                    <Plus className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                    Add place to Day {selectedDay}
                                </button>
                            </div>
                        )}
                    </div>


                </div>

                {/* ── RIGHT: Discover or Map ── */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Right panel tab bar */}
                    <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-100 shrink-0">
                        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                            {(["places", "events", "saved"] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => { setActiveTab(tab); setShowMap(false); }}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize shrink-0 ${activeTab === tab && !showMap
                                        ? "bg-gray-100 text-gray-900"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                        }`}
                                >
                                    {tab === "places" && <MapPin className="w-3.5 h-3.5" />}
                                    {tab === "events" && <Calendar className="w-3.5 h-3.5" />}
                                    {tab === "saved" && <Heart className="w-3.5 h-3.5" />}
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setShowMap(!showMap)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 shrink-0 ${showMap ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                        >
                            <MapIcon className="w-4 h-4" />
                            Map View
                        </button>
                    </div>

                    {/* Content Areas */}
                    <div className="flex-1 overflow-hidden relative">
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
                                    <TripMap items={mapItems} />
                                    {/* Place markers legend */}
                                    <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl p-4 min-w-[200px] border border-gray-100 hidden md:block">
                                        <p className="text-xs font-bold text-gray-700 mb-3 flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Day {selectedDay} Places
                                        </p>
                                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
                                            {currentDay?.items.map((p, i) => (
                                                <div key={p.id} className="flex items-center gap-2.5">
                                                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{i + 1}</div>
                                                    <p className="text-xs text-gray-600 line-clamp-1">{p.place?.name_en || p.place?.name || p.event?.name_en || p.event?.name}</p>
                                                </div>
                                            ))}
                                            {(!currentDay?.items || currentDay.items.length === 0) && (
                                                <p className="text-xs text-gray-400 italic">No places added yet</p>
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
                                    className="h-full overflow-y-auto bg-[#f8f9fa]"
                                >
                                    {/* --- PLACES TAB --- */}
                                    {activeTab === 'places' && (
                                        <div className="px-5 py-4 space-y-8">
                                            <RecommendationSection
                                                title="Recommended for You"
                                                icon={Sparkles}
                                                items={recommendedPlaces?.data}
                                                type="place"
                                                onAdd={(item: any, type: string) => addItemMutation.mutate({
                                                    tripId: parseInt(tripId),
                                                    dayNumber: selectedDay,
                                                    item: {
                                                        item_type: type as "place" | "event",
                                                        item_id: item.id,
                                                        order: currentDay?.items.length ? currentDay.items.length + 1 : 1,
                                                        start_time: "09:00",
                                                        end_time: "10:00",
                                                    }
                                                })}
                                                checkIsAdded={(type: string, id: number) => {
                                                    return trip?.TripDays?.some(d =>
                                                        d.items?.some(i => i[type as 'place' | 'event']?.id === id)
                                                    ) || false;
                                                }}
                                            />

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="font-bold text-gray-900 text-[1.05rem]">
                                                        All in {trip.provinces && trip.provinces.length > 0 ? trip.provinces.map((p: any) => p.name_en).join(' & ') : 'Selected Provinces'}
                                                    </h3>
                                                </div>

                                                {/* Search and Filter Bar */}
                                                <div className="flex gap-2 sticky top-0 z-10 bg-[#f8f9fa]/90 backdrop-blur-md pt-1 pb-3 -mx-1 px-1">
                                                    <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-emerald-100 focus-within:border-emerald-300 transition-all">
                                                        <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                                        <input
                                                            type="text"
                                                            placeholder="Search places..."
                                                            value={filters.search || ""}
                                                            onChange={(e) => handleSetFilters((prev: any) => ({ ...prev, search: e.target.value }))}
                                                            className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                                                        />
                                                        {filters.search && (
                                                            <button
                                                                onClick={() => handleSetFilters((prev: any) => ({ ...prev, search: "" }))}
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
                                                                {Object.keys(filters).filter(k => k !== 'search' && k !== 'page' && filters[k]).length > 0 && (
                                                                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
                                                                )}
                                                            </button>
                                                        </SheetTrigger>
                                                        <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
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
                                                            <Loader2 className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                                                            <p className="text-sm">Loading places...</p>
                                                        </div>
                                                    ) : placesData && placesData.data.length > 0 ? (
                                                        placesData.data.map((place: any) => (
                                                            <PlannerCard
                                                                key={place.id}
                                                                item={place}
                                                                type="place"
                                                                onAdd={() => addItemMutation.mutate({
                                                                    tripId: parseInt(tripId),
                                                                    dayNumber: selectedDay,
                                                                    item: {
                                                                        item_type: "place",
                                                                        item_id: place.id,
                                                                        order: currentDay?.items.length ? currentDay.items.length + 1 : 1,
                                                                        start_time: "09:00",
                                                                        end_time: "10:00",
                                                                    }
                                                                })}
                                                                isAdded={trip?.TripDays?.some(d =>
                                                                    d.items?.some(i => i.place?.id === place.id)
                                                                ) || false}
                                                            />
                                                        ))
                                                    ) : (
                                                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white/50">
                                                            <Search className="w-10 h-10 mb-3 opacity-20" />
                                                            <p className="text-sm font-medium text-gray-500">No places found</p>
                                                            <p className="text-xs mt-1">Try adjusting your search or filters.</p>
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
                                                                        onClick={() => setPlacesPage(p => Math.max(1, p - 1))}
                                                                        className={cn("cursor-pointer", placesPage === 1 && "pointer-events-none opacity-50")}
                                                                    />
                                                                </PaginationItem>
                                                                {Array.from({ length: placesData.last_page }).map((_, i) => {
                                                                    const page = i + 1;
                                                                    if (page === 1 || page === placesData.last_page || (page >= placesPage - 1 && page <= placesPage + 1)) {
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
                                                                    } else if (page === placesPage - 2 || page === placesPage + 2) {
                                                                        return <PaginationEllipsis key={page} />;
                                                                    }
                                                                    return null;
                                                                })}
                                                                <PaginationItem>
                                                                    <PaginationNext
                                                                        onClick={() => setPlacesPage(p => Math.max(1, Math.min(placesData.last_page || 1, p + 1)))}
                                                                        className={cn("cursor-pointer", placesPage === (placesData.last_page || 1) && "pointer-events-none opacity-50")}
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
                                    {activeTab === 'events' && (
                                        <div className="px-5 py-6 space-y-6">
                                            {/* Search and Filter Bar for Events */}
                                            <div className="flex gap-2 sticky top-0 z-10 bg-[#f8f9fa]/90 backdrop-blur-md pt-1 pb-3 -mx-1 px-1">
                                                <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-amber-100 focus-within:border-amber-300 transition-all">
                                                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search events..."
                                                        value={filters.search || ""}
                                                        onChange={(e) => handleSetFilters((prev: any) => ({ ...prev, search: e.target.value }))}
                                                        className="flex-1 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                                                    />
                                                    {filters.search && (
                                                        <button
                                                            onClick={() => handleSetFilters((prev: any) => ({ ...prev, search: "" }))}
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
                                                            {Object.keys(filters).filter(k => k !== 'search' && k !== 'page' && filters[k]).length > 0 && (
                                                                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
                                                            )}
                                                        </button>
                                                    </SheetTrigger>
                                                    <SheetContent side="right" className="w-full sm:w-[400px] overflow-y-auto">
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

                                            <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 flex items-start gap-4 text-amber-900 shadow-sm">
                                                <div className="w-10 h-10 rounded-xl bg-amber-100/80 flex items-center justify-center shrink-0">
                                                    <Calendar className="w-5 h-5 text-amber-600" />
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-sm mb-1">Filtered by Trip Dates</h4>
                                                    <p className="text-xs opacity-80 leading-relaxed">
                                                        Showing events happening between <strong className="font-semibold">{format(new Date(trip.start_date), 'MMM do')}</strong> and <strong className="font-semibold">{format(new Date(trip.end_date), 'MMM do, yyyy')}</strong> in your selected provinces.
                                                    </p>
                                                </div>
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
                                                                onAdd={() => addItemMutation.mutate({
                                                                    tripId: parseInt(tripId),
                                                                    dayNumber: selectedDay,
                                                                    item: {
                                                                        item_type: "event",
                                                                        item_id: event.id,
                                                                        order: currentDay?.items.length ? currentDay.items.length + 1 : 1,
                                                                        start_time: "09:00",
                                                                        end_time: "10:00",
                                                                    }
                                                                })}
                                                                isAdded={trip?.TripDays?.some(d =>
                                                                    d.items?.some(i => i.event?.id === event.id)
                                                                ) || false}
                                                            />
                                                        ))}
                                                    </div>

                                                    {eventsData.last_page > 1 && (
                                                        <div className="mt-8 pb-4">
                                                            <Pagination>
                                                                <PaginationContent>
                                                                    <PaginationItem>
                                                                        <PaginationPrevious
                                                                            onClick={() => setEventsPage(p => Math.max(1, p - 1))}
                                                                            className={cn("cursor-pointer", eventsPage === 1 && "pointer-events-none opacity-50")}
                                                                        />
                                                                    </PaginationItem>
                                                                    {Array.from({ length: eventsData.last_page }).map((_, i) => {
                                                                        const page = i + 1;
                                                                        if (page === 1 || page === eventsData.last_page || (page >= eventsPage - 1 && page <= eventsPage + 1)) {
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
                                                                        } else if (page === eventsPage - 2 || page === eventsPage + 2) {
                                                                            return <PaginationEllipsis key={page} />;
                                                                        }
                                                                        return null;
                                                                    })}
                                                                    <PaginationItem>
                                                                        <PaginationNext
                                                                            onClick={() => setEventsPage(p => Math.max(1, Math.min(eventsData.last_page || 1, p + 1)))}
                                                                            className={cn("cursor-pointer", eventsPage === (eventsData.last_page || 1) && "pointer-events-none opacity-50")}
                                                                        />
                                                                    </PaginationItem>
                                                                </PaginationContent>
                                                            </Pagination>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="py-16 text-center flex flex-col items-center">
                                                    <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mb-4">
                                                        <Calendar className="w-8 h-8 text-amber-200" />
                                                    </div>
                                                    <h3 className="font-bold text-gray-700 mb-2">No Events Found</h3>
                                                    <p className="text-sm text-gray-400 max-w-sm">There are no upcoming events in your selected area during your travel dates.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* --- SAVED TAB --- */}
                                    {activeTab === 'saved' && (
                                        <div className="px-5 py-6 space-y-6">
                                            <div className="flex items-center gap-2 pb-2">
                                                <button
                                                    onClick={() => { setSavedType('place'); setSavedPage(1); }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${savedType === 'place' ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    Saved Places
                                                </button>
                                                <button
                                                    onClick={() => { setSavedType('event'); setSavedPage(1); }}
                                                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${savedType === 'event' ? "bg-rose-500 text-white shadow-sm shadow-rose-200" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
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
                                                                onAdd={() => addItemMutation.mutate({
                                                                    tripId: parseInt(tripId),
                                                                    dayNumber: selectedDay,
                                                                    item: {
                                                                        item_type: savedType as "place" | "event",
                                                                        item_id: item.id,
                                                                        order: currentDay?.items.length ? currentDay.items.length + 1 : 1,
                                                                        start_time: "09:00",
                                                                        end_time: "10:00",
                                                                    }
                                                                })}
                                                                isAdded={trip?.TripDays?.some(d =>
                                                                    d.items?.some(i => savedType === 'place' ? i.place?.id === item.id : i.event?.id === item.id)
                                                                ) || false}
                                                            />
                                                        ))}
                                                    </div>

                                                    {savedData.last_page > 1 && (
                                                        <div className="mt-8 pb-4">
                                                            <Pagination>
                                                                <PaginationContent>
                                                                    <PaginationItem>
                                                                        <PaginationPrevious
                                                                            onClick={() => setSavedPage(p => Math.max(1, p - 1))}
                                                                            className={cn("cursor-pointer", savedPage === 1 && "pointer-events-none opacity-50")}
                                                                        />
                                                                    </PaginationItem>
                                                                    {Array.from({ length: savedData.last_page }).map((_, i) => {
                                                                        const page = i + 1;
                                                                        if (page === 1 || page === savedData.last_page || (page >= savedPage - 1 && page <= savedPage + 1)) {
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
                                                                        } else if (page === savedPage - 2 || page === savedPage + 2) {
                                                                            return <PaginationEllipsis key={page} />;
                                                                        }
                                                                        return null;
                                                                    })}
                                                                    <PaginationItem>
                                                                        <PaginationNext
                                                                            onClick={() => setSavedPage(p => Math.max(1, Math.min(savedData.last_page || 1, p + 1)))}
                                                                            className={cn("cursor-pointer", savedPage === (savedData.last_page || 1) && "pointer-events-none opacity-50")}
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
                                                    <h3 className="font-bold text-gray-700 mb-2">No Saved {savedType === 'place' ? 'Places' : 'Events'}</h3>
                                                    <p className="text-sm text-gray-400 max-w-sm">Items you save in this app will appear here for easy planning.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}


                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
}

function PlannerCard({ item, type, onAdd, isAdded }: { item: any; type: string; onAdd: () => void; isAdded: boolean }) {
    const imageUrl = item.thumbnail_url || null;
    const categories = item.categories || [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow group flex flex-col h-full"
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
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-gray-200" />
                    </div>
                )}

                {/* Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                        {item.best_season || 'All Year'}
                    </span>
                </div>
                <div className="absolute top-2 right-2">
                    <span className="text-[10px] font-bold bg-white/90 backdrop-blur-sm text-gray-700 px-2 py-0.5 rounded-full shadow-sm uppercase tracking-wider border border-gray-100">
                        {categories[0] || type}
                    </span>
                </div>

                {/* Added Overlay - subtle tint */}
                {isAdded && (
                    <div className="absolute inset-0 bg-emerald-500/10 backdrop-blur-[0.5px] pointer-events-none" />
                )}
            </div>

            {/* Info */}
            <div className="p-3 flex flex-col flex-1">
                <div className="mb-2">
                    <h4 className="text-xs font-bold text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-600 transition-colors" title={item.name_en || item.name}>
                        {item.name_en || item.name}
                    </h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-1">
                        {item.name}
                    </p>
                </div>

                <div className="flex items-center gap-1 mb-3 mt-auto">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs font-bold text-gray-700">{item.rating || '4.0'}</span>
                    <span className="text-[10px] text-gray-400 font-medium ml-0.5">({Math.floor(Math.random() * 200 + 50)})</span>
                </div>

                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(); }}
                    disabled={isAdded}
                    className={`w-full py-1.5 rounded-xl text-[11px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${isAdded
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200 cursor-default"
                        : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200"
                        }`}
                >
                    {isAdded ? (
                        <>
                            <Check className="w-3.5 h-3.5" />
                            Added to Timeline
                        </>
                    ) : (
                        <>
                            Add to Timeline
                            <Plus className="w-3.5 h-3.5" />
                        </>
                    )}
                </button>
            </div>
        </motion.div>
    );
}
