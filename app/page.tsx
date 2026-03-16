"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Calendar,
  Star,
  ArrowRight,
  Search,
  SlidersHorizontal,
  X,
  Sparkles,
  TrendingUp,
  Heart,
  Gem,
  Flame,
  ChevronRight,
  ChevronLeft,
  Zap,
} from "lucide-react";
import { useAuth } from "@/components/providers/AuthProvider";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { useProvinces } from "@/hooks/api/useProvinces";
import {
  useRecommendedPlaces,
  usePopularPlaces,
  useHiddenGems,
} from "@/hooks/api/usePlaces";
import { useToggleFavoritePlace, useIsFavoritePlace, useToggleFavoriteEvent, useIsFavoriteEvent } from "@/hooks/api/useFavorites";
import { useUpcomingEvents } from "@/hooks/api/useEvents";
import { Place } from "@/lib/dtos/place.dto";
import { Event } from "@/lib/dtos/event.dto";
import { Province } from "@/lib/dtos/province.dto";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

/* ─── Hero image (reduced to w=1200 since it's displayed in a constrained viewport) ─── */
const heroImage =
  "https://images.unsplash.com/photo-1768985966166-e8288d5fae8e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1200";

/* ─── Season filter data ─── */
const seasons = [
  { id: "cool", label: "Cool Season", months: "Nov – Feb", icon: "❄️", color: "blue" },
  { id: "hot", label: "Hot Season", months: "Mar – May", icon: "☀️", color: "amber" },
  { id: "rainy", label: "Rainy Season", months: "Jun – Oct", icon: "🌧️", color: "teal" },
];

/* ─── Category filter data ─── */
const categories = [
  { id: "all", label: "All", icon: "🌏" },
  { id: "Temple", label: "Temples", icon: "🛕" },
  { id: "Beach", label: "Beaches", icon: "🏖️" },
  { id: "Nature", label: "Nature", icon: "🌿" },
  { id: "Heritage", label: "Heritage", icon: "🏛️" },
  { id: "Festival", label: "Festivals", icon: "🎆" },
  { id: "Island", label: "Islands", icon: "🏝️" },
  { id: "Market", label: "Markets", icon: "🛒" },
  { id: "Shopping", label: "Shopping", icon: "🛍️" },
];

/* ─── Helpers ─── */
function getProvinceName(provinces: Province[], id: number) {
  return provinces.find((p) => p.id === id)?.name_en || "";
}

/* ══════════════════════════════════════════════
   3-D TILT HOOK (shared)
══════════════════════════════════════════════ */
function use3DTilt(intensity = 10) {
  const ref = useRef<HTMLDivElement>(null);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [intensity, -intensity]), { stiffness: 260, damping: 26 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-intensity, intensity]), { stiffness: 260, damping: 26 });

  const onMove = useCallback((e: React.MouseEvent) => {
    const el = ref.current; if (!el) return;
    const r = el.getBoundingClientRect();
    rawX.set((e.clientX - r.left) / r.width - 0.5);
    rawY.set((e.clientY - r.top) / r.height - 0.5);
    setGlarePos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  }, [rawX, rawY]);

  const onLeave = useCallback(() => { rawX.set(0); rawY.set(0); }, [rawX, rawY]);

  return { ref, rotateX, rotateY, glarePos, onMove, onLeave };
}



/* ═══════════════════════════════════════════════════
   PLACE CARD (3-D tilt + holographic glare)
═══════════════════════════════════════════════════ */
function PlaceCard3D({ place, provinces, size = "default" }: { place: Place; provinces: Province[]; size?: "default" | "large" | "small" }) {
  const { user } = useAuth();
  const { data: isSaved = false } = useIsFavoritePlace(place.id);
  const { mutate: toggleFavorite } = useToggleFavoritePlace();
  const [hovered, setHovered] = useState(false);
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const heightClass = size === "large" ? "h-64" : size === "small" ? "h-40" : "h-52";
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(useTransform(rawY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 28 });
  const rotateY = useSpring(useTransform(rawX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 28 });

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current; if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
    setGlarePos({ x: ((e.clientX - rect.left) / rect.width) * 100, y: ((e.clientY - rect.top) / rect.height) * 100 });
  }, [rawX, rawY]);
  const handleMouseLeave = useCallback(() => { rawX.set(0); rawY.set(0); setHovered(false); }, [rawX, rawY]);

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={() => router.push(`/place/${place.id}`)}
      style={{
        rotateX, rotateY,
        transformPerspective: 900, transformStyle: "preserve-3d",
        filter: hovered ? "drop-shadow(0 24px 40px rgba(5,150,105,0.18)) drop-shadow(0 8px 16px rgba(0,0,0,0.12))" : "drop-shadow(0 2px 8px rgba(0,0,0,0.07))",
      }}
      className="group cursor-pointer bg-white rounded-2xl overflow-hidden border border-gray-100 relative"
    >
      <div className={`relative ${heightClass} overflow-hidden`}>
        <motion.div animate={{ scale: hovered ? 1.09 : 1 }} transition={{ duration: 0.6, ease: "easeOut" }} className="w-full h-full">
          <Image src={place.thumbnail_url || "/placeholder.svg"} alt={place.name} fill sizes="(max-width: 768px) 100vw, 33vw" quality={75} className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <motion.div animate={{ y: hovered ? -2 : 0 }} transition={{ duration: 0.3 }}
          className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 shadow-md"
          style={{ transform: "translateZ(20px)" }}>
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-gray-800">{place.rating}</span>
        </motion.div>
        <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => {
          e.stopPropagation();
          if (!user) {
            router.push("/auth/login?redirect=/");
            return;
          }
          toggleFavorite(place.id);
        }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 transition-colors">
          <Heart className={`w-4 h-4 transition-all ${isSaved ? "text-red-400 fill-red-400 scale-110" : "text-white"}`} />
        </motion.button>
        <div className="absolute bottom-3 left-3">
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full border border-white/30">
            {place.categories[0] || "Place"}
          </span>
        </div>
        {hovered && (
          <div className="absolute inset-0 pointer-events-none z-10"
            style={{ background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.22) 0%, transparent 60%)`, mixBlendMode: "overlay" }}
          />
        )}
      </div>
      <motion.div className="p-4" animate={{ y: hovered ? -1 : 0 }} transition={{ duration: 0.3 }}>
        <h3 className="font-semibold text-gray-900 truncate mb-1 group-hover:text-emerald-600 transition-colors">{place.name_en || place.name}</h3>
        <div className="flex items-center gap-1 text-gray-400 mb-2">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="text-xs truncate">{getProvinceName(provinces, place.province_id)}</span>
        </div>
        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{place.detail_en || place.detail}</p>
      </motion.div>
      {hovered && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 pointer-events-none rounded-b-2xl"
          style={{ background: "linear-gradient(90deg, transparent, #10b981, transparent)" }}
        />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   HERO CARD (Bento - big featured card)
═══════════════════════════════════════════════════ */
function HeroCard({ place, provinces, index }: { place: Place; provinces: Province[]; index: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: isSaved = false } = useIsFavoritePlace(place.id);
  const { mutate: toggleFavorite } = useToggleFavoritePlace();
  const [hovered, setHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 200, damping: 20 });

  return (
    <motion.div ref={cardRef}
      initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.55, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      style={{ rotateX, rotateY, transformPerspective: 1000 }}
      onMouseMove={(e) => {
        const rect = cardRef.current?.getBoundingClientRect(); if (!rect) return;
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => router.push(`/place/${place.id}`)}
      className="relative rounded-3xl overflow-hidden cursor-pointer h-full"
    >
      <div className="relative z-10 h-full rounded-3xl overflow-hidden">
        <motion.div animate={{ scale: hovered ? 1.07 : 1 }} transition={{ duration: 0.7, ease: "easeOut" }} className="w-full h-full relative">
          <Image src={place.thumbnail_url || "/placeholder.svg"} alt={place.name} fill sizes="50vw" quality={75} className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
        <div className="absolute top-4 left-4 right-4 flex items-start justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full bg-white/15 text-white border border-white/25 backdrop-blur-md">
            {place.categories[0] || "Place"}
          </span>

        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={(e) => {
          e.stopPropagation();
          if (!user) {
            router.push("/auth/login?redirect=/");
            return;
          }
          toggleFavorite(place.id);
        }}
          className="absolute top-14 right-4 w-9 h-9 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/25 transition-colors">
          <Heart className={`w-4 h-4 transition-all ${isSaved ? "fill-red-400 text-red-400" : "text-white"}`} />
        </motion.button>
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MapPin className="w-3.5 h-3.5 text-white/60" />
            <span className="text-white/60 text-xs">{getProvinceName(provinces, place.province_id)}</span>
          </div>
          <h3 className="text-white font-extrabold mb-3" style={{ fontSize: "1.55rem", lineHeight: 1.2 }}>{place.name_en || place.name}</h3>
          <motion.button whileHover={{ gap: "12px" }} initial={{ gap: "8px" }}
            onClick={(e) => { e.stopPropagation(); router.push(`/place/${place.id}`); }}
            className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-emerald-50 transition-colors shadow-lg">
            Explore <ArrowRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   RANK CARD (Right side of bento grid)
═══════════════════════════════════════════════════ */
function RankCard({ place, provinces, rank, delay }: { place: Place; provinces: Province[]; rank: number; delay: number }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);


  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      onHoverStart={() => setHovered(true)} onHoverEnd={() => setHovered(false)}
      onClick={() => router.push(`/place/${place.id}`)}
      className="relative flex gap-0 bg-white rounded-2xl overflow-hidden cursor-pointer border border-gray-100 group"
      style={{ boxShadow: hovered ? "0 8px 30px -8px rgba(5,150,105,0.3)" : "0 1px 8px rgba(0,0,0,0.05)", transition: "box-shadow 0.3s ease" }}
    >
      <div className="w-1 shrink-0 rounded-l-2xl bg-emerald-500" />
      <div className="relative w-32 shrink-0 overflow-hidden">
        <motion.div animate={{ scale: hovered ? 1.08 : 1 }} transition={{ duration: 0.5 }} className="w-full h-full relative">
          <Image src={place.thumbnail_url || "/placeholder.svg"} alt={place.name} fill sizes="128px" quality={60} className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.28)" }}>
          <span className="font-black text-white/30 select-none" style={{ fontSize: "4rem", lineHeight: 1 }}>{rank}</span>
        </div>

      </div>
      <div className="flex-1 px-4 py-3 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">{place.categories[0] || "Place"}</span>
            <span className="text-xs text-gray-400 flex items-center gap-0.5 truncate"><MapPin className="w-3 h-3 shrink-0" />{getProvinceName(provinces, place.province_id)}</span>
          </div>
          <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors truncate mb-0.5" style={{ fontSize: "0.95rem" }}>{place.name_en || place.name}</h4>
          <p className="text-xs text-gray-400 truncate mb-2">{place.name}</p>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-sm font-bold text-gray-900">{place.rating}</span>
          </div>
          <button onClick={(e) => { e.stopPropagation(); router.push(`/place/${place.id}`); }}
            className="flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg transition-colors">
            View <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   ROTATING REASON TYPEWRITER
═══════════════════════════════════════════════════ */
const REASONS = [
  "Based on your preferences",
  "Curated with AI intelligence",
  "Hidden gems and local picks",
  "Best for current season",
];

function RotatingReason() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx((i) => (i + 1) % REASONS.length); setVisible(true); }, 300);
    }, 3000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.span animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.25 }} className="text-emerald-600">
      {REASONS[idx]}
    </motion.span>
  );
}

/* ═══════════════════════════════════════════════════
   TRENDING CARD (horizontal scroll)
═══════════════════════════════════════════════════ */
const TREND_GRADIENTS = ["from-orange-500 to-rose-500", "from-rose-500 to-pink-500", "from-amber-500 to-orange-500", "from-red-500 to-rose-600"];

function TrendCard({ place, provinces, rank, delay }: { place: Place; provinces: Province[]; rank: number; delay: number }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const { ref, rotateX, rotateY, glarePos, onMove, onLeave } = use3DTilt(5);
  const gradient = TREND_GRADIENTS[(rank - 1) % TREND_GRADIENTS.length];

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={(e) => { onMove(e); setHovered(true); }}
      onMouseLeave={() => { onLeave(); setHovered(false); }}
      style={{
        rotateX, rotateY, transformPerspective: 700, transformStyle: "preserve-3d",
        filter: hovered ? "drop-shadow(0 20px 36px rgba(249,115,22,0.28))" : "drop-shadow(0 2px 10px rgba(0,0,0,0.07))"
      }}
      onClick={() => router.push(`/place/${place.id}`)}
      className="relative flex-shrink-0 w-56 rounded-2xl overflow-hidden cursor-pointer bg-white border border-gray-100 group"
    >
      <div className="relative h-44 overflow-hidden">
        <motion.div animate={{ scale: hovered ? 1.07 : 1 }} transition={{ duration: 0.6 }} className="w-full h-full relative">
          <Image src={place.thumbnail_url || "/placeholder.svg"} alt={place.name} fill sizes="224px" quality={70} className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {hovered && (
          <div className="absolute inset-0 pointer-events-none z-10" style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.2) 0%, transparent 60%)`, mixBlendMode: "overlay"
          }} />
        )}
        <span className="absolute -bottom-4 -right-2 font-black text-white/10 select-none pointer-events-none" style={{ fontSize: "8rem", lineHeight: 1 }}>{rank}</span>
        <div className="absolute top-3 left-3" style={{ transform: "translateZ(12px)" }}>
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gradient-to-r ${gradient} text-white shadow-lg`}>
            <Flame className="w-3.5 h-3.5" /><span className="text-xs font-extrabold">#{rank}</span>
          </div>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" /><span className="text-white text-xs font-bold">{place.rating}</span>
        </div>
        <div className="absolute bottom-3 left-3 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-white/60" /><span className="text-white/70 text-xs">{getProvinceName(provinces, place.province_id)}</span>
        </div>
      </div>
      <motion.div className="p-4" animate={{ y: hovered ? -1 : 0 }} style={{ transform: "translateZ(8px)" }}>
        <h4 className="font-bold text-gray-900 truncate mb-0.5" style={{ fontSize: "0.95rem" }}>{place.name_en || place.name}</h4>
        <p className="text-xs text-gray-400 truncate mb-3">{place.name}</p>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-gray-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Popularity</span>
            <span className="text-xs font-bold text-gray-700">{place.rating}/5</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <motion.div className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
              initial={{ width: 0 }} animate={{ width: `${Math.min(((place.rating || 4) / 5) * 100, 100)}%` }}
              transition={{ duration: 1, delay: delay + 0.3, ease: "easeOut" }} />
          </div>
        </div>
      </motion.div>
      {hovered && (
        <div className="absolute bottom-0 inset-x-0 h-0.5 pointer-events-none" style={{ background: "linear-gradient(90deg, transparent, #f97316, transparent)" }} />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   HIDDEN GEM CARD (Dark thematic)
═══════════════════════════════════════════════════ */
function HiddenGemCard({ place, provinces, delay }: { place: Place; provinces: Province[]; delay: number }) {
  const router = useRouter();
  const [hovered, setHovered] = useState(false);
  const { ref, rotateX, rotateY, glarePos, onMove, onLeave } = use3DTilt(8);

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={(e) => { onMove(e); setHovered(true); }}
      onMouseLeave={() => { onLeave(); setHovered(false); }}
      style={{ rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d", boxShadow: hovered ? "0 20px 40px rgba(5,150,105,0.2)" : "none" }}
      onClick={() => router.push(`/place/${place.id}`)}
      className="relative flex-shrink-0 w-64 h-80 rounded-3xl overflow-hidden cursor-pointer group bg-black"
    >
      <motion.div animate={{ scale: hovered ? 1.08 : 1 }} transition={{ duration: 0.8 }} className="w-full h-full relative">
        <Image src={place.thumbnail_url || "/placeholder.svg"} alt={place.name_en || place.name} fill sizes="256px" quality={75} className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/10" />
      {hovered && (
        <div className="absolute inset-0 pointer-events-none z-10" style={{
          background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`, mixBlendMode: "overlay"
        }} />
      )}
      <div className="absolute top-4 left-4" style={{ transform: "translateZ(20px)" }}>
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 backdrop-blur-md text-white text-xs font-bold border border-white/20 shadow-lg">
          <Gem className="w-3.5 h-3.5 text-emerald-400" /> Hidden Gem
        </span>
      </div>
      <div className="absolute bottom-0 inset-x-0 p-5" style={{ transform: "translateZ(30px)" }}>
        <h4 className="font-extrabold text-white mb-1 truncate" style={{ fontSize: "1.2rem", lineHeight: 1.2 }}>{place.name_en || place.name}</h4>
        <p className="text-emerald-300 text-xs mb-3 font-medium truncate">{place.name}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-white/70">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs truncate max-w-[100px]">{getProvinceName(provinces, place.province_id)}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold text-white">{place.rating}</span>
          </div>
        </div>
      </div>
      {hovered && (
        <div className="absolute inset-0 ring-1 ring-inset ring-emerald-500/30 rounded-3xl pointer-events-none" />
      )}
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   FESTIVAL POSTER CARD
═══════════════════════════════════════════════════ */
function FestivalPosterCard({ event, provinces, delay }: { event: Event; provinces: Province[]; delay: number }) {
  const router = useRouter();
  const { user } = useAuth();
  const [hovered, setHovered] = useState(false);
  const { ref, rotateX, rotateY, glarePos, onMove, onLeave } = use3DTilt(7);
  const { data: isSaved = false } = useIsFavoriteEvent(event.id);
  const { mutate: toggleFavorite } = useToggleFavoriteEvent();

  const days = Math.ceil((new Date(event.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isPast = days < 0;
  const isNear = days >= 0 && days <= 30;
  const colors = ["#0ea5e9", "#f59e0b", "#ec4899", "#8b5cf6", "#10b981"];
  const color = colors[(event.id || 0) % colors.length];

  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 30, rotate: -2 }} animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={(e) => { onMove(e); setHovered(true); }}
      onMouseLeave={() => { onLeave(); setHovered(false); }}
      style={{
        rotateX, rotateY, transformPerspective: 1000, transformStyle: "preserve-3d",
        filter: hovered ? `drop-shadow(0 25px 45px ${color}40)` : `drop-shadow(0 4px 20px ${color}20)`
      }}
      className="relative flex-1 min-w-0 rounded-[2rem] overflow-hidden cursor-pointer group border border-gray-100/50 bg-white"
    >
      <div className="h-full w-full flex flex-col" onClick={() => router.push(`/event/${event.id}`)}>
        <div className="relative h-80">
          <motion.div animate={{ scale: hovered ? 1.08 : 1 }} transition={{ duration: 0.8, ease: "easeOut" }} className="w-full h-full relative">
            <Image src={event.thumbnail_url || "/placeholder.svg"} alt={event.name_en || event.name} fill sizes="(max-width: 768px) 100vw, 33vw" quality={85} className="object-cover" />
          </motion.div>
          {/* Enhanced Gradients */}
          <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.8) 100%)` }} />
          <div className="absolute inset-0 mix-blend-overlay opacity-60" style={{ background: `linear-gradient(135deg, ${color} 0%, transparent 100%)` }} />

          <div className="absolute inset-0 opacity-[0.08] pointer-events-none" style={{
            backgroundImage: "radial-gradient(circle, #fff 1.5px, transparent 1.5px)", backgroundSize: "24px 24px"
          }} />

          {hovered && (
            <div className="absolute inset-0 pointer-events-none z-10" style={{
              background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.25) 0%, transparent 50%)`, mixBlendMode: "overlay"
            }} />
          )}

          <div className="absolute top-4 left-4" style={{ transform: "translateZ(20px)" }}>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-black/30 backdrop-blur-md text-white text-xs font-semibold border border-white/20 shadow-lg">
              <MapPin className="w-3.5 h-3.5 text-white/90" />{getProvinceName(provinces, event.province_id)}
            </span>
          </div>

          <div className="absolute top-4 right-4 flex gap-2" style={{ transform: "translateZ(20px)" }}>
            <motion.button whileTap={{ scale: 0.85 }} onClick={(e) => {
              e.stopPropagation();
              if (!user) {
                router.push("/auth/login?redirect=/");
                return;
              }
              toggleFavorite(event.id);
            }}
              className="w-9 h-9 rounded-full bg-black/30 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg hover:bg-black/50 transition-colors">
              <Heart className={`w-4 h-4 transition-all ${isSaved ? "text-red-500 fill-red-500 scale-110" : "text-white"}`} />
            </motion.button>
          </div>

          <div className="absolute bottom-6 left-6 right-6" style={{ transform: "translateZ(25px)" }}>
            <div className="flex items-center justify-between mb-3">
              {!isPast ? (
                <div className="flex items-baseline gap-1.5">
                  <motion.span animate={{ scale: hovered ? 1.05 : 1 }} className="font-black text-white tracking-tighter" style={{ fontSize: "3.5rem", lineHeight: 0.85 }}>{days}</motion.span>
                  <span className="text-white/80 text-sm font-semibold uppercase tracking-wider">Days</span>
                </div>
              ) : (
                <div className="flex items-baseline gap-1.5">
                  <span className="font-black text-white/50 tracking-tighter" style={{ fontSize: "3.5rem", lineHeight: 0.85 }}>—</span>
                </div>
              )}

              {isPast ? (
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/70 text-xs font-bold border border-white/10">Ended</span>
              ) : isNear ? (
                <span className="px-3 py-1 rounded-full bg-white text-gray-900 text-xs font-bold shadow-lg flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> Soon
                </span>
              ) : null}
            </div>

            <h3 className="text-white font-black mb-1.5 drop-shadow-md truncate" style={{ fontSize: "1.35rem", lineHeight: 1.25 }}>
              {event.name_en || event.name}
            </h3>
            <p className="text-white/70 text-xs font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(event.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
        </div>

        <motion.div className="bg-white flex-1 p-6 relative" animate={{ y: hovered ? -2 : 0 }}>
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">
            {event.detail_en || event.detail}
          </p>
          <div className="flex items-center justify-between mt-auto">
            <div className="flex -space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center overflow-hidden">
                  <Image src={`https://i.pravatar.cc/100?img=${event.id + i * 5}`} alt="Attendee" width={28} height={28} />
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-50 flex items-center justify-center text-[9px] font-bold text-gray-500">+</div>
            </div>
            <button className="flex items-center gap-1.5 text-xs font-bold text-white px-4 py-2.5 rounded-xl shadow-md transition-transform hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>
              Explore <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN PAGE COMPONENT
═══════════════════════════════════════════════════ */
export default function Home() {
  const { data: provinces = [] } = useProvinces();
  const { data: recommendedPlaces = [], isLoading: isLoadingRecommended } = useRecommendedPlaces();
  const { data: popularPlaces = [], isLoading: isLoadingPopular } = usePopularPlaces();
  const { data: hiddenGems = [], isLoading: isLoadingGems } = useHiddenGems();
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } = useUpcomingEvents();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [activeSeason, setActiveSeason] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("all");

  // Trending scroll
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const scroll = (dir: "left" | "right") => scrollRef.current?.scrollBy({ left: dir === "right" ? 240 : -240, behavior: "smooth" });
  const onScroll = () => {
    const el = scrollRef.current; if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  // Data for sections
  const [heroPlace, ...restRecommended] = recommendedPlaces;
  const rankCards = restRecommended.slice(0, 3);
  const miniCards = restRecommended.slice(3);
  const highlightEvents = upcomingEvents.filter(e => e.is_highlight);

  return (
    <main className="min-h-screen flex-1 overflow-y-auto">
      {/* ─── Hero Section ─── */}
      <div className="relative h-[440px] overflow-hidden">
        <Image src={heroImage} alt="Thailand" fill sizes="100vw" quality={80} priority className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/30 to-[#f8f9fa]" />
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-4">
          <span className="bg-white/20 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full border border-white/30 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />Thailand
          </span>
          <button className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 hover:bg-white/30 transition-colors">
            <SlidersHorizontal className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center -mt-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="text-emerald-300 text-sm font-medium tracking-widest uppercase mb-2">Discover Hidden Thailand</p>
            <h1 className="text-white mb-3" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 700, lineHeight: 1.2 }}>
              Your Personal Thailand<br />Travel Guide
            </h1>
            <p className="text-white/70 text-base mb-6 max-w-md">Beyond the tourist trail — explore authentic local gems, cultural wonders, and natural paradises.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="w-full max-w-xl relative">
            <div className={`flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-2xl transition-all duration-200 ${searchFocused ? "ring-2 ring-emerald-400" : ""}`}>
              <Search className="w-5 h-5 text-gray-400 shrink-0" />
              <input type="text" placeholder="Search destinations, provinces, or activities..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)} onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                className="flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent text-sm" />
              {searchQuery && (<button onClick={() => setSearchQuery("")}><X className="w-4 h-4 text-gray-400 hover:text-gray-600" /></button>)}
              <Link href="/explore" className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors whitespace-nowrap">Search</Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="px-8 pb-12 -mt-2">
        {/* Season Filter */}
        <div className="flex gap-3 mb-6 pt-4 overflow-x-auto scrollbar-hide">
          {seasons.map((season) => {
            const colorMap: Record<string, string> = {
              blue: activeSeason === season.id ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-200" : "bg-white text-gray-600 border-gray-200 hover:border-blue-300",
              amber: activeSeason === season.id ? "bg-amber-500 text-white border-amber-500 shadow-lg shadow-amber-200" : "bg-white text-gray-600 border-gray-200 hover:border-amber-300",
              teal: activeSeason === season.id ? "bg-teal-500 text-white border-teal-500 shadow-lg shadow-teal-200" : "bg-white text-gray-600 border-gray-200 hover:border-teal-300",
            };
            return (
              <button key={season.id} onClick={() => setActiveSeason(activeSeason === season.id ? null : season.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 shrink-0 ${colorMap[season.color]}`}>
                <span>{season.icon}</span>
                <div className="text-left">
                  <p className="leading-none text-xs font-semibold">{season.label}</p>
                  <p className={`leading-none text-xs mt-0.5 ${activeSeason === season.id ? "text-white/80" : "text-gray-400"}`}>{season.months}</p>
                </div>
              </button>
            );
          })}
          {activeSeason && (
            <button onClick={() => setActiveSeason(null)} className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm text-gray-400 hover:text-gray-600 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" />Clear
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {categories.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${activeCategory === cat.id ? "bg-emerald-500 text-white shadow-md shadow-emerald-200" : "bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-600"
                }`}>
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>

        {/* ═══ Section 01: AI-Curated Recommendations (Bento Grid) ═══ */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-start gap-4">
              <span className="font-black text-gray-200 select-none leading-none mt-1" style={{ fontSize: "3.5rem", lineHeight: 0.9 }}>01</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <motion.span animate={{ opacity: [1, 0.7, 1] }} transition={{ repeat: Infinity, duration: 2 }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full text-white shadow-lg shadow-emerald-200/60"
                    style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)" }}>
                    <Sparkles className="w-3.5 h-3.5" />AI-Curated Picks
                  </motion.span>
                  <span className="flex items-center gap-1 text-xs text-gray-400">
                    <motion.span animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                    Updated today
                  </span>
                </div>
                <h2 className="font-extrabold text-gray-900" style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>Recommended for You</h2>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1"><RotatingReason /></p>
              </div>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-emerald-600 font-semibold hover:text-emerald-700 transition-colors whitespace-nowrap">
              See All<ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingRecommended ? <LoadingSkeleton /> : (
            <>
              {/* Bento Grid */}
              <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr", minHeight: 380 }}>
                {heroPlace && <div className="row-span-3" style={{ minHeight: 380 }}><HeroCard place={heroPlace} provinces={provinces} index={0} /></div>}
                {rankCards.map((p, i) => <RankCard key={p.id} place={p} provinces={provinces} rank={i + 2} delay={0.15 + i * 0.12} />)}
              </div>
              {/* More Picks Scroll */}
              {miniCards.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">More you might like</p>
                  <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide">
                    {miniCards.map((p, i) => (
                      <motion.div key={p.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 + i * 0.06, ease: "easeOut" }} whileHover={{ y: -4 }}
                        className="flex-shrink-0 w-44">
                        <PlaceCard3D place={p} provinces={provinces} size="small" />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* ═══ Section 02: Trending Now ═══ */}
        <section className="mb-12">
          <div className="flex items-end justify-between mb-6">
            <div className="flex items-start gap-4">
              <span className="font-black text-gray-200 select-none leading-none" style={{ fontSize: "3.5rem", lineHeight: 0.9 }}>02</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-lg shadow-orange-200/60"
                    style={{ background: "linear-gradient(135deg,#f97316,#ef4444)" }}>
                    <motion.span animate={{ opacity: [1, 0.4, 1] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-2 h-2 rounded-full bg-white inline-block" />
                    LIVE
                  </span>
                </div>
                <h2 className="font-extrabold text-gray-900" style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>Trending Now</h2>
                <p className="text-xs text-gray-400 mt-0.5">Most popular places right now</p>
              </div>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 transition-colors">
              See All<ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingPopular ? <LoadingSkeleton /> : (
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10 pointer-events-none rounded-l-2xl" />
              <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10 pointer-events-none" />
              <AnimatePresence>
                {canScrollLeft && (
                  <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => scroll("left")} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-20 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100">
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </motion.button>
                )}
              </AnimatePresence>
              <motion.button onClick={() => scroll("right")}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-20 w-9 h-9 bg-white rounded-full shadow-xl flex items-center justify-center border border-gray-100">
                <ChevronRight className="w-4 h-4 text-gray-700" />
              </motion.button>
              <div ref={scrollRef} onScroll={onScroll} className="flex gap-4 overflow-x-auto px-1 pb-2 scrollbar-hide">
                {popularPlaces.map((place, i) => <TrendCard key={place.id} place={place} provinces={provinces} rank={i + 1} delay={i * 0.08} />)}
              </div>
            </div>
          )}
        </section>

        {/* ═══ Section 03: Off the Map Hidden Gems ═══ */}
        <section className="mb-12 py-12 px-8 -mx-8 bg-[#0a0a0a] relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "radial-gradient(circle at 50% 0%, #059669 0%, transparent 70%)" }} />
          <div className="relative z-10 flex items-end justify-between mb-8">
            <div className="flex items-start gap-4">
              <span className="font-black text-white/20 select-none leading-none" style={{ fontSize: "3.5rem", lineHeight: 0.9 }}>03</span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-900 bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                    <Gem className="w-3.5 h-3.5" /> Off the Map
                  </span>
                </div>
                <h2 className="font-extrabold text-white" style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>Hidden Gems</h2>
                <p className="text-xs text-emerald-200/60 mt-0.5">Discover Thailand's best-kept secrets</p>
              </div>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm text-emerald-400 font-semibold hover:text-emerald-300 transition-colors">
              Explore All<ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {isLoadingGems ? <LoadingSkeleton /> : (
            <div className="relative z-10 flex gap-5 overflow-x-auto pb-6 scrollbar-hide">
              {hiddenGems.map((place, i) => <HiddenGemCard key={place.id} place={place} provinces={provinces} delay={i * 0.1} />)}
            </div>
          )}
        </section>

        {/* ═══ Section 04: Upcoming Festivals (Poster Cards) ═══ */}
        {upcomingEvents.length > 0 && (
          <section className="mb-12">
            <div className="flex items-end justify-between mb-6">
              <div className="flex items-start gap-4">
                <span className="font-black text-gray-200 select-none leading-none" style={{ fontSize: "3.5rem", lineHeight: 0.9 }}>04</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-md shadow-pink-200/60"
                      style={{ background: "linear-gradient(135deg,#ec4899,#f59e0b)" }}>
                      <Calendar className="w-3.5 h-3.5" />Coming Up
                    </span>
                  </div>
                  <h2 className="font-extrabold text-gray-900" style={{ fontSize: "1.6rem", lineHeight: 1.2 }}>Upcoming Festivals</h2>
                  <p className="text-xs text-gray-400 mt-0.5">Don&apos;t miss these — save the dates!</p>
                </div>
              </div>
              <Link href="/explore" className="flex items-center gap-1.5 text-sm text-pink-500 font-semibold hover:text-pink-600 transition-colors">
                Calendar View<ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            {isLoadingEvents ? <LoadingSkeleton /> : (
              <div className="flex gap-5">
                {upcomingEvents.slice(0, 3).map((event, i) => (
                  <FestivalPosterCard key={event.id} event={event} provinces={provinces} delay={i * 0.1} />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="flex gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex-1 h-64 rounded-2xl bg-gray-100 animate-pulse" />
      ))}
    </div>
  );
}