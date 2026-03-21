"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Star, MapPin, Heart, ArrowRight, Calendar } from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { Place } from "@/lib/dtos/place.dto";
import { interactionService } from "@/lib/services/interaction";
import { Event } from "@/lib/dtos/event.dto";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  useToggleFavoritePlace,
  useIsFavoritePlace,
  useToggleFavoriteEvent,
  useIsFavoriteEvent,
} from "@/hooks/api/useFavorites";

// Helpers & Constants from design
const SEASON_OPTIONS = [
  {
    id: "winter",
    label: "Winter",
    labelTh: "ฤดูหนาว",
    icon: "❄️",
    gradient: "from-sky-400 to-blue-600",
  },
  {
    id: "summer",
    label: "Summer",
    labelTh: "ฤดูร้อน",
    icon: "☀️",
    gradient: "from-amber-400 to-orange-500",
  },
  {
    id: "rainy",
    label: "Rainy",
    labelTh: "ฤดูฝน",
    icon: "🌧️",
    gradient: "from-teal-400 to-cyan-600",
  },
  {
    id: "all_year",
    label: "All Year",
    labelTh: "เที่ยวได้ทั้งปี",
    icon: "✨",
    gradient: "from-emerald-400 to-teal-500",
  },
];

const SEASON_COLOR: Record<string, string> = {
  winter: "bg-sky-500/90 text-white",
  summer: "bg-amber-500/90 text-white",
  rainy: "bg-teal-500/90 text-white",
  all_year: "bg-emerald-500/90 text-white",
};
const SEASON_LABEL: Record<string, string> = {
  winter: "Winter",
  summer: "Summer",
  rainy: "Rainy",
  all_year: "All Year",
};

const CAT_ACCENT: Record<
  string,
  { bg: string; text: string; border: string; dot: string; glow: string }
> = {
  Temple: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    dot: "#f59e0b",
    glow: "rgba(245,158,11,0.2)",
  },
  Beach: {
    bg: "bg-sky-50 dark:bg-sky-950/30",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800",
    dot: "#0ea5e9",
    glow: "rgba(14,165,233,0.2)",
  },
  Nature: {
    bg: "bg-emerald-50 dark:bg-emerald-950/30",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    dot: "#10b981",
    glow: "rgba(16,185,129,0.2)",
  },
  Heritage: {
    bg: "bg-rose-50 dark:bg-rose-950/30",
    text: "text-rose-700 dark:text-rose-400",
    border: "border-rose-200 dark:border-rose-800",
    dot: "#f43f5e",
    glow: "rgba(244,63,94,0.2)",
  },
  Island: {
    bg: "bg-teal-50 dark:bg-teal-950/30",
    text: "text-teal-700 dark:text-teal-400",
    border: "border-teal-200 dark:border-teal-800",
    dot: "#14b8a6",
    glow: "rgba(20,184,166,0.2)",
  },
  Festival: {
    bg: "bg-violet-50 dark:bg-violet-950/30",
    text: "text-violet-700 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    dot: "#8b5cf6",
    glow: "rgba(139,92,246,0.2)",
  },
  Shopping: {
    bg: "bg-pink-50 dark:bg-pink-950/30",
    text: "text-pink-700 dark:text-pink-400",
    border: "border-pink-200 dark:border-pink-800",
    dot: "#ec4899",
    glow: "rgba(236,72,153,0.2)",
  },
  Market: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    text: "text-orange-700 dark:text-orange-400",
    border: "border-orange-200 dark:border-orange-800",
    dot: "#f97316",
    glow: "rgba(249,115,22,0.2)",
  },
};
const catAccent = (c: string) =>
  CAT_ACCENT[c] ?? {
    bg: "bg-slate-50 dark:bg-slate-900/50",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-800",
    dot: "#64748b",
    glow: "rgba(100,116,139,0.15)",
  };

/* ── 3D Tilt Card Component ── */
function Tilt3DCard({
  children,
  className = "",
  intensity = 6,
}: {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(ry, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 300, damping: 28 },
  );
  const rotateY = useSpring(
    useTransform(rx, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 300, damping: 28 },
  );

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      rx.set((e.clientX - r.left) / r.width - 0.5);
      ry.set((e.clientY - r.top) / r.height - 0.5);
      setGlarePos({
        x: ((e.clientX - r.left) / r.width) * 100,
        y: ((e.clientY - r.top) / r.height) * 100,
      });
    },
    [rx, ry],
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        rx.set(0);
        ry.set(0);
        setHovered(false);
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1000,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {children}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none z-20 rounded-2xl overflow-hidden"
            style={{
              background: `radial-gradient(ellipse at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.18) 0%, rgba(16,185,129,0.06) 30%, transparent 60%)`,
              mixBlendMode: "overlay",
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export interface ExploreCardProps {
  item: Place | Event;
  type: "place" | "event";
  index?: number;
}

export function ExploreCard({ item, type, index = 0 }: ExploreCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const isPlace = type === "place";

  const { data: isSavedPlace = false } = useIsFavoritePlace(
    isPlace ? item.id : 0,
  );
  const { data: isSavedEvent = false } = useIsFavoriteEvent(
    !isPlace ? item.id : 0,
  );

  const { mutate: toggleFavoritePlace } = useToggleFavoritePlace();
  const { mutate: toggleFavoriteEvent } = useToggleFavoriteEvent();

  const saved = isPlace ? isSavedPlace : isSavedEvent;
  const { data: provinces = [] } = useProvinces();
  const province = provinces.find((p) => p.id === item.province_id);
  const [hovered, setHovered] = useState(false);

  // Map data
  const imageUrl = item.thumbnail_url || "/placeholder.svg";
  const title = item.name_en;
  const subtitle = item.name;
  const googleRating = Number(item.rating) || 0;
  const userRating =
    type === "place" && (item as Place).user_rating
      ? Number((item as Place).user_rating)
      : type === "event"
        ? googleRating
        : 0;
  const userRatingCount =
    type === "place" && (item as Place).user_rating_count
      ? (item as Place).user_rating_count
      : item.review_count || 0;
  const category =
    item.categories && item.categories.length > 0
      ? item.categories[0]
      : type === "place"
        ? "Place"
        : "Event";

  const bestSeason = type === "place" ? (item as Place).best_season : null;
  const accent = catAccent(category);

  const tags = item.categories || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        delay: index * 0.06,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="h-full"
    >
      <Tilt3DCard intensity={7} className="h-full group">
        <motion.div
          className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-slate-800 cursor-pointer relative h-full flex flex-col"
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => router.push(`/${type}/${item.id}`)}
          animate={{
            boxShadow: hovered
              ? `0 20px 60px -15px ${accent.glow}, 0 8px 24px -6px rgba(0,0,0,0.08)`
              : "0 1px 8px rgba(0,0,0,0.04)",
          }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Image Section ── */}
          <div className="relative h-52 overflow-hidden shrink-0">
            <motion.img
              src={imageUrl}
              alt={title}
              animate={{ scale: hovered ? 1.08 : 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="w-full h-full object-cover"
            />

            {/* Gradient overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />

            {/* Season badge / Event date */}
            {bestSeason && SEASON_COLOR[bestSeason] && (
              <motion.span
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                className={`absolute top-3 left-3 text-xs px-2.5 py-1 rounded-full backdrop-blur-xl ${SEASON_COLOR[bestSeason]} z-10`}
                style={{
                  fontWeight: 600,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                {SEASON_OPTIONS.find((s) => s.id === bestSeason)?.icon}{" "}
                {SEASON_LABEL[bestSeason]}
              </motion.span>
            )}

            {type === "event" && (item as Event).start_date && (
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.03 }}
                className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full backdrop-blur-xl bg-violet-500/90 text-white text-xs z-10"
                style={{
                  fontWeight: 600,
                  boxShadow: "0 2px 12px rgba(0,0,0,0.2)",
                }}
              >
                <Calendar className="w-3.5 h-3.5" />
                {new Date((item as Event).start_date).toLocaleDateString(
                  "en-GB",
                  { month: "short", day: "numeric" },
                )}
              </motion.div>
            )}

            {/* Bottom overlay content */}
            <div className="absolute bottom-0 left-0 right-0 p-4 z-10 pointer-events-none">
              {/* Category pill */}
              <span
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md text-white border border-white/20 mb-2 pointer-events-auto shadow-sm"
                style={{ fontWeight: 700 }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: accent.dot }}
                />
                {category}
              </span>

              {/* Name + Subtitle (Thai) */}
              <h3
                className="text-white mb-0.5 truncate drop-shadow-md"
                style={{ fontWeight: 800, fontSize: "1.05rem" }}
              >
                {title}
              </h3>
              <p className="text-white/80 text-xs truncate drop-shadow-sm">
                {subtitle}
              </p>
            </div>

            {/* Save button */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                if (!user) {
                  router.push(`/auth/login?redirect=/explore`);
                  return;
                }
                if (isPlace) {
                  toggleFavoritePlace(item.id);
                } else {
                  toggleFavoriteEvent(item.id);
                }
              }}
              className={`absolute bottom-4 right-4 w-9 h-9 rounded-full backdrop-blur-xl flex items-center justify-center border transition-all z-20 ${saved ? "bg-red-500 border-red-400/30 text-white shadow-lg shadow-red-500/30" : "bg-white/10 border-white/20 text-white hover:bg-white/25"}`}
            >
              <Heart
                className={`w-4 h-4 transition-all ${saved ? "fill-white" : ""}`}
              />
            </motion.button>
          </div>

          {/* ── Content Section ── */}
          <div className="p-4 relative flex-1 flex flex-col z-10">
            {/* Location + Rating row */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-xs">
                <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="line-clamp-1">
                  {province?.name_en || "Unknown Location"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span
                  className="text-sm text-slate-900 dark:text-slate-100"
                  style={{ fontWeight: 800 }}
                >
                  {type === "place" && userRatingCount > 0
                    ? userRating
                    : googleRating}
                </span>
                <span className="text-xs text-slate-400">
                  (
                  {type === "place" && userRatingCount > 0
                    ? userRatingCount
                    : item.review_count || 0}
                  )
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-4 flex-1">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800"
                  style={{ fontWeight: 500 }}
                >
                  {tag}
                </span>
              ))}
              {tags.length > 3 && (
                <span className="text-xs text-slate-400 px-1 py-1">
                  +{tags.length - 3}
                </span>
              )}
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/${type}/${item.id}`);
              }}
              className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all relative overflow-hidden group/btn"
              style={{
                fontWeight: 700,
                background: "linear-gradient(135deg, #059669, #0d9488)",
                color: "white",
                boxShadow: "0 4px 14px rgba(5,150,105,0.3)",
              }}
            >
              <span className="relative z-10">View Details</span>
              <ArrowRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-1 transition-transform" />
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0"
                animate={{ x: ["-100%", "200%"] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  repeatDelay: 2,
                }}
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                }}
              />
            </motion.button>
          </div>

          {/* Bottom glow edge */}
          <motion.div
            animate={{ opacity: hovered ? 1 : 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 inset-x-0 h-[2px] pointer-events-none z-20"
            style={{
              background: `linear-gradient(90deg, transparent, ${accent.dot}, transparent)`,
            }}
          />
        </motion.div>
      </Tilt3DCard>
    </motion.div>
  );
}
