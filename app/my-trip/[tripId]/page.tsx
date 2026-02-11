"use client";

import { use, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, MapPin, Calendar, Clock, MoreVertical, Trash2, CheckCircle2, Map as MapIcon, List, Sparkles, Mountain, Landmark, Search, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";
import {
    useTrip,
    useTripRecommendedPlaces,
    useTripPlaces,
    useAddTripDayItem,
    useRemoveTripDayItem,
    useUpdateTripDayItem
} from "@/hooks/api/useTrips";
import { toast } from "sonner";

// Dynamically import TripMap to avoid SSR issues
const TripMap = dynamic(() => import("@/components/my-trip/trip-map"), {
    ssr: false,
    loading: () => <div className="w-full h-full flex items-center justify-center bg-muted text-muted-foreground">Loading Map...</div>
});

const RecommendationSection = ({ title, icon: Icon, items, type, onAdd, checkIsAdded }: any) => {
    if (!items || items.length === 0) return null;
    return (
        <div className="mb-8">
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-primary">
                {Icon && <Icon className="w-4 h-4" />}
                {title}
            </h3>
            {/* Horizontal Scroll for Recommendations */}
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-transparent snap-x">
                {items.map((item: any) => (
                    <div key={item.id} className="min-w-[280px] w-[280px] snap-start">
                        <PlannerCard
                            item={item}
                            type={type}
                            onAdd={() => onAdd(item, type)}
                            isAdded={checkIsAdded(type, item.id)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function TripPlannerPage({ params }: { params: Promise<{ tripId: string }> }) {
    const { tripId } = use(params);
    const router = useRouter();
    const [selectedDay, setSelectedDay] = useState<number>(1);
    const [activeTab, setActiveTab] = useState<string>("places");

    // Filter States for "All Places"
    const [searchText, setSearchText] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string>("");
    const [placesPage, setPlacesPage] = useState(1);
    const [recommendationsPage, setRecommendationsPage] = useState(1);
    const ITEMS_PER_PAGE = 8;
    const RECOMMENDATIONS_PER_PAGE = 8;

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
        placesPage,
        ITEMS_PER_PAGE,
        searchText,
        selectedCategory
    );

    // Debug: Log API responses
    useEffect(() => {
        if (recommendedPlaces) {
            console.log('Recommended Places Response:', recommendedPlaces);
            if (recommendedPlaces.data && recommendedPlaces.data.length > 0) {
                console.log('First recommended place:', recommendedPlaces.data[0]);
            }
        }
    }, [recommendedPlaces]);

    useEffect(() => {
        if (placesData) {
            console.log('Places Data Response:', placesData);
            if (placesData.data && placesData.data.length > 0) {
                console.log('First place:', placesData.data[0]);
            }
        }
    }, [placesData]);

    // Mutations
    const addItemMutation = useAddTripDayItem();
    const removeItemMutation = useRemoveTripDayItem();
    const updateItemMutation = useUpdateTripDayItem();

    // Reset pagination when filters change
    useEffect(() => {
        setPlacesPage(1);
    }, [searchText, selectedCategory]);

    // No more mock data - use only real API data
    // Recommendations come from useTripRecommendedPlaces
    // Places come from useTripPlaces
    // Events would need a separate hook (not implemented yet)

    // Sort trip days by day_number
    const sortedDays = useMemo(() => {
        if (!trip?.TripDays) return [];
        return [...trip.TripDays].sort((a, b) => a.day_number - b.day_number);
    }, [trip?.TripDays]);

    // Collect all items for the map
    // TODO: Implement proper fetching of place/event details for map display
    const mapItems = useMemo(() => {
        // For now, return empty until we implement fetching place/event details
        // from trip day items (which only have IDs)
        return [];
    }, [trip]);


    // Loading state - must be before any early returns
    if (!trip) {
        return <div className="p-8 text-center text-muted-foreground">Loading trip...</div>;
    }

    const currentDay = sortedDays.find(d => d.day_number === selectedDay);

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

    // Error state
    if (tripError || !trip) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <p className="text-destructive mb-4">Failed to load trip</p>
                    <Button onClick={() => router.push('/my-trip')}>Back to Trips</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Header */}
            <header className="flex-none h-16 border-b flex items-center px-4 justify-between bg-card z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/my-trip')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {trip.name}
                            <Badge variant={trip.status === 'draft' ? "outline" : "default"} className="capitalize">
                                {trip.status}
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            {new Date(trip.start_date).toLocaleDateString()} - {new Date(trip.end_date).toLocaleDateString()}
                            {trip.provinces && trip.provinces.length > 0 ? ` • ${trip.provinces.map(p => p.name_en).join(', ')}` : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">Share</Button>
                    <Button size="sm">Save Changes</Button>
                </div>
            </header>

            {/* Main Content (Split View) */}
            <main className="flex-1 flex overflow-hidden">

                {/* Left: Timeline Planner */}
                <div className="w-[450px] flex-none border-r bg-slate-50 dark:bg-slate-900/50 flex flex-col">
                    <div className="p-4 border-b bg-card">
                        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                            {sortedDays.map((day) => (
                                <button
                                    key={day.id}
                                    onClick={() => setSelectedDay(day.day_number)}
                                    className={`flex-none px-4 py-2 rounded-full text-sm font-medium transition-colors border ${selectedDay === day.day_number
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-background text-foreground hover:bg-muted"
                                        }`}
                                >
                                    Day {day.day_number}
                                </button>
                            ))}
                            <Button variant="ghost" size="icon" className="rounded-full ml-1" title="Add Day">
                                <Plus className="w-4 h-4" />
                            </Button>
                        </div>
                        <div className="text-sm font-semibold mt-2 px-1">
                            {currentDay ? new Date(currentDay.date).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) : 'Select a Day'}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {currentDay?.items.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-muted-foreground py-12 border-2 border-dashed rounded-xl">
                                <Plus className="w-8 h-8 opacity-20 mb-2" />
                                <p className="text-sm">No items yet</p>
                                <p className="text-xs opacity-70">Add from map or suggestions</p>
                            </div>
                        ) : (
                            currentDay?.items.map((item, index) => {
                                // Backend doesn't include full place/event details yet
                                // Show basic info using IDs for now
                                const type = item.place_id ? 'place' : 'event';
                                const itemId = item.place_id || item.event_id;
                                const itemDetails = item.place || item.event;
                                const name = itemDetails ? (itemDetails.name_en || itemDetails.name) : `${type === 'place' ? 'Place' : 'Event'} #${itemId}`;
                                const imageUrl = itemDetails?.thumbnail_url;

                                return (
                                    <div key={item.id} className="relative group bg-white dark:bg-slate-800 p-3 rounded-lg border shadow-sm flex gap-3">
                                        {/* Timeline Connector */}
                                        {index !== (currentDay.items.length - 1) && (
                                            <div className="absolute left-[1.65rem] top-10 bottom-[-1rem] w-0.5 bg-slate-200 dark:bg-slate-700 -z-10" />
                                        )}

                                        {/* Order Indicator */}
                                        <div className="flex flex-col items-center gap-1 min-w-[3rem]">
                                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${type === 'place' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : 'bg-red-100 text-red-600 dark:bg-red-900/30'}`}>
                                                {index + 1}
                                            </div>
                                            {/* Thumbnail if available */}
                                            {imageUrl && (
                                                <div className="w-10 h-10 rounded-md overflow-hidden mt-1 shadow-sm">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-semibold text-sm truncate pr-6" title={name}>
                                                    {name}
                                                </h4>
                                                <Badge variant="secondary" className="text-[10px] h-5 px-1.5 uppercase">
                                                    {type}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                                <MapPin className="w-3 h-3" />
                                                {item.note || (itemDetails?.province?.name_en || 'No details available')}
                                            </p>

                                            {/* Time Inputs */}
                                            <div className="flex items-center gap-2 mt-3 w-full">
                                                <div className="relative flex-1">
                                                    <Clock className="absolute left-2 top-1.5 w-3 h-3 text-muted-foreground" />
                                                    <Input
                                                        type="time"
                                                        className="h-6 text-xs pl-6"
                                                        value={item.start_time || ""}
                                                        onChange={(e) => handleTimeChange(item.id, 'start_time', e.target.value)}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground">-</span>
                                                <div className="relative flex-1">
                                                    <Input
                                                        type="time"
                                                        className="h-6 text-xs px-1 text-center"
                                                        value={item.end_time || ""}
                                                        onChange={(e) => handleTimeChange(item.id, 'end_time', e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Remove Button */}
                                            <button
                                                onClick={() => handleRemoveFromDay(item.id)}
                                                className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Right: Resources & Suggestions & Map */}
                <div className="flex-1 overflow-hidden bg-background border-l">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <div className="px-4 py-2 border-b flex-none flex justify-between items-center bg-muted/20">
                            <TabsList>
                                <TabsTrigger value="places" className="gap-2"><MapPin className="w-4 h-4" /> Places</TabsTrigger>
                                <TabsTrigger value="events" className="gap-2"><Calendar className="w-4 h-4" /> Events</TabsTrigger>
                                <TabsTrigger value="saved" className="gap-2"><Plus className="w-4 h-4" /> Saved</TabsTrigger>
                            </TabsList>
                            <TabsList>
                                <TabsTrigger value="map" className="gap-2"><MapIcon className="w-4 h-4" /> Map View</TabsTrigger>
                            </TabsList>
                        </div>

                        {/* Content Areas */}
                        <div className="flex-1 overflow-hidden relative">
                            {/* Map View Overlay / Tab */}
                            <TabsContent value="map" className="mt-0 h-full w-full absolute inset-0 z-10 data-[state=inactive]:hidden">
                                <TripMap items={mapItems} />
                                {/* Maybe add a side panel for unassigned items here later? */}
                            </TabsContent>

                            {/* List Views */}
                            <div className={`h-full overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/20 ${activeTab === 'map' ? 'hidden' : 'block'}`}>
                                <TabsContent value="places" className="mt-0 space-y-8">
                                    {/* Recommendations Section (Grid 2x4) */}
                                    <div className="mb-8">
                                        <h3 className="font-semibold mb-4 flex items-center gap-2 text-primary text-lg">
                                            <Sparkles className="w-5 h-5" />
                                            Recommended for You
                                        </h3>
                                        {recommendationsLoading ? (
                                            <div className="text-sm text-muted-foreground">Loading recommendations...</div>
                                        ) : recommendedPlaces && recommendedPlaces.data.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                                {recommendedPlaces.data.map((item: any) => (
                                                    <PlannerCard
                                                        key={item.id}
                                                        item={item}
                                                        type="place"
                                                        onAdd={() => handleAddToDay(item, 'place')}
                                                        isAdded={checkIsAdded('place', item.id)}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-sm text-muted-foreground">No recommendations available.</div>
                                        )}
                                    </div>

                                    {/* All Places Section (Paginated) */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-semibold flex items-center gap-2 text-primary text-lg">
                                                All in {trip.provinces && trip.provinces.length > 0 ? trip.provinces.map(p => p.name_en).join(' & ') : 'Selected Provinces'}
                                            </h3>
                                        </div>

                                        {/* Search and Filter Bar */}
                                        <div className="flex flex-col gap-3 top-0 bg-slate-50/95 dark:bg-slate-900/95 py-3 z-10 backdrop-blur-sm -mx-4 px-4 border-b shadow-sm">
                                            <div className="relative">
                                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Search places..."
                                                    className="pl-9 bg-background"
                                                    value={searchText}
                                                    onChange={(e) => setSearchText(e.target.value)}
                                                />
                                                {searchText && (
                                                    <button
                                                        onClick={() => setSearchText("")}
                                                        className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                                                {categories.map(cat => (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setSelectedCategory(cat)}
                                                        className={cn(
                                                            "px-3 py-1.5 text-xs rounded-full border whitespace-nowrap transition-colors font-medium",
                                                            selectedCategory === cat
                                                                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                                                : "bg-background hover:bg-muted"
                                                        )}
                                                    >
                                                        {cat}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Results Grid (4 cols max) */}
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                            {placesLoading ? (
                                                <div className="col-span-full text-center py-8 text-muted-foreground">Loading places...</div>
                                            ) : placesData && placesData.data.length > 0 ? (
                                                placesData.data.map((place: any) => (
                                                    <PlannerCard
                                                        key={place.id}
                                                        item={place}
                                                        type="place"
                                                        onAdd={() => handleAddToDay(place, 'place')}
                                                        isAdded={checkIsAdded('place', place.id)}
                                                    />
                                                ))
                                            ) : (
                                                <div className="col-span-full py-12 text-center text-muted-foreground">
                                                    No places found matching your search.
                                                </div>
                                            )}
                                        </div>

                                        {/* Pagination Controls */}
                                        {placesData && placesData.lastPage > 1 && (
                                            <div className="flex items-center justify-center gap-2 pt-6 pb-2">
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => setPlacesPage(p => Math.max(1, p - 1))}
                                                    disabled={placesPage === 1}
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>
                                                <span className="text-sm font-medium text-muted-foreground min-w-[80px] text-center">
                                                    Page {placesPage} of {placesData.lastPage}
                                                </span>
                                                <Button
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-9 w-9"
                                                    onClick={() => setPlacesPage(p => Math.min(placesData.lastPage, p + 1))}
                                                    disabled={placesPage === placesData.lastPage}
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>

                                <TabsContent value="events" className="mt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                        Events feature coming soon!
                                    </div>
                                </TabsContent>

                                <TabsContent value="saved" className="mt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    <div className="col-span-full py-12 text-center text-muted-foreground">
                                        Saved items feature coming soon!
                                    </div>
                                </TabsContent>
                            </div>
                        </div>
                    </Tabs>
                </div>
            </main>
        </div>
    );
}

function PlannerCard({ item, type, onAdd, isAdded }: { item: any; type: string; onAdd: () => void; isAdded: boolean }) {
    // Determine image URL
    const imageUrl = item.thumbnail_url;
    // Determine tags to show
    const categories = item.categories || [];

    return (
        <div className="bg-card rounded-xl border-none shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group h-full">
            <div className="relative h-48 w-full bg-muted overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt={item.name_en || item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Badges */}
                <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-black shadow-sm uppercase text-[10px] font-semibold tracking-wider">
                        {categories[0] || type}
                    </Badge>
                </div>

                {item.best_season && (
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 hover:bg-primary capitalize shadow-sm text-[10px]">
                            {item.best_season}
                        </Badge>
                    </div>
                )}

                {/* Added Overlay */}
                {isAdded && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[1px] z-10">
                        <span className="flex items-center gap-1.5 text-white font-medium text-sm bg-black/20 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md">
                            <CheckCircle2 className="w-4 h-4" />
                            Added to Trip
                        </span>
                    </div>
                )}
            </div>

            <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="min-w-0">
                        <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors" title={item.name_en || item.name}>
                            {item.name_en || item.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                            {item.name}
                        </p>
                    </div>
                    {item.rating && (
                        <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50 flex-none">
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">
                                {item.rating}
                            </span>
                        </div>
                    )}
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                    {categories.slice(0, 2).map((tag: string) => (
                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                            #{tag}
                        </span>
                    ))}
                    {categories.length > 2 && (
                        <span className="text-[10px] text-muted-foreground px-1">
                            +{categories.length - 2}
                        </span>
                    )}
                </div>

                <div className="mt-auto">
                    <Button
                        size="sm"
                        variant={isAdded ? "outline" : "outline"}
                        className={cn(
                            "w-full h-8 text-xs font-medium transition-all",
                            !isAdded && "hover:bg-primary hover:text-primary-foreground hover:border-primary"
                        )}
                        onClick={onAdd}
                        disabled={isAdded}
                    >
                        {isAdded ? "Added" : "Add to Timeline"}
                        {!isAdded && <Plus className="w-3 h-3 ml-1.5" />}
                    </Button>
                </div>
            </div>
        </div>
    );
}
