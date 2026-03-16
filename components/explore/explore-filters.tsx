"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Search, MapPin, Compass, Sparkles, Star, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useCategories } from "@/hooks/api/useCategories";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface ExploreFiltersProps {
    filters: any;
    setFilters: (filters: any) => void;
    setPage: (page: number) => void;
    className?: string;
    activeTab?: 'place' | 'event';
}

const REGIONS = ["North", "South", "Central", "Northeast", "East", "West"];
const SEASON_OPTIONS = [
    { id: "winter", label: "Winter", labelTh: "ฤดูหนาว", icon: "❄️", gradient: "from-sky-400 to-blue-600" },
    { id: "summer", label: "Summer", labelTh: "ฤดูร้อน", icon: "☀️", gradient: "from-amber-400 to-orange-500" },
    { id: "rainy", label: "Rainy", labelTh: "ฤดูฝน", icon: "🌧️", gradient: "from-teal-400 to-cyan-600" },
    { id: "all_year", label: "All Year", labelTh: "เที่ยวได้ทั้งปี", icon: "✨", gradient: "from-emerald-400 to-teal-500" },
];

const CAT_ACCENT: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    Temple: { bg: "bg-amber-50 dark:bg-amber-950/30", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200 dark:border-amber-800", dot: "#f59e0b" },
    Beach: { bg: "bg-sky-50 dark:bg-sky-950/30", text: "text-sky-700 dark:text-sky-400", border: "border-sky-200 dark:border-sky-800", dot: "#0ea5e9" },
    Nature: { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200 dark:border-emerald-800", dot: "#10b981" },
    Heritage: { bg: "bg-rose-50 dark:bg-rose-950/30", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200 dark:border-rose-800", dot: "#f43f5e" },
    Island: { bg: "bg-teal-50 dark:bg-teal-950/30", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200 dark:border-teal-800", dot: "#14b8a6" },
    Festival: { bg: "bg-violet-50 dark:bg-violet-950/30", text: "text-violet-700 dark:text-violet-400", border: "border-violet-200 dark:border-violet-800", dot: "#8b5cf6" },
    Shopping: { bg: "bg-pink-50 dark:bg-pink-950/30", text: "text-pink-700 dark:text-pink-400", border: "border-pink-200 dark:border-pink-800", dot: "#ec4899" },
    Market: { bg: "bg-orange-50 dark:bg-orange-950/30", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200 dark:border-orange-800", dot: "#f97316" },
};
const catAccent = (c: string) => CAT_ACCENT[c] ?? { bg: "bg-slate-50 dark:bg-slate-900/50", text: "text-slate-700 dark:text-slate-300", border: "border-slate-200 dark:border-slate-800", dot: "#64748b" };

function FilterSection({ title, icon, defaultOpen = true, children }: { title: string; icon?: React.ReactNode; defaultOpen?: boolean; children: React.ReactNode }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-100/80 dark:border-slate-800 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
            <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between mb-2.5 group">
                <div className="flex items-center gap-2">
                    {icon && <span className="text-emerald-500">{icon}</span>}
                    <span className="text-sm text-gray-900 dark:text-slate-100" style={{ fontWeight: 700 }}>{title}</span>
                </div>
                <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </motion.div>
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden">
                        {children}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function CustomCheckbox({ checked, onChange, label, count }: { checked: boolean; onChange: () => void; label: string; count?: number }) {
    return (
        <button className="flex items-center gap-2.5 py-1.5 cursor-pointer group w-full text-left" onClick={onChange}>
            <motion.div animate={{ scale: checked ? 1.1 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className={`w-[18px] h-[18px] rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${checked ? "bg-emerald-500 border-emerald-500 shadow-sm shadow-emerald-200 dark:shadow-emerald-900/50" : "border-gray-300 dark:border-slate-700 group-hover:border-emerald-400 dark:group-hover:border-emerald-500"}`}>
                {checked && (
                    <motion.svg initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </motion.svg>
                )}
            </motion.div>
            <span className="text-sm text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors flex-1 line-clamp-1">{label}</span>
            {count !== undefined && <span className="text-xs text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full" style={{ fontWeight: 600 }}>{count}</span>}
        </button>
    );
}

export function ExploreFilters({ filters, setFilters, setPage, className, activeTab = 'place' }: ExploreFiltersProps) {
    const [provinceSearch, setProvinceSearch] = useState("");
    const { data: categories = [] } = useCategories();
    const { data: provinces = [] } = useProvinces();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const toggleFilterArray = (key: string, value: any) => {
        setFilters((prev: any) => {
            const arr = prev[key] || [];
            const isSelected = arr.includes(value);
            const newArr = isSelected ? arr.filter((i: any) => i !== value) : [...arr, value];
            return { ...prev, [key]: newArr };
        });
        setPage(1);
    };

    const toggleCategoryId = (id: number) => {
        setFilters((prev: any) => ({
            ...prev,
            categoryId: prev.categoryId === id ? undefined : id
        }));
        setPage(1);
    };

    const resetFilters = () => {
        setFilters({});
        setPage(1);
    };

    if (!mounted) return <div className={`space-y-6 ${className}`} />;

    const filteredProvinces = provinceSearch
        ? provinces.filter(p => p.name_en.toLowerCase().includes(provinceSearch.toLowerCase()) || p.name.includes(provinceSearch))
        : provinces;

    const limitProvinces = provinceSearch ? filteredProvinces : filteredProvinces.slice(0, 15); // Show top 15 by default to not clutter

    const activeFilterCount = (filters.region?.length || 0) + (filters.provinceIds?.length || 0) + (filters.categoryId ? 1 : 0) + (filters.bestSeason?.length || 0) + (filters.minRating ? 1 : 0);

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header / Active counts */}
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm text-gray-900 dark:text-slate-100" style={{ fontWeight: 800 }}>Filters</span>
                </div>
                {activeFilterCount > 0 && (
                    <motion.button initial={{ scale: 0 }} animate={{ scale: 1 }} onClick={resetFilters}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600 bg-red-50 dark:bg-red-500/10 px-2 py-1 rounded-lg" style={{ fontWeight: 600 }}>
                        <X className="w-3 h-3" /> Clear ({activeFilterCount})
                    </motion.button>
                )}
            </div>

            {/* Region */}
            <FilterSection title="Region" icon={<Compass className="w-4 h-4" />}>
                <div className="max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                    {REGIONS.map(region => (
                        <CustomCheckbox
                            key={region}
                            checked={(filters.region || []).includes(region)}
                            onChange={() => toggleFilterArray("region", region)}
                            label={region}
                        />
                    ))}
                </div>
            </FilterSection>

            {/* Province */}
            <FilterSection title="Province" icon={<MapPin className="w-4 h-4" />} defaultOpen={false}>
                <div className="mb-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <input type="text" placeholder="Search province..." value={provinceSearch} onChange={e => setProvinceSearch(e.target.value)}
                            className="w-full text-xs border border-gray-200 dark:border-slate-800 rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-400 bg-gray-50/50 dark:bg-slate-900 placeholder-gray-400 transition-all dark:text-slate-200" />
                    </div>
                </div>
                <div className="max-h-[180px] overflow-y-auto pr-1 scrollbar-thin">
                    {limitProvinces.map(province => (
                        <CustomCheckbox
                            key={province.id}
                            checked={(filters.provinceIds || []).includes(province.id)}
                            onChange={() => toggleFilterArray("provinceIds", province.id)}
                            label={province.name_en}
                        />
                    ))}
                    {!provinceSearch && provinces.length > 15 && (
                        <p className="text-xs text-muted-foreground mt-2 italic text-center">Search to see more provinces...</p>
                    )}
                </div>
            </FilterSection>

            {/* Category */}
            <FilterSection title="Category" icon={<Sparkles className="w-4 h-4" />}>
                <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                    {categories.map((cat: any) => {
                        const isSelected = filters.categoryId === cat.id;
                        // Use English name from API or fallback
                        const labelEn = cat.name_en || cat.nameEn || cat.name;
                        const a = catAccent(labelEn);

                        return (
                            <button key={cat.id} onClick={() => toggleCategoryId(cat.id)}
                                className={`w-full flex items-center gap-2.5 py-1.5 px-2 rounded-lg transition-all ${isSelected ? `${a.bg} ${a.text} ${a.border} border` : "hover:bg-gray-50 dark:hover:bg-slate-800"}`}>
                                <motion.div animate={{ scale: isSelected ? 1.15 : 1 }} transition={{ type: "spring", stiffness: 400, damping: 15 }}
                                    className={`w-6 h-6 rounded flex items-center justify-center ${isSelected ? "" : "bg-gray-100 dark:bg-slate-800"}`}
                                    style={isSelected ? { backgroundColor: a.dot + "20" } : {}}>
                                    <span className="text-[10px]" style={{ fontWeight: 800 }}>#</span>
                                </motion.div>
                                <span className="text-sm flex-1 text-left line-clamp-1" style={{ fontWeight: isSelected ? 700 : 500 }}>{labelEn}</span>
                                {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                                        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: a.dot }}>
                                        <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </motion.div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Season (Only relevant if activeTab === place, but backend query accepts it anyway) */}
            <FilterSection title="Season" icon={<Sparkles className="w-4 h-4" />} defaultOpen={activeTab === 'place'}>
                <div className="space-y-1.5 pt-1">
                    {SEASON_OPTIONS.map(s => {
                        const isSelected = (filters.bestSeason || []).includes(s.id);
                        return (
                            <button key={s.id} onClick={() => toggleFilterArray("bestSeason", s.id)}
                                className={`w-full flex items-center gap-3 py-2 px-3 rounded-xl border transition-all ${isSelected ? `bg-gradient-to-r ${s.gradient} text-white border-transparent shadow-md` : "bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-800 hover:border-gray-300 dark:hover:border-slate-700"}`}
                                style={{ fontWeight: 600 }}>
                                <span className="text-sm">{s.icon}</span>
                                <div className="text-left flex-1">
                                    <p className="text-[13px]" style={{ fontWeight: 700 }}>{s.label}</p>
                                </div>
                                {isSelected && (
                                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="shrink-0">
                                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </motion.div>
                                )}
                            </button>
                        );
                    })}
                </div>
            </FilterSection>

            {/* Min Rating */}
            <FilterSection title="Min Rating" icon={<Star className="w-4 h-4" />}>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                    {[0, 3, 3.5, 4, 4.5].map(r => (
                        <motion.button key={r} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                setFilters((prev: any) => ({ ...prev, minRating: filters.minRating === r ? undefined : r }));
                                setPage(1);
                            }}
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs border transition-all ${(filters.minRating || 0) === r ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200 dark:shadow-amber-900/40" : "bg-white dark:bg-slate-900 text-gray-600 dark:text-slate-400 border-gray-200 dark:border-slate-800 hover:border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-900/30"
                                }`} style={{ fontWeight: 700 }}>
                            {r === 0 ? "All" : <><Star className="w-3 h-3 fill-current" />{r}+</>}
                        </motion.button>
                    ))}
                </div>
            </FilterSection>

        </div>
    );
}
