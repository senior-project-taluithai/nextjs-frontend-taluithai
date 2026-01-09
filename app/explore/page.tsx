"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { places, events, Place, Event, provinces } from "@/lib/mock-data";
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

    // Filters State
    const [filters, setFilters] = useState({
        region: [] as string[],
        provinceIds: [] as number[],
        locationType: [] as string[],
        eventType: [] as string[],
        bestSeason: [] as string[],
        minRating: 0,
        tags: [] as string[],
        page: 1, // Pagination State
        limit: 12, // Items per page
    });

    // Combine data
    const allItems = useMemo(() => {
        const p = places.map(i => ({ ...i, __type: 'place' as const }));
        const e = events.map(i => ({ ...i, __type: 'event' as const }));
        return [...p, ...e];
    }, []);

    // Filter Logic
    const filteredItems = useMemo(() => {
        let items = allItems.filter(item => {
            // 1. Search Query
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchesName = item.name.toLowerCase().includes(q) || item.name_en.toLowerCase().includes(q);
                if (!matchesName) return false;
            }

            // 2. Region & Province
            const province = provinces.find(p => p.province_id === item.province_id);
            if (filters.region.length > 0 && province) {
                if (!filters.region.includes(province.region_name)) return false;
            }
            if (filters.provinceIds.length > 0) {
                if (!filters.provinceIds.includes(item.province_id)) return false;
            }

            // 3. Types
            if (item.__type === 'place') {
                if (filters.locationType.length > 0 && !filters.locationType.includes((item as any).location_type)) {
                    return false;
                }
            }
            if (item.__type === 'event') {
                if (filters.eventType.length > 0 && !filters.eventType.includes((item as any).event_type)) return false;
            }

            // 4. Season
            if ('best_season' in item && filters.bestSeason.length > 0) {
                if (!filters.bestSeason.includes((item as any).best_season)) return false;
            }

            // 5. Rating
            if (item.rating < filters.minRating) return false;

            // 6. Tags
            if (filters.tags.length > 0) {
                const hasTag = item.tags.some(tag => filters.tags.includes(tag));
                if (!hasTag) return false;
            }

            return true;
        });

        // Sort Logic
        items.sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating;
            if (sortBy === 'popular') return (b.reviews?.length || 0) - (a.reviews?.length || 0);
            if (sortBy === 'near_me') return 0; // Requires GPS, mock for now
            // Recommended (Default) - Shuffle deterministic or just ID
            return 0;
        });

        return items;
    }, [allItems, searchQuery, filters.region, filters.provinceIds, filters.locationType, filters.eventType, filters.bestSeason, filters.minRating, filters.tags, sortBy]);

    // Pagination Logic
    const totalPages = Math.ceil(filteredItems.length / filters.limit);
    const paginatedItems = useMemo(() => {
        const start = (filters.page - 1) * filters.limit;
        const end = start + filters.limit;
        return filteredItems.slice(start, end);
    }, [filteredItems, filters.page, filters.limit]);

    // Handle Page Change
    const setPage = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Mounted State for Hydration Fix
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen">
            <h1 className="text-3xl font-bold mb-8">Explore Thailand</h1>

            <div className="flex flex-col lg:flex-row gap-8">

                {/* Desktop Filters Sidebar */}
                <aside className="hidden lg:block w-72 shrink-0 space-y-8 sticky top-24 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto pr-2 scrollbar-thin">
                    <ExploreFilters filters={filters} setFilters={setFilters} />
                </aside>

                {/* Main Content */}
                <main className="flex-1 space-y-6">

                    {/* Toolbar */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-card p-4 rounded-xl shadow-sm border sticky top-16 z-20 backdrop-blur-md bg-white/90 dark:bg-black/80">

                        <div className="relative w-full sm:w-72">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                className="pl-9"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setFilters(p => ({ ...p, page: 1 }));
                                }}
                            />
                        </div>

                        {mounted ? (
                            <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
                                {/* Mobile Filter Trigger */}
                                <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                                    <SheetTrigger asChild>
                                        <Button variant="outline" size="sm" className="lg:hidden gap-2">
                                            Filters
                                            {(filteredItems.length !== allItems.length) && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] text-white">
                                                    !
                                                </span>
                                            )}
                                        </Button>
                                    </SheetTrigger>
                                    <SheetContent side="left" className="w-[85vw] max-w-sm overflow-y-auto">
                                        <ExploreFilters filters={filters} setFilters={setFilters} />
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
                    {viewMode === 'grid' ? (
                        <>
                            <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                                <span>Showing {paginatedItems.length} of {filteredItems.length} results</span>
                            </div>

                            {paginatedItems.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedItems.map((item) => (
                                        <ExploreCard
                                            key={`${item.__type}-${(item as any).place_id || (item as any).event_id}`}
                                            item={item}
                                            type={item.__type}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-xl border border-dashed">
                                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
                                        <Search className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-foreground">No matches found</h3>
                                    <p className="max-w-xs mx-auto mt-2">We couldn't find any places matching your filters. Try adjusting criteria.</p>
                                    <Button
                                        variant="link"
                                        onClick={() => setFilters(p => ({
                                            region: [], provinceIds: [], locationType: [], eventType: [], bestSeason: [], minRating: 0, tags: [], page: 1, limit: 12
                                        }))}
                                        className="mt-4"
                                    >
                                        Clear all filters
                                    </Button>
                                </div>
                            )}

                            {/* Pagination */}
                            {filteredItems.length > filters.limit && (
                                <div className="flex justify-center items-center gap-2 mt-12">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(filters.page - 1)}
                                        disabled={filters.page === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm font-medium mx-2">
                                        Page {filters.page} of {totalPages}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setPage(filters.page + 1)}
                                        disabled={filters.page === totalPages}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="h-[calc(100vh-14rem)] w-full rounded-xl overflow-hidden shadow-lg border relative bg-slate-100 dark:bg-slate-800">
                            <ExploreMap items={filteredItems} />

                            {/* Map Overlay Stats */}
                            <div className="absolute top-4 right-4 bg-background/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md z-[500] text-sm font-medium border">
                                Found {filteredItems.length} locations
                            </div>

                            {/* Mobile Tip */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/75 text-white px-4 py-2 rounded-full text-xs z-[500] pointer-events-none lg:hidden">
                                Pinch to zoom • Tap markers
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
