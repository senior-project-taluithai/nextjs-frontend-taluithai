"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { ExploreFilters } from "@/components/explore/explore-filters";
import { ExploreCard } from "@/components/explore/explore-card";
import { Button } from "@/components/ui/button";
import {
    LayoutGrid,
    Map as MapIcon,
    Search,
    ArrowUpDown,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    Filter,
    Compass,
    MapPin,
    Star,
    Eye,
    SlidersHorizontal,
    ChevronDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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
            <p className="text-sm font-semibold">Loading Custom Map...</p>
        </div>
    )
});

type SortOption = 'recommended' | 'rating-desc' | 'rating-asc' | 'reviews' | 'name-az';

const SORT_OPTIONS = [
    { id: "recommended", label: "Recommended", icon: <SparklesIcon className="w-3.5 h-3.5" /> },
    { id: "rating-desc", label: "Highest Rating", icon: <Star className="w-3.5 h-3.5" /> },
    { id: "rating-asc", label: "Lowest Rating", icon: <Star className="w-3.5 h-3.5" /> },
    { id: "reviews", label: "Most Reviews", icon: <TrendingUpIcon className="w-3.5 h-3.5" /> },
    { id: "name-az", label: "Name (A-Z)", icon: <ArrowUpDown className="w-3.5 h-3.5" /> },
];

function SparklesIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /><path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" /></svg>;
}

function TrendingUpIcon(props: any) {
    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg>;
}

/* ══════════════════════════════════════════════════════
   Floating Particles
   ══════════════════════════════════════════════════════ */
function FloatingParticle({ delay, size, x, dur }: { delay: number; size: number; x: string; dur: number }) {
    return (
        <motion.div className="absolute rounded-full pointer-events-none"
            style={{ width: size, height: size, left: x, bottom: -20 }}
            animate={{ y: [0, -500], opacity: [0, 0.5, 0], scale: [0.5, 1, 0.3] }}
            transition={{ duration: dur, repeat: Infinity, delay, ease: "easeOut" }}>
            <div className="w-full h-full rounded-full bg-gradient-to-t from-emerald-400/30 to-white/10" />
        </motion.div>
    );
}

const HERO_PARTICLES = [
    { delay: 0, size: 6, x: "10%", dur: 8 }, { delay: 2, size: 4, x: "25%", dur: 10 },
    { delay: 4, size: 8, x: "45%", dur: 7 }, { delay: 1, size: 5, x: "65%", dur: 9 },
    { delay: 3, size: 7, x: "80%", dur: 11 }, { delay: 5, size: 3, x: "92%", dur: 8 },
];

export default function ExplorePage() {
    const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>('recommended');
    const [sortOpen, setSortOpen] = useState(false);
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
        limit: 12, // Items per page
    });

    // Handle Search Submit / Delay
    const [debouncedSearch, setDebouncedSearch] = useState("");
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // API Queries
    const placeQuery: ExplorePlacesQuery = useMemo(() => {
        let orderField: string | undefined = undefined;
        let orderDir: 'ASC' | 'DESC' | undefined = undefined;

        switch (sortBy) {
            case 'rating-desc': orderField = 'rating'; orderDir = 'DESC'; break;
            case 'rating-asc': orderField = 'rating'; orderDir = 'ASC'; break;
            case 'reviews': orderField = 'reviewCount'; orderDir = 'DESC'; break;
            case 'name-az': orderField = 'name_en'; orderDir = 'ASC'; break;
            case 'recommended': default: break;
        }

        return {
            searchTerm: debouncedSearch || undefined,
            regions: (filters.region?.length ?? 0) > 0 ? filters.region : undefined,
            provinces: (filters.provinceIds?.length ?? 0) > 0 ? filters.provinceIds : undefined,
            categoryId: filters.categoryId,
            bestSeason: (filters.bestSeason?.length ?? 0) > 0 ? filters.bestSeason : undefined,
            minRating: (filters.minRating ?? 0) > 0 ? filters.minRating : undefined,
            page: page,
            limit: filters.limit,
            orderField,
            orderDir
        } as any; // any to bypass strict type if we pass sorting dynamically
    }, [debouncedSearch, filters, page, sortBy]);

    const eventQuery: ExploreEventsQuery = useMemo(() => {
        let orderField: string | undefined = undefined;
        let orderDir: 'ASC' | 'DESC' | undefined = undefined;

        switch (sortBy) {
            case 'rating-desc': orderField = 'rating'; orderDir = 'DESC'; break;
            case 'rating-asc': orderField = 'rating'; orderDir = 'ASC'; break;
            case 'reviews': orderField = 'reviewCount'; orderDir = 'DESC'; break;
            case 'name-az': orderField = 'name_en'; orderDir = 'ASC'; break;
            case 'recommended': default: break;
        }

        return {
            searchTerm: debouncedSearch || undefined,
            regions: (filters.region?.length ?? 0) > 0 ? filters.region : undefined,
            provinces: (filters.provinceIds?.length ?? 0) > 0 ? filters.provinceIds : undefined,
            categoryId: filters.categoryId,
            minRating: (filters.minRating ?? 0) > 0 ? filters.minRating : undefined,
            page: page,
            limit: filters.limit,
            orderField,
            orderDir
        } as any;
    }, [debouncedSearch, filters, page, sortBy]);

    // Data Fetching
    const { data: placesData, isLoading: isPlacesLoading, isError: isPlacesError } = useExplorePlaces(placeQuery);
    const { data: eventsData, isLoading: isEventsLoading, isError: isEventsError } = useExploreEvents(eventQuery);

    // Derived Data
    const currentData = activeTab === 'place' ? placesData : eventsData;
    const isLoading = activeTab === 'place' ? isPlacesLoading : isEventsLoading;
    const isError = activeTab === 'place' ? isPlacesError : isEventsError;
    const items = currentData?.data || [];
    const meta = {
        total: Number(currentData?.total) || 0,
        page: Number(currentData?.page) || 1,
        lastPage: Number(currentData?.last_page) || 1,
        avgRating: currentData?.avgRating || "0.0",
        totalReviews: currentData?.totalReviews || 0,
    };

    const avgRating = meta.avgRating;
    const totalReviews = meta.totalReviews;
    const activeFilterCount = (filters.region?.length || 0) + (filters.provinceIds?.length || 0) + (filters.categoryId ? 1 : 0) + (filters.bestSeason?.length || 0) + (filters.minRating ? 1 : 0);

    const sortLabel = SORT_OPTIONS.find(s => s.id === sortBy)?.label || "Recommended";

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= meta.lastPage) {
            setPage(newPage);
            window.scrollTo({ top: 300, behavior: 'smooth' }); // Scroll to top of results instead of absolute 0
        }
    };

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="flex-1 overflow-x-hidden bg-[#f4f6f8] dark:bg-[#0a0f16] flex flex-col min-h-screen">
            {/* ═══════════════════════════════════════════════
               Immersive Hero Header
               ═══════════════════════════════════════════════ */}
            <div className="relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f1923 0%, #0a2e1f 40%, #0f1923 100%)" }}>
                {/* Animated gradient orbs */}
                <motion.div className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
                    style={{ left: "-5%", top: "-30%", background: "radial-gradient(circle, rgba(16,185,129,0.2) 0%, transparent 70%)" }}
                    animate={{ scale: [1, 1.2, 1], x: [0, 30, 0] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
                <motion.div className="absolute w-[300px] h-[300px] rounded-full pointer-events-none"
                    style={{ right: "-5%", bottom: "-20%", background: "radial-gradient(circle, rgba(13,148,136,0.15) 0%, transparent 70%)" }}
                    animate={{ scale: [1, 1.3, 1], y: [0, -20, 0] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }} />

                {/* Floating particles */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {HERO_PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}
                </div>

                {/* Grid pattern */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

                <div className="relative z-10 px-6 sm:px-10 py-10 lg:py-14 w-full max-w-7xl mx-auto">
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                        <div className="flex items-center gap-4 mb-4">
                            <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                                className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                                <Compass className="w-6 h-6 text-emerald-400" />
                            </motion.div>
                            <div>
                                <h1 className="text-white drop-shadow-lg" style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.1 }}>Explore Thailand</h1>
                                <p className="text-emerald-400/80 text-sm mt-1">Discover amazing places across the Land of Smiles</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats block */}
                    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
                        className="flex flex-wrap items-center gap-4 mt-6">
                        {[
                            { label: "Places Found", value: meta.total, icon: <MapPin className="w-4 h-4" /> },
                            { label: "Avg Rating", value: avgRating, icon: <Star className="w-4 h-4" /> },
                        ].map((stat, i) => (
                            <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                                className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5">
                                <div className="text-emerald-400 p-1.5 rounded-lg bg-emerald-500/10">{stat.icon}</div>
                                <div>
                                    <p className="text-white" style={{ fontSize: "1.05rem", fontWeight: 800 }}>{stat.value}</p>
                                    <p className="text-white/40 text-[10px] uppercase font-bold tracking-wider">{stat.label}</p>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════════
               Content Area
               ═══════════════════════════════════════════════ */}
            <div className="flex flex-1 w-full max-w-7xl mx-auto items-stretch">

                {/* ── Sidebar Filters (Desktop) ── */}
                <motion.aside initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.1 }}
                    className="w-[280px] shrink-0 bg-white/60 dark:bg-[#0a0f16]/80 backdrop-blur-xl border-r border-gray-100 dark:border-slate-800 p-6 overflow-y-auto hidden lg:block"
                    style={{ height: "calc(100vh - 12rem)", position: "sticky", top: 0 }}>
                    <ExploreFilters filters={filters} setFilters={setFilters} setPage={setPage} activeTab={activeTab} />
                </motion.aside>

                {/* ── Main Content ── */}
                <div className="flex-1 p-4 sm:p-6 min-w-0 flex flex-col">

                    {/* Top Controls Bar */}
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}
                        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6 relative z-30">

                        {/* Left: Tabs + Search */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 min-w-0">
                            {/* Places / Events toggle */}
                            <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-gray-200/80 dark:border-slate-800 shadow-sm shrink-0">
                                {(['place', 'event'] as const).map(tab => (
                                    <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }}
                                        className={`relative px-6 py-2 rounded-lg text-sm transition-all ${activeTab === tab ? "text-white" : "text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200"}`}
                                        style={{ fontWeight: 600 }}>
                                        {activeTab === tab && (
                                            <motion.div layoutId="activeTabBg" className="absolute inset-0 bg-gray-900 dark:bg-emerald-600 rounded-lg" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                        )}
                                        <span className="relative z-10 capitalize">{tab}s</span>
                                    </button>
                                ))}
                            </div>

                            {/* Search */}
                            <div className="flex-1 max-w-md w-full relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-hover:opacity-20 group-focus-within:opacity-30 transition duration-300 blur-sm pointer-events-none" />
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 rounded-xl px-3.5 py-2.5 border border-gray-200/80 dark:border-slate-800 shadow-sm relative z-10">
                                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                                    <input type="text" placeholder={`Search ${activeTab}s, provinces...`} value={searchQuery} onChange={e => { setSearchQuery(e.target.value); }}
                                        className="flex-1 outline-none text-sm text-gray-700 dark:text-slate-200 placeholder-gray-400 bg-transparent" />
                                    {searchQuery && (
                                        <button onClick={() => { setSearchQuery(""); setPage(1); }} className="p-1 rounded bg-gray-100 hover:bg-gray-200 dark:bg-slate-800">
                                            <X className="w-3 h-3 text-gray-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right: Sort + View */}
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                            {/* Sort dropdown */}
                            <div className="relative">
                                <button onClick={() => setSortOpen(!sortOpen)}
                                    className="flex items-center justify-between gap-3 bg-white dark:bg-slate-900 rounded-xl px-4 py-2.5 border border-gray-200/80 dark:border-slate-800 shadow-sm text-sm text-gray-700 dark:text-slate-200 hover:border-gray-300 transition-colors w-40"
                                    style={{ fontWeight: 600 }}>
                                    <span className="flex items-center gap-2">
                                        <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
                                        <span className="truncate">{sortLabel}</span>
                                    </span>
                                    <motion.div animate={{ rotate: sortOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                                        <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {sortOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setSortOpen(false)} />
                                            <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                                                className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-800 z-50 py-2 overflow-hidden">
                                                {SORT_OPTIONS.map(opt => (
                                                    <button key={opt.id} onClick={() => { setSortBy(opt.id as SortOption); setSortOpen(false); setPage(1); }}
                                                        className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-all ${sortBy === opt.id ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400" : "text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"}`}
                                                        style={{ fontWeight: sortBy === opt.id ? 700 : 500 }}>
                                                        <span className={sortBy === opt.id ? "text-emerald-500" : "text-gray-400"}>{opt.icon}</span>
                                                        {opt.label}
                                                        {sortBy === opt.id && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* View toggle */}
                            <div className="flex bg-white dark:bg-slate-900 rounded-xl p-1 border border-gray-200/80 dark:border-slate-800 shadow-sm hidden sm:flex">
                                {([{ mode: "grid" as const, icon: <LayoutGrid className="w-4 h-4" /> }, { mode: "map" as const, icon: <MapIcon className="w-4 h-4" /> }]).map(v => (
                                    <button key={v.mode} onClick={() => setViewMode(v.mode)}
                                        className={`relative p-2.5 rounded-lg transition-all ${viewMode === v.mode ? "text-white" : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"}`}>
                                        {viewMode === v.mode && (
                                            <motion.div layoutId="activeViewBg" className="absolute inset-0 bg-gray-900 dark:bg-emerald-600 rounded-lg" transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                                        )}
                                        <span className="relative z-10">{v.icon}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Mobile filter toggle */}
                            <button onClick={() => setMobileSidebarOpen(true)}
                                className="lg:hidden p-2.5 h-10 w-10 flex items-center justify-center bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm text-gray-500 hover:text-gray-700 relative">
                                <SlidersHorizontal className="w-4 h-4" />
                                {activeFilterCount > 0 && (
                                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-sm" style={{ fontWeight: 800 }}>
                                        {activeFilterCount}
                                    </motion.span>
                                )}
                            </button>
                        </div>
                    </motion.div>

                    {/* Results Loading / Grid / Map */}
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 flex-1">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-[340px] rounded-3xl bg-gray-200/50 dark:bg-slate-800/50 animate-pulse border border-gray-100 dark:border-slate-800" />
                                ))}
                            </motion.div>
                        ) : isError ? (
                            <motion.div key="error" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-red-50 dark:bg-red-900/10 rounded-3xl border border-red-100 dark:border-red-900/30">
                                <Search className="h-10 w-10 text-red-400 mb-4" />
                                <p className="text-red-600 font-bold mb-2">Something went wrong</p>
                                <p className="text-red-500/80 text-sm">Failed to load data. Please try again later.</p>
                            </motion.div>
                        ) : (
                            viewMode === 'grid' ? (
                                <motion.div key="grid-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="flex flex-col flex-1">
                                    {items.length > 0 ? (
                                        <>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{ gridAutoRows: "1fr" }}>
                                                {items.map((item: any, i: number) => (
                                                    <ExploreCard
                                                        key={`${activeTab}-${item.id}`}
                                                        item={item}
                                                        type={activeTab}
                                                        index={i}
                                                    />
                                                ))}
                                            </div>

                                            {/* Pagination */}
                                            {meta.lastPage > 1 && (
                                                <div className="mt-12 flex justify-center mb-8">
                                                    <div className="flex bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-1.5 gap-1">
                                                        <Button variant="ghost" className="rounded-xl px-3" disabled={meta.page === 1} onClick={() => handlePageChange(meta.page - 1)}>
                                                            <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                                                        </Button>

                                                        {Array.from({ length: meta.lastPage }, (_, i) => i + 1).map((p) => {
                                                            const isNear = Math.abs(p - meta.page) <= 1;
                                                            const isEdge = p === 1 || p === meta.lastPage;
                                                            if (isNear || isEdge) {
                                                                return (
                                                                    <Button
                                                                        key={p}
                                                                        variant={p === meta.page ? "default" : "ghost"}
                                                                        className={`w-10 rounded-xl font-bold ${p === meta.page ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20" : ""}`}
                                                                        onClick={() => handlePageChange(p)}
                                                                    >
                                                                        {p}
                                                                    </Button>
                                                                );
                                                            }
                                                            if (p === meta.page - 2 || p === meta.page + 2) {
                                                                return <span key={p} className="flex items-center justify-center w-8 text-gray-400">...</span>;
                                                            }
                                                            return null;
                                                        })}

                                                        <Button variant="ghost" className="rounded-xl px-3" disabled={meta.page === meta.lastPage} onClick={() => handlePageChange(meta.page + 1)}>
                                                            Next <ChevronRight className="h-4 w-4 ml-1" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center py-20 bg-white/50 dark:bg-slate-900/50 rounded-3xl border border-dashed border-gray-200 dark:border-slate-800">
                                            <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-5 shadow-inner">
                                                <Search className="w-8 h-8 text-gray-400" />
                                            </div>
                                            <p className="text-gray-900 dark:text-slate-100 mb-1" style={{ fontWeight: 800, fontSize: "1.25rem" }}>No matches found</p>
                                            <p className="text-sm text-gray-500 dark:text-slate-400 mb-6">We couldn't find any {activeTab}s matching your filters and search.</p>
                                            <button onClick={() => { setFilters({ region: [], provinceIds: [], categoryId: undefined, bestSeason: [], minRating: 0, tags: [], limit: 12 }); setSearchQuery(""); setPage(1); }}
                                                className="text-sm text-white bg-emerald-500 hover:bg-emerald-600 px-6 py-3 rounded-xl shadow-lg shadow-emerald-500/25 transition-colors font-bold flex items-center gap-2">
                                                <X className="w-4 h-4" /> Clear all filters
                                            </button>
                                        </motion.div>
                                    )}
                                </motion.div>
                            ) : (
                                <motion.div key="map-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-[calc(100vh-14rem)] min-h-[500px] w-full rounded-2xl overflow-hidden shadow-lg border relative bg-slate-100 dark:bg-slate-800">
                                    <ExploreMap items={items} />
                                    {/* Map Overlay Stats */}
                                    <div className="absolute top-4 right-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-4 py-2.5 rounded-xl shadow-lg z-[500] border border-gray-100 dark:border-slate-800 flex items-center gap-2">
                                        <motion.span animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
                                            className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                                        <span className="text-sm font-bold text-gray-700 dark:text-slate-200">Found {items.length} locations</span>
                                    </div>
                                </motion.div>
                            )
                        )}
                    </AnimatePresence>

                </div>
            </div>

            {/* ═══════════════════════════════════════════════
               Mobile Filter Drawer
               ═══════════════════════════════════════════════ */}
            <AnimatePresence>
                {mobileSidebarOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden" onClick={() => setMobileSidebarOpen(false)} />
                        <motion.div initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 w-[300px] bg-white dark:bg-[#0a0f16] z-50 overflow-y-auto shadow-2xl lg:hidden flex flex-col">
                            {/* Mobile header */}
                            <div className="sticky top-0 bg-white/95 dark:bg-[#0a0f16]/95 backdrop-blur-xl border-b border-gray-100 dark:border-slate-800 p-4 flex items-center justify-between z-10 shrink-0">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-5 h-5 text-emerald-500" />
                                    <span className="text-base text-gray-900 dark:text-slate-100" style={{ fontWeight: 800 }}>Filters</span>
                                    {activeFilterCount > 0 && (
                                        <span className="w-5 h-5 bg-emerald-500 text-white text-[10px] rounded-full flex items-center justify-center" style={{ fontWeight: 800 }}>{activeFilterCount}</span>
                                    )}
                                </div>
                                <button onClick={() => setMobileSidebarOpen(false)} className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 flex items-center justify-center transition-colors">
                                    <X className="w-4 h-4 text-gray-500 dark:text-slate-400" />
                                </button>
                            </div>
                            <div className="p-5 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-transparent">
                                <ExploreFilters filters={filters} setFilters={setFilters} setPage={setPage} activeTab={activeTab} />
                            </div>
                            <div className="sticky bottom-0 bg-white/95 dark:bg-[#0a0f16]/95 backdrop-blur-xl border-t border-gray-100 dark:border-slate-800 p-4 shrink-0">
                                <button onClick={() => setMobileSidebarOpen(false)}
                                    className="w-full py-3 rounded-xl text-sm text-white shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2"
                                    style={{ fontWeight: 700, background: "linear-gradient(135deg, #059669, #0d9488)" }}>
                                    <Eye className="w-4 h-4" /> Apply Filters ({meta.total} results)
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
