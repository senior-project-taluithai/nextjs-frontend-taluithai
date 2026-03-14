import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    Sparkles,
    Star,
    Plus,
    Check,
    ChevronRight,
    ChevronLeft,
    Flame,
    Leaf,
    Gem,
    Mountain,
    UtensilsCrossed,
    Landmark,
    TrendingUp,
    Compass,
    Clock,
    Waves
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { Badge } from "@/components/ui/badge";

/* ─── Category accent map ──────────────────────── */
const CAT_ACCENT: Record<string, { pill: string; glow: string; dot: string }> = {
    Temple: { pill: "bg-amber-50 text-amber-700 border-amber-200", glow: "rgba(245,158,11,0.15)", dot: "#f59e0b" },
    Beach: { pill: "bg-sky-50 text-sky-700 border-sky-200", glow: "rgba(14,165,233,0.15)", dot: "#0ea5e9" },
    Nature: { pill: "bg-emerald-50 text-emerald-700 border-emerald-200", glow: "rgba(16,185,129,0.15)", dot: "#10b981" },
    Heritage: { pill: "bg-rose-50 text-rose-700 border-rose-200", glow: "rgba(244,63,94,0.15)", dot: "#f43f5e" },
    Island: { pill: "bg-teal-50 text-teal-700 border-teal-200", glow: "rgba(20,184,166,0.15)", dot: "#14b8a6" },
    Festival: { pill: "bg-violet-50 text-violet-700 border-violet-200", glow: "rgba(139,92,246,0.15)", dot: "#8b5cf6" },
    Shopping: { pill: "bg-pink-50 text-pink-700 border-pink-200", glow: "rgba(236,72,153,0.15)", dot: "#ec4899" },
    Food: { pill: "bg-orange-50 text-orange-700 border-orange-200", glow: "rgba(249,115,22,0.15)", dot: "#f97316" },
    default: { pill: "bg-gray-50 text-gray-700 border-gray-200", glow: "rgba(100,116,139,0.15)", dot: "#64748b" },
};
const catAccent = (cat: string) => CAT_ACCENT[cat] ?? CAT_ACCENT.default;

/* ─── Reasoning engine ───────────────────────── */
type ReasonChip = { icon: React.ReactNode; label: string; color: string };

function getReasons(item: any): ReasonChip[] {
    const chips: ReasonChip[] = [];

    if (item.rating && item.rating >= 4.7)
        chips.push({ icon: <Flame className="w-3 h-3" />, label: "Top Rated", color: "bg-orange-50 text-orange-600 border-orange-100" });

    const categories = item.categories || [];
    const nameStr = ((item.name_en || "") + " " + (item.name || "")).toLowerCase();

    if (categories.includes("Nature") || nameStr.includes("waterfall") || nameStr.includes("park") || nameStr.includes("national"))
        chips.push({ icon: <Mountain className="w-3 h-3" />, label: "Nature Escape", color: "bg-sky-50 text-sky-600 border-sky-100" });

    if (categories.includes("Food") || nameStr.includes("market") || nameStr.includes("bazaar"))
        chips.push({ icon: <UtensilsCrossed className="w-3 h-3" />, label: "Must Try Food", color: "bg-rose-50 text-rose-600 border-rose-100" });

    if (nameStr.includes("temple") || nameStr.includes("wat") || nameStr.includes("historical") || nameStr.includes("museum"))
        chips.push({ icon: <Landmark className="w-3 h-3" />, label: "Cultural Heritage", color: "bg-amber-50 text-amber-600 border-amber-100" });

    if (categories.includes("Beach") || categories.includes("Island"))
        chips.push({ icon: <Waves className="w-3 h-3" />, label: "Ocean Paradise", color: "bg-sky-50 text-sky-600 border-sky-100" });

    // fallback
    if (chips.length === 0)
        chips.push({ icon: <Compass className="w-3 h-3" />, label: "AI Pick", color: "bg-indigo-50 text-indigo-600 border-indigo-100" });

    return chips.slice(0, 3);
}



/* ─── Hero Feature Card ──────────────────────────── */
function HeroCard({ item, type, isAdded, onAdd }: { item: any, type: string, isAdded: boolean; onAdd: () => void }) {
    const router = useRouter();
    const [hovered, setHovered] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const reasons = getReasons(item);
    const primaryCategory = item.categories?.[0] || 'default';
    const accent = catAccent(primaryCategory);

    // 3D tilt
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 20 });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 20 });

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = cardRef.current?.getBoundingClientRect();
        if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
    };
    const handleMouseLeave = () => { x.set(0); y.set(0); };

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onHoverStart={() => setHovered(true)}
            onHoverEnd={() => setHovered(false)}
            onClick={() => router.push(`/${type}/${item.id}`)}
            className="relative rounded-3xl overflow-hidden shadow-xl cursor-pointer"
            style={{ rotateX, rotateY, transformPerspective: 1000, height: 260 }}
        >
            {/* Glow halo */}
            <div
                className="absolute -inset-2 rounded-3xl blur-2xl opacity-40 pointer-events-none z-0"
                style={{ background: accent.glow }}
            />

            <div className="relative z-10 h-full rounded-3xl overflow-hidden border border-white/10">
                {/* Image */}
                <motion.img
                    src={item.thumbnail_url || undefined}
                    alt={item.name_en || item.name}
                    animate={{ scale: hovered ? 1.06 : 1 }}
                    transition={{ duration: 0.6 }}
                    className="w-full h-full object-cover"
                />

                {/* Gradient layers */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

                {/* Top badges */}
                <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
                    <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: accent.dot }} />
                            {primaryCategory}
                        </span>
                    </div>

                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {reasons.map((r, i) => (
                            <motion.span
                                key={i}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 + i * 0.08 }}
                                className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/12 text-white/90 border border-white/20 backdrop-blur-sm shadow-sm"
                            >
                                {r.icon}
                                {r.label}
                            </motion.span>
                        ))}
                    </div>

                    <div className="flex items-end justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <p className="text-white/70 text-xs mb-0.5 line-clamp-1">{item.name}</p>
                            <h3 className="text-white font-extrabold truncate" style={{ fontSize: "1.25rem", lineHeight: 1.3 }}>
                                {item.name_en || item.name}
                            </h3>
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.93 }}
                            onClick={(e) => { e.stopPropagation(); onAdd(); }}
                            disabled={isAdded}
                            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${isAdded
                                ? "bg-white/20 text-white shadow-none backdrop-blur-sm cursor-not-allowed"
                                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-emerald-900/40"
                                }`}
                        >
                            {isAdded ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            {isAdded ? "Added!" : "Add"}
                        </motion.button>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Scroll Card ────────────────────────────── */
function ScrollCard({ item, type, isAdded, onAdd, index }: { item: any, type: string, isAdded: boolean; onAdd: () => void; index: number }) {
    const router = useRouter();
    const reasons = getReasons(item);


    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.35, delay: index * 0.07 }}
            onClick={() => router.push(`/${type}/${item.id}`)}
            className="relative flex-shrink-0 w-56 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl border border-gray-100 bg-white group cursor-pointer transition-all duration-300 flex flex-col h-full"
        >
            {/* Image Header */}
            <div className="relative h-36 overflow-hidden bg-gray-100 shrink-0">
                <img
                    src={item.thumbnail_url || undefined}
                    alt={item.name_en || item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                {/* Top Badges */}


                {/* Add Overlay state */}
                {isAdded && (
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10 transition-opacity duration-300">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/50">
                            <Check className="w-5 h-5 text-white" />
                        </div>
                    </div>
                )}
            </div>

            {/* Info Body */}
            <div className="p-4 flex flex-col flex-1">
                <div className="flex justify-between items-start gap-2 mb-1 shrink-0">
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-400 mb-0.5 truncate uppercase tracking-wide font-medium">{item.categories?.[0] || type}</p>
                        <h4 className="font-bold text-gray-900 text-sm line-clamp-1 group-hover:text-emerald-600 transition-colors">
                            {item.name_en || item.name}
                        </h4>
                    </div>
                    {item.rating && (
                        <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-100 shrink-0 mt-2">
                            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-bold text-amber-700">{item.rating}</span>
                        </div>
                    )}
                </div>

                {/* Reason Chip */}
                <div className={`mt-2 inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-md border w-fit ${reasons[0].color} shrink-0`}>
                    {reasons[0].icon}
                    <span>{reasons[0].label}</span>
                </div>

                {/* Add Button */}
                <div className="mt-auto pt-4 shrink-0">
                    <button
                        onClick={(e) => { e.stopPropagation(); onAdd(); }}
                        disabled={isAdded}
                        className={`w-full py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 ${isAdded
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200 shadow-inner cursor-not-allowed"
                            : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 hover:shadow-md hover:shadow-emerald-200 group-hover:bg-gray-100"
                            }`}
                    >
                        {isAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        {isAdded ? "Added to Day" : "Add to Timeline"}
                    </button>
                </div>
            </div>
        </motion.div>
    );
}

/* ─── Main Section ───────────────────────────── */
export function RecommendationSection({
    title = "Recommended for You",
    icon: Icon = Sparkles,
    items = [],
    type,
    onAdd,
    checkIsAdded,
}: {
    title?: string;
    icon?: any;
    items?: any[];
    type: string;
    onAdd: (item: any, type: string) => void;
    checkIsAdded: (type: string, id: number) => boolean;
}) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [scrollPos, setScrollPos] = useState(0);

    const scroll = (dir: "left" | "right") => {
        const el = scrollRef.current;
        if (!el) return;
        const delta = 240 * 2; // scroll width of ~2 cards
        el.scrollBy({ left: dir === "right" ? delta : -delta, behavior: "smooth" });
    };

    const handleScroll = () => {
        if (scrollRef.current) setScrollPos(scrollRef.current.scrollLeft);
    };

    if (!items || items.length === 0) return null;

    const [hero, ...rest] = items.slice(0, 10); // Take top 10

    return (
        <div className="mb-8 relative z-0">
            {/* ── Section Header ── */}
            <div className="flex items-start justify-between mb-5">
                <div>
                    <div className="flex items-center gap-2 mb-1.5">
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-sm">
                            <Icon className="w-3 h-3" />
                            AI Recommendations
                        </span>
                    </div>
                    <h2 className="font-extrabold text-gray-900 text-xl tracking-tight">
                        {title}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        Based on: Your dates · Destinations · User ratings
                    </p>
                </div>
            </div>

            {/* ── Hero Card ── */}
            {hero && (
                <div className="mb-5">
                    <HeroCard
                        item={hero}
                        type={type}
                        isAdded={checkIsAdded(type, hero.id)}
                        onAdd={() => onAdd(hero, type)}
                    />
                </div>
            )}

            {/* ── Scroll Strip (remaining) ── */}
            {rest.length > 0 && (
                <div className="relative -mx-5 px-5 group/scroll">
                    {/* Scroll buttons (only show on hover/when needed) */}
                    <AnimatePresence>
                        {scrollPos > 10 && (
                            <motion.button
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                onClick={() => scroll("left")}
                                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-gray-700 border border-gray-100 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </motion.button>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => scroll("right")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 backdrop-blur-md rounded-full shadow-lg flex items-center justify-center text-gray-700 border border-gray-100 hover:bg-white hover:scale-110 transition-all opacity-0 group-hover/scroll:opacity-100"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>

                    <div
                        ref={scrollRef}
                        onScroll={handleScroll}
                        className="flex gap-4 overflow-x-auto pb-4 pt-1 snap-x snap-mandatory"
                        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                        {rest.map((item, i) => (
                            <div key={item.id} className="snap-start shrink-0">
                                <ScrollCard
                                    item={item}
                                    type={type}
                                    isAdded={checkIsAdded(type, item.id)}
                                    onAdd={() => onAdd(item, type)}
                                    index={i}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Divider ── */}
            <div className="flex items-center gap-4 mt-8 mb-2 opacity-60">
                <div className="flex-1 h-px bg-gradient-to-r from-transparent to-gray-200" />
                <span className="text-[10px] uppercase font-bold text-gray-400 tracking-widest px-2">Explore All Options</span>
                <div className="flex-1 h-px bg-gradient-to-l from-transparent to-gray-200" />
            </div>
        </div>
    );
}
