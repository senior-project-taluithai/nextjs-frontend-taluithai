"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { ExploreCard } from "@/components/explore/explore-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    LayoutGrid,
    Map as MapIcon,
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2
} from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useExplorePlaces } from "@/hooks/api/usePlaces";
import { useExploreEvents } from "@/hooks/api/useEvents";
import { ExplorePlacesQuery } from "@/lib/dtos/place.dto";
import { ExploreEventsQuery } from "@/lib/dtos/event.dto";

// Dynamically import Map to avoid SSR issues
const ExploreMap = dynamic(() => import("@/components/explore/explore-map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full min-h-[500px] bg-slate-100 dark:bg-slate-900 rounded-xl flex flex-col items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p>Loading Map...</p>
        </div>
    )
});

type SortOption = 'recommended' | 'rating' | 'popular' | 'near_me';

export default function ExplorePage() {
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [activeTab, setActiveTab] = useState<'place' | 'event'>('place');

    // Pagination State
    const [page, setPage] = useState(1);

    // Filters State
    const [filters, setFilters] = useState({
        region: [] as string[],
        provinceIds: [] as number[],
        categoryId: undefined as number | undefined,
        bestSeason: [] as string[],
        minRating: 0,
        tags: [] as string[],
        limit: 6, // Items per page
    });

    // API Queries
    const placeQuery: ExplorePlacesQuery = useMemo(() => ({
        searchTerm: searchQuery || undefined,
        regions: (filters.region?.length ?? 0) > 0 ? filters.region : undefined,
        provinces: (filters.provinceIds?.length ?? 0) > 0 ? filters.provinceIds : undefined,
        categoryId: filters.categoryId,
        bestSeason: (filters.bestSeason?.length ?? 0) > 0 ? filters.bestSeason : undefined,
        minRating: (filters.minRating ?? 0) > 0 ? filters.minRating : undefined,
        page: page,
        limit: filters.limit
    }), [searchQuery, filters, page]);

    const eventQuery: ExploreEventsQuery = useMemo(() => ({
        searchTerm: searchQuery || undefined,
        regions: (filters.region?.length ?? 0) > 0 ? filters.region : undefined,
        provinces: (filters.provinceIds?.length ?? 0) > 0 ? filters.provinceIds : undefined,
        categoryId: filters.categoryId,
        minRating: (filters.minRating ?? 0) > 0 ? filters.minRating : undefined,
        page: page,
        limit: filters.limit
    }), [searchQuery, filters, page]);

    // Data Fetching
    const {
        data: placesData,
        isLoading: isPlacesLoading,
        isError: isPlacesError
    } = useExplorePlaces(placeQuery);

    const {
        data: eventsData,
        isLoading: isEventsLoading,
        isError: isEventsError
    } = useExploreEvents(eventQuery);

    // Derived Data based on Active Tab
    const currentData = activeTab === 'place' ? placesData : eventsData;
    const isLoading = activeTab === 'place' ? isPlacesLoading : isEventsLoading;
    const isError = activeTab === 'place' ? isPlacesError : isEventsError;
    const items = currentData?.data || [];
    const meta = {
        total: Number(currentData?.total) || 0,
        page: Number(currentData?.page) || 1,
        lastPage: Number(currentData?.lastPage) || 1,
    };

    // Handle Page Change
    // Handle Page Change
    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.lastPage) {
            setPage(newPage);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Prepare Items for Map (Need to add __type for differentiation in map markers if needed)
    // Actually our map component uses 'start_date' check to differentiate.
    // If we only pass places or only events, it should be fine.
    // If we want to show BOTH on map, we might need a different approach (e.g. combined query or fetch both).
    // For now, let's show only active tab items on map to match the Grid view behavior.
    const mapItems = items;

    // Mounted State for Hydration Fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">Explore Thailand</h1>

            <Tabs defaultValue="place" value={activeTab} onValueChange={(v) => {
                setActiveTab(v as 'place' | 'event');
                setPage(1); // Reset page on tab switch
            }} className="w-full space-y-6">

                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Desktop Filters Sidebar */}
                    <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
                        <ExploreFilters
                            filters={filters}
                            setFilters={setFilters}
                            setPage={setPage}
                            activeTab={activeTab}
                        />
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-6">

                        {/* Toolbar */}
                        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl shadow-sm border sticky top-16 z-20 backdrop-blur-md bg-white/90 dark:bg-black/80">

                            {/* Mobile Filters Trigger & Tab Switcher (merged responsively) */}
                            <div className="flex flex-col w-full sm:w-auto gap-4">
                                <TabsList className="grid w-full grid-cols-2 sm:w-[300px]">
                                    <TabsTrigger value="place">Places</TabsTrigger>
                                    <TabsTrigger value="event">Events</TabsTrigger>
                                </TabsList>

                                <div className="relative w-full sm:w-72">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder={`Search ${activeTab}s...`}
                                        className="pl-9"
                                        value={searchQuery}
                                        onChange={(e) => {
                                            setSearchQuery(e.target.value);
                                            setPage(1);
                                        }}
                                    />
                                </div>
                            </div>


                            {mounted ? (
                                <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center justify-end">
                                    {/* Mobile Filter Trigger */}
                                    <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                                        <SheetTrigger asChild>
                                            <Button variant="outline" size="sm" className="lg:hidden gap-2">
                                                Filters
                                            </Button>
                                        </SheetTrigger>
                                        <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                                            <ExploreFilters
                                                filters={filters}
                                                setFilters={setFilters}
                                                setPage={setPage}
                                                activeTab={activeTab}
                                            />
                                        </SheetContent>
                                    </Sheet>

                                    <Select value={sortBy} onValueChange={(v: SortOption) => setSortBy(v)}>
                                        <SelectTrigger className="w-[150px] h-9">
                                            <div className="flex items-center gap-2">
                                                <ArrowUpDown className="w-3 h-3" />
                                                <SelectValue placeholder="Sort" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="recommended">Recommended</SelectItem>
                                            <SelectItem value="rating">Highest Rated</SelectItem>
                                            <SelectItem value="popular">Most Popular</SelectItem>
                                            <SelectItem value="near_me">Near Me</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <div className="bg-muted p-1 rounded-lg flex items-center gap-1 border">
                                        <Button
                                            variant={viewMode === 'grid' ? "secondary" : "ghost"}
                                            size="sm"
                                            className={`h-7 px-2.5 ${viewMode === 'grid' ? 'shadow-sm bg-background' : ''}`}
                                            onClick={() => setViewMode('grid')}
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === 'map' ? "secondary" : "ghost"}
                                            size="sm"
                                            className={`h-7 px-2.5 ${viewMode === 'map' ? 'shadow-sm bg-background' : ''}`}
                                            onClick={() => setViewMode('map')}
                                        >
                                            <MapIcon className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                // Skeleton/Loading State for Toolbar to prevent CLS
                                <div className="flex gap-2 w-full sm:w-auto overflow-hidden opacity-50">
                                    <Button variant="outline" size="sm" className="lg:hidden w-20">Filters</Button>
                                    <div className="w-[150px] h-9 bg-muted rounded animate-pulse" />
                                    <div className="w-20 h-9 bg-muted rounded animate-pulse" />
                                </div>
                            )}
                        </div>

                        {/* Results Area */}

                        {isLoading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-[300px] rounded-xl bg-muted animate-pulse" />
                                ))}
                            </div>
                        ) : isError ? (
                            <div className="text-center py-20 text-red-500 bg-red-50 rounded-xl border border-red-200">
                                <p>Failed to load data. Please try again later.</p>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'grid' ? (
                                    <>
                                        <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                                            <span>Showing {items.length} of {meta.total} results</span>
                                        </div>

                                        {items.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                                {items.map((item: any) => (
                                                    <ExploreCard
                                                        key={`${activeTab}-${item.id}`}
                                                        item={{ ...item, __type: activeTab }}
                                                        type={activeTab}
                                                    />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                                    <Search className="h-8 w-8 text-muted-foreground" />
                                                </div>
                                                <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
                                                <p className="max-w-xs mx-auto mt-2">We couldn't find any {activeTab}s matching your filters.</p>
                                                <Button
                                                    variant="link"
                                                    onClick={() => {
                                                        setFilters(p => ({
                                                            region: [], provinceIds: [], categoryId: undefined, bestSeason: [], minRating: 0, tags: [], limit: 12
                                                        }));
                                                        setPage(1);
                                                    }}
                                                    className="mt-4"
                                                >
                                                    Clear all filters
                                                </Button>
                                            </div>
                                        )}

                                        <Pagination className="mt-12">
                                            <PaginationContent>
                                                <PaginationItem>
                                                    <Button
                                                        variant="ghost"
                                                        size="default"
                                                        className="gap-1 pl-2.5"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (meta.page > 1) handlePageChange(meta.page - 1);
                                                        }}
                                                        disabled={meta.page === 1}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                        <span>Previous</span>
                                                    </Button>
                                                </PaginationItem>

                                                {meta.lastPage > 1 && Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((page) => {
                                                    // Logic to show limited page numbers
                                                    const isEdge = page === 1 || page === meta.lastPage;
                                                    const isNearCurrent = Math.abs(page - meta.page) <= 1;
                                                    const isEllipsis = page === meta.page - 2 || page === meta.page + 2;

                                                    if (isEdge || isNearCurrent) {
                                                        return (
                                                            <PaginationItem key={page}>
                                                                <Button
                                                                    variant={page === meta.page ? "outline" : "ghost"}
                                                                    size="icon"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        handlePageChange(page);
                                                                    }}
                                                                >
                                                                    {page}
                                                                </Button>
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    if (isEllipsis) {
                                                        return (
                                                            <PaginationItem key={page}>
                                                                <PaginationEllipsis />
                                                            </PaginationItem>
                                                        );
                                                    }

                                                    return null;
                                                })}

                                                <PaginationItem>
                                                    <Button
                                                        variant="ghost"
                                                        size="default"
                                                        className="gap-1 pr-2.5"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            if (meta.page < meta.lastPage) handlePageChange(meta.page + 1);
                                                        }}
                                                        disabled={meta.page === meta.lastPage}
                                                    >
                                                        <span>Next</span>
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                </PaginationItem>
                                            </PaginationContent>
                                        </Pagination>
                                    </>
                                ) : (
                                    <div className="h-[calc(100vh-14rem)] w-full rounded-xl overflow-hidden shadow-lg border relative bg-slate-100 dark:bg-slate-800">
                                        <ExploreMap items={items} />

                                        {/* Map Overlay Stats */}
                                        <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md z-[500] text-sm font-medium border">
                                            Found {items.length} locations
                                        </div>

                                        {/* Mobile Tip */}
                                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-xs z-[500] pointer-events-none lg:hidden">
                                            Pinch to zoom • Tap markers
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </Tabs>
        </div>
    );
}
