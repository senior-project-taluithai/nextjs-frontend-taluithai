"use client";

import { use, useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import {
  Loader2,
  MapPin,
  Star,
  Heart,
  Share2,
  ArrowLeft,
  Plus,
  Clock,
  Camera,
  Globe,
  Tag,
  Info,
  ThumbsUp,
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Play,
  Calendar,
  Gem,
  Users,
  Navigation2,
  MessageSquare,
  Send,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { useEvent, useAddEventReview, useTiktokVideos } from "@/hooks/api/useEvents";
import { useProvinces } from "@/hooks/api/useProvinces";
import {
  useToggleFavoriteEvent,
  useIsFavoriteEvent,
} from "@/hooks/api/useFavorites";
import { interactionService } from "@/lib/services/interaction";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/providers/AuthProvider";

const Map = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-muted-foreground">
      Loading Map...
    </div>
  ),
});

/* ─── Category Emoji ─── */
const CATEGORY_EMOJI: Record<string, string> = {
  Festival: "🎆",
  Concert: "🎸",
  Exhibition: "🖼️",
  Culture: "🛖",
  Food: "🍜",
  Market: "🛍️",
  Sport: "🏅",
  Party: "🎈",
  Music: "🎵",
  Religion: "🙏",
};

function getEmojiForCategory(cat: string) {
  for (const [key, value] of Object.entries(CATEGORY_EMOJI)) {
    if (cat.toLowerCase().includes(key.toLowerCase())) return value;
  }
  return "🗓️";
}

/* ─── Floating Particle ─── */
function FloatingParticle({
  delay,
  size,
  x,
  dur,
}: {
  delay: number;
  size: number;
  x: string;
  dur: number;
}) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none"
      style={{ width: size, height: size, left: x, bottom: -20 }}
      animate={{ y: [0, -600], opacity: [0, 0.6, 0], scale: [0.5, 1, 0.3] }}
      transition={{ duration: dur, repeat: Infinity, delay, ease: "easeOut" }}
    >
      <div className="w-full h-full rounded-full bg-gradient-to-t from-pink-500/40 to-white/20" />
    </motion.div>
  );
}

/* ─── 3D Tilt Wrapper ─── */
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
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(rawY, [-0.5, 0.5], [intensity, -intensity]),
    { stiffness: 300, damping: 28 },
  );
  const rotateY = useSpring(
    useTransform(rawX, [-0.5, 0.5], [-intensity, intensity]),
    { stiffness: 300, damping: 28 },
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      rawX.set((e.clientX - rect.left) / rect.width - 0.5);
      rawY.set((e.clientY - rect.top) / rect.height - 0.5);
      setGlarePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    },
    [rawX, rawY],
  );

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        rawX.set(0);
        rawY.set(0);
        setHovered(false);
      }}
      style={{
        rotateX,
        rotateY,
        transformPerspective: 1200,
        transformStyle: "preserve-3d",
      }}
      className={`relative ${className}`}
    >
      {children}
      {hovered && (
        <div
          className="absolute inset-0 pointer-events-none z-10 rounded-2xl overflow-hidden"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(255,255,255,0.15) 0%, transparent 60%)`,
            mixBlendMode: "overlay",
          }}
        />
      )}
    </motion.div>
  );
}

/* ─── Animated Counter ─── */
function AnimatedNumber({
  value,
  duration = 1.5,
}: {
  value: number;
  duration?: number;
}) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration * 60);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(interval);
  }, [value, duration]);
  return <>{display.toLocaleString()}</>;
}

/* ─── Gallery Lightbox ─── */
function GalleryLightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft")
        setIdx((i) => (i - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex items-center justify-center"
      onClick={onClose}
    >
      <motion.img
        key={idx}
        src={images[idx]}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-[85vw] max-h-[85vh] object-contain rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        alt="Gallery"
      />
      <button
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i - 1 + images.length) % images.length);
        }}
        className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIdx((i) => (i + 1) % images.length);
        }}
        className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/20 transition-colors"
      >
        <ChevronRight className="w-6 h-6" />
      </button>
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={(e) => {
              e.stopPropagation();
              setIdx(i);
            }}
            className={`w-2.5 h-2.5 rounded-full transition-all ${i === idx ? "bg-white scale-125" : "bg-white/30 hover:bg-white/50"}`}
          />
        ))}
      </div>
    </motion.div>
  );
}

/* ─── Stagger animation wrapper ─── */
function StaggerItem({
  children,
  index,
  className = "",
}: {
  children: React.ReactNode;
  index: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.1 + index * 0.08,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const eventId = Number(id);
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: event,
    isLoading: isLoadingEvent,
    isError,
    refetch,
  } = useEvent(eventId);
  const { data: provinces = [] } = useProvinces();
  const { mutate: toggleFavorite } = useToggleFavoriteEvent();
  const { data: isSaved = false } = useIsFavoriteEvent(eventId);
  const addReviewMutation = useAddEventReview();

  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "reviews" | "photos" | "tiktok">(
    "overview",
  );
  const [scrollY, setScrollY] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState<number | null>(null);
  const { data: tiktokVideos = [], isLoading: isLoadingTiktok } =
    useTiktokVideos(eventId);

  useEffect(() => {
    if (event)
      interactionService.track({ event_id: eventId, interaction_type: "view" });
  }, [event, eventId]);

  useEffect(() => {
    const handler = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  if (isLoadingEvent)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f6f8] text-pink-600">
        <Loader2 className="w-8 h-8 animate-spin mb-4" />
        <p>Loading event details...</p>
      </div>
    );
  if (isError || !event) return notFound();

  const province = provinces.find((p) => p.id === event.province_id);

  // Extract primary images
  const allImages = (event.image_urls || []).filter(
    (u) => u && u.trim() !== "",
  );
  if (
    allImages.length === 0 &&
    event.thumbnail_url &&
    event.thumbnail_url.trim() !== ""
  ) {
    allImages.push(event.thumbnail_url);
  }
  const coverImage =
    event.thumbnail_url && event.thumbnail_url.trim() !== ""
      ? event.thumbnail_url
      : allImages[0] || "/placeholder.svg";

  const primaryCategory = event.categories[0] || "Event";
  const emoji = getEmojiForCategory(primaryCategory);

  const heroParallax = Math.min(scrollY * 0.35, 150);
  const heroOpacity = Math.max(1 - scrollY / 500, 0);

  const reviewCount = event?.event_reviews?.length || 0;
  const rating = Math.round((event?.rating || 0) * 10) / 10;
  const rank = Math.floor(Math.random() * 5) + 1;

  // Calculate rating distribution from actual user reviews
  const ratingDistribution = (() => {
    const reviews = event?.event_reviews || [];
    if (reviews.length === 0) {
      return { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    }
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r: any) => {
      const rRating = Math.round(r.rating || 0);
      if (rRating >= 1 && rRating <= 5) {
        counts[rRating]++;
      }
    });
    return counts;
  })();

  const startDate = new Date(event.start_date);
  const endDate = new Date(event.end_date);

  const formattedDateRange =
    startDate.toLocaleDateString("en-US", { day: "numeric", month: "short" }) +
    (startDate.getTime() !== endDate.getTime()
      ? ` - ${endDate.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}`
      : `, ${startDate.getFullYear()}`);

  const daysDifference = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24),
  );
  const durationText =
    daysDifference > 0 ? `${daysDifference + 1} Days` : "1 Day Event";

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push(`/auth/login?redirect=/event/${eventId}`);
      return;
    }
    if (!comment.trim() || userRating === 0) return;

    addReviewMutation.mutate(
      {
        id: eventId,
        comment,
        rating: userRating,
      },
      {
        onSuccess: () => {
          setComment("");
          setUserRating(0);
          refetch();
        },
      },
    );
  };

  return (
    <div
      className="flex-1 min-h-screen pb-20 bg-[#f4f6f8]"
      style={{ scrollBehavior: "smooth" }}
    >
      {/* ─── Lightbox ─── */}
      <AnimatePresence>
        {lightboxOpen !== null && (
          <GalleryLightbox
            images={allImages}
            startIndex={lightboxOpen}
            onClose={() => setLightboxOpen(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Hero Section ─── */}
      <div className="relative h-[480px] overflow-hidden">
        {/* Parallax Image */}
        <motion.div
          className="absolute inset-0"
          style={{ y: heroParallax, scale: 1 + scrollY * 0.0003 }}
        >
          <Image
            src={coverImage}
            alt={event.name_en || event.name || "Event image"}
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f1923]/70 via-transparent to-[#0f1923]/90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0f1923]/50 via-transparent to-transparent" />

        {/* Floating Particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[
            { delay: 0, size: 6, x: "10%", dur: 8 },
            { delay: 2, size: 4, x: "30%", dur: 10 },
            { delay: 4, size: 5, x: "55%", dur: 7 },
            { delay: 1, size: 3, x: "75%", dur: 9 },
            { delay: 3, size: 7, x: "90%", dur: 11 },
          ].map((p, i) => (
            <FloatingParticle key={i} {...p} />
          ))}
        </div>

        {/* Dynamic Pattern border bottom */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5"
          style={{
            background:
              "repeating-linear-gradient(90deg, #ec4899 0px, #ec4899 8px, #db2777 8px, #db2777 16px, #be185d 16px, #be185d 24px)",
          }}
        />

        {/* Top Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-5 z-20"
          style={{ opacity: heroOpacity }}
        >
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2.5 bg-white/10 backdrop-blur-xl text-white pl-3 pr-4 py-2.5 rounded-2xl hover:bg-white/20 transition-all border border-white/10 shadow-lg shadow-black/10 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm">Back</span>
          </button>
          <div className="flex gap-2.5">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                if (!user) {
                  router.push(`/auth/login?redirect=/event/${eventId}`);
                  return;
                }
                toggleFavorite(event.id);
              }}
              className={`w-11 h-11 rounded-2xl backdrop-blur-xl flex items-center justify-center transition-all border shadow-lg shadow-black/10 ${
                isSaved
                  ? "bg-red-500/90 text-white border-red-400/30"
                  : "bg-white/10 text-white border-white/10 hover:bg-white/20"
              }`}
            >
              <Heart
                className={`w-5 h-5 transition-all ${isSaved ? "fill-white scale-110" : ""}`}
              />
            </motion.button>
          </div>
        </motion.div>

        {/* Hero Content */}
        <div className="absolute bottom-0 left-0 right-0 px-4 sm:px-8 pb-6 sm:pb-10 z-10 container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ opacity: heroOpacity }}
          >
            {/* Badges */}
            <div className="flex items-center gap-2.5 mb-4">
              <span className="bg-white/15 backdrop-blur-xl text-white text-xs px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 capitalize">
                <span>{emoji}</span> {primaryCategory}
              </span>
              {event.is_highlight && (
                <motion.span
                  animate={{
                    boxShadow: [
                      "0 0 12px rgba(236,72,153,0.3)",
                      "0 0 24px rgba(236,72,153,0.5)",
                      "0 0 12px rgba(236,72,153,0.3)",
                    ],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="bg-gradient-to-r from-pink-500 to-rose-500 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-xs flex items-center gap-1.5 border border-pink-400/30"
                >
                  <Gem className="w-3 h-3" /> Highlight
                </motion.span>
              )}
            </div>

            {/* Title */}
            <h1
              className="text-white mb-1.5"
              style={{
                fontSize: "clamp(1.5rem, 5vw, 2.5rem)",
                fontWeight: 800,
                lineHeight: 1.15,
                textShadow: "0 2px 20px rgba(0,0,0,0.3)",
              }}
            >
              {event.name_en}
            </h1>
            <h2
              className="text-white/60 mb-4"
              style={{ fontSize: "clamp(0.875rem, 2vw, 1.1rem)", fontWeight: 400 }}
            >
              {event.name}
            </h2>

            {/* Location & Stats Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5 text-white/70">
                <MapPin className="w-4 h-4 text-pink-400" />
                <span className="text-sm">
                  {province?.name_en || "Thailand"}, TH
                </span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-1.5 text-white/70">
                <Calendar className="w-4 h-4 text-pink-400" />
                <span className="text-sm">{formattedDateRange}</span>
              </div>
              <div className="w-px h-4 bg-white/20" />
              <div className="flex items-center gap-1.5">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${s <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-white/20 fill-white/20"}`}
                    />
                  ))}
                </div>
                <span
                  className="text-white text-sm"
                  style={{ fontWeight: 700 }}
                >
                  {rating}
                </span>
                <span className="text-white/40 text-xs">
                  (<AnimatedNumber value={reviewCount} /> reviews)
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Sticky Scroll Header (appears on scroll) ─── */}
      <AnimatePresence>
        {scrollY > 350 && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 px-6 py-3 flex items-center justify-between shadow-sm"
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 text-gray-700" />
              </button>
              <div>
                <p
                  className="text-sm text-gray-900"
                  style={{ fontWeight: 700 }}
                >
                  {event.name_en}
                </p>
                <div className="flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-gray-500">
                    {rating} · {province?.name_en}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  if (!user) {
                    router.push(`/auth/login?redirect=/event/${eventId}`);
                    return;
                  }
                  toggleFavorite(event.id);
                }}
                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${isSaved ? "bg-red-50 text-red-500" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? "fill-red-400" : ""}`} />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Main Content ─── */}
      <div className="px-4 sm:px-6 lg:px-8 pb-16 -mt-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 max-w-[1200px] mx-auto">
          {/* ─── Left Column ─── */}
          <div>
            {/* Quick Stats Bar */}
            <StaggerItem index={0}>
              <div className="bg-white rounded-2xl p-1 shadow-lg shadow-black/5 border border-gray-100/80 mb-6 grid grid-cols-3 gap-1">
                {[
                  {
                    icon: (
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ),
                    label: "User Rating",
                    value: rating.toString(),
                    sub: `${reviewCount} reviews`,
                  },
                  {
                    icon: <Calendar className="w-4 h-4 text-pink-500" />,
                    label: "Duration",
                    value: durationText,
                    sub: "Event length",
                  },
                  {
                    icon: <Globe className="w-4 h-4 text-emerald-500" />,
                    label: "Province",
                    value: province?.name_en || "Prov",
                    sub: "Location",
                  },
                ].map((stat, i) => (
                  <Tilt3DCard key={i} className="cursor-default" intensity={4}>
                    <div className="rounded-xl p-3 hover:bg-gray-50/80 transition-colors text-center group h-full flex flex-col items-center justify-center">
                      <div className="flex justify-center mb-1.5">
                        {stat.icon}
                      </div>
                      <p
                        className="text-gray-900 group-hover:text-pink-600 transition-colors"
                        style={{ fontSize: "1.1rem", fontWeight: 700 }}
                      >
                        {stat.value}
                      </p>
                      <p className="text-xs text-gray-400 hidden sm:block whitespace-nowrap overflow-hidden text-ellipsis w-full">
                        {stat.sub}
                      </p>
                    </div>
                  </Tilt3DCard>
                ))}
              </div>
            </StaggerItem>

            {/* Tabs */}
            <StaggerItem index={1}>
              <div className="flex gap-1 bg-white rounded-2xl p-1.5 mb-6 shadow-sm border border-gray-100 overflow-x-auto scrollbar-hide">
                {(["overview", "reviews", "photos", "tiktok"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 min-w-[100px] py-2.5 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-1.5 relative ${
                      activeTab === tab
                        ? "text-white shadow-md"
                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                    }`}
                    style={
                      activeTab === tab
                        ? {
                            fontWeight: 600,
                            background:
                              "linear-gradient(135deg, #ec4899 0%, #be185d 100%)",
                          }
                        : { fontWeight: 500 }
                    }
                  >
                    {tab === "tiktok" && (
                      <svg
                        viewBox="0 0 24 24"
                        className="w-3.5 h-3.5 fill-current"
                      >
                        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z" />
                      </svg>
                    )}
                    {tab === "overview"
                      ? "Overview"
                      : tab === "reviews"
                        ? `Reviews`
                        : tab === "photos"
                          ? "Photos"
                          : "TikTok"}
                    {tab === "reviews" && (
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-md ${activeTab === tab ? "bg-white/20" : "bg-gray-100 text-gray-400"}`}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {reviewCount.toLocaleString()}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </StaggerItem>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  {/* About Card */}
                  <Tilt3DCard className="mb-5" intensity={2}>
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-8 h-8 rounded-xl bg-pink-50 flex items-center justify-center">
                          <Info className="w-4 h-4 text-pink-600" />
                        </div>
                        <h3
                          className="text-gray-900"
                          style={{ fontWeight: 700 }}
                        >
                          About this Event
                        </h3>
                      </div>
                      {!(event.detail_en || event.detail) ? (
                        <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 flex items-center justify-center text-center mb-4">
                          <div className="flex flex-col items-center">
                            <Info className="w-5 h-5 text-pink-400 mb-1.5" />
                            <span className="text-sm font-medium text-gray-500">
                              No information available for this event yet.
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-600 leading-relaxed text-sm mb-4 whitespace-pre-line">
                            {event.detail_en || event.detail}
                          </p>
                          {event.detail_en &&
                            event.detail_en !== event.detail && (
                              <p className="text-gray-400 leading-relaxed text-sm italic border-l-2 border-pink-200 pl-3 mb-4">
                                {event.detail}
                              </p>
                            )}
                        </>
                      )}
                    </div>
                  </Tilt3DCard>

                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-2 gap-3 mb-5">
                    {[
                      {
                        icon: <Clock className="w-4.5 h-4.5 text-blue-500" />,
                        label: "Timing",
                        value: "All Day",
                        bg: "bg-blue-50",
                        border: "border-blue-100",
                      },
                      {
                        icon: (
                          <Calendar className="w-4.5 h-4.5 text-purple-500" />
                        ),
                        label: "Date Range",
                        value: formattedDateRange,
                        bg: "bg-purple-50",
                        border: "border-purple-100",
                      },
                    ].map((info, i) => (
                      <Tilt3DCard key={i} intensity={3}>
                        <div
                          className={`bg-white rounded-2xl p-4 border ${info.border} shadow-sm hover:shadow-md transition-shadow h-full flex flex-col items-center text-center md:items-start md:text-left`}
                        >
                          <div
                            className={`w-10 h-10 rounded-xl ${info.bg} flex items-center justify-center mb-3`}
                          >
                            {info.icon}
                          </div>
                          <p className="text-xs text-gray-400 mb-0.5">
                            {info.label}
                          </p>
                          <p
                            className="text-sm text-gray-900 capitalize"
                            style={{ fontWeight: 600 }}
                          >
                            {info.value}
                          </p>
                        </div>
                      </Tilt3DCard>
                    ))}
                  </div>

                  {/* Tags */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    <div className="flex items-center gap-2 mb-3.5">
                      <Tag className="w-4 h-4 text-pink-500" />
                      <h3 className="text-gray-900" style={{ fontWeight: 700 }}>
                        Categories & Tags
                      </h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {event.categories.map((tag, i) => (
                        <motion.span
                          key={tag}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.06 }}
                          className="bg-gradient-to-r from-pink-50 to-rose-50 text-pink-700 text-sm px-4 py-1.5 rounded-full border border-pink-100/80 cursor-default"
                          style={{ fontWeight: 500 }}
                        >
                          {tag}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div
                  key="reviews"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  {/* Rating Summary */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-5">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 15,
                          }}
                        >
                          <div
                            className="text-gray-900 leading-none mb-2"
                            style={{ fontSize: "3.5rem", fontWeight: 800 }}
                          >
                            {rating}
                          </div>
                        </motion.div>
                        <div className="flex justify-center mb-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-4 h-4 ${s <= Math.floor(rating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">
                          {reviewCount.toLocaleString()} reviews
                        </p>
                      </div>
                      <div className="flex-1 space-y-2">
                        {[5, 4, 3, 2, 1].map((s) => {
                          const count = ratingDistribution[s] || 0;
                          const pct =
                            reviewCount > 0
                              ? Math.round((count / reviewCount) * 100)
                              : 0;
                          return (
                            <div key={s} className="flex items-center gap-2.5">
                              <div className="flex items-center gap-0.5 w-10">
                                <span
                                  className="text-xs text-gray-500"
                                  style={{ fontWeight: 500 }}
                                >
                                  {s}
                                </span>
                                <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                              </div>
                              <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full rounded-full"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, #ec4899, #be185d)",
                                  }}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${pct}%` }}
                                  transition={{
                                    duration: 1,
                                    delay: (5 - s) * 0.1,
                                  }}
                                />
                              </div>
                              <span className="text-xs text-gray-400 w-10 text-right">
                                {pct}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Write Review Form */}
                  <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm mb-5">
                    <h3
                      className="text-gray-900 mb-4"
                      style={{ fontWeight: 700 }}
                    >
                      Write a Review
                    </h3>
                    <form onSubmit={handleSubmitReview}>
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm text-gray-500">
                          Your Rating
                        </span>
                        <div
                          className="flex gap-1"
                          onMouseLeave={() => setHoverRating(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onMouseEnter={() => setHoverRating(star)}
                              onClick={() => setUserRating(star)}
                              className="p-1 transition-transform hover:scale-110"
                            >
                              <Star
                                className={`w-5 h-5 transition-colors ${
                                  star <= (hoverRating || userRating)
                                    ? "text-amber-400 fill-amber-400"
                                    : "text-gray-200 fill-gray-200"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative mb-4">
                        <textarea
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="Share your experience..."
                          className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all min-h-[100px] resize-none"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={
                            !comment.trim() ||
                            userRating === 0 ||
                            addReviewMutation.isPending
                          }
                          className="flex items-center gap-2 bg-pink-500 hover:bg-pink-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-pink-200"
                        >
                          {addReviewMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Send className="w-4 h-4" />
                          )}
                          {addReviewMutation.isPending
                            ? "Posting..."
                            : "Post Review"}
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3 mb-5">
                    {event.event_reviews && event.event_reviews.length > 0 ? (
                      event.event_reviews
                        .slice()
                        .reverse()
                        .map((review: any, idx: number) => {
                          const uName =
                            review.user?.firstName ||
                            review.user?.email?.split("@")[0] ||
                            "Anonymous";
                          const avatarL = uName.charAt(0).toUpperCase();
                          const rawDate = new Date(review.date || Date.now());
                          const fmtDate = rawDate.toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          });

                          return (
                            <motion.div
                              key={review.id || idx}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.1 }}
                            >
                              <Tilt3DCard intensity={2}>
                                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-400 to-rose-600 flex items-center justify-center text-white shadow-md font-bold text-sm">
                                        {avatarL}
                                      </div>
                                      <div>
                                        <p className="text-sm text-gray-900 font-semibold">
                                          {uName}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                          {fmtDate}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-1 bg-amber-50 rounded-lg px-2 py-1">
                                      {[1, 2, 3, 4, 5].map((s) => (
                                        <Star
                                          key={s}
                                          className={`w-3 h-3 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"}`}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <p className="text-sm text-gray-600 leading-relaxed mb-3">
                                    {review.comment}
                                  </p>
                                </div>
                              </Tilt3DCard>
                            </motion.div>
                          );
                        })
                    ) : (
                      <div className="text-center py-10">
                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">
                          No reviews yet
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Be the first to share your experience!
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "photos" && (
                <motion.div
                  key="photos"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Camera className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        {allImages.length} photos
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allImages.map((img, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.4, delay: i * 0.05 }}
                        onClick={() => setLightboxOpen(i)}
                        className={`relative rounded-2xl overflow-hidden cursor-pointer group ${
                          i === 0
                            ? "col-span-2 row-span-2 md:h-[280px]"
                            : "h-[136px]"
                        }`}
                        style={{ height: i !== 0 ? "136px" : undefined }}
                      >
                        <Image
                          src={img}
                          alt={`Gallery ${i}`}
                          fill
                          className="object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <motion.div
                            whileHover={{ scale: 1.1 }}
                            className="w-12 h-12 rounded-2xl bg-white/25 backdrop-blur-sm flex items-center justify-center border border-white/20"
                          >
                            <Maximize2 className="w-5 h-5 text-white" />
                          </motion.div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "tiktok" && (
                <motion.div
                  key="tiktok"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.35 }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-500">
                        TikTok Videos
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        window.open(
                          `https://www.tiktok.com/search?q=${encodeURIComponent(event.name_en)}`,
                          "_blank",
                        )
                      }
                      className="flex items-center gap-1.5 text-sm text-pink-600 hover:text-pink-700 font-medium transition-colors"
                    >
                      Open in TikTok
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  </div>
                  {isLoadingTiktok ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {[...Array(2)].map((_, i) => (
                        <div
                          key={i}
                          className="h-[400px] bg-white rounded-2xl p-4 shadow-sm animate-pulse border border-gray-100 flex items-center justify-center text-gray-400"
                        >
                          <Loader2 className="w-8 h-8 animate-spin" />
                        </div>
                      ))}
                    </div>
                  ) : tiktokVideos.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                      {tiktokVideos.map((url) => {
                        const videoIdMatch = url.match(/\/video\/(\d+)/);
                        const videoId = videoIdMatch ? videoIdMatch[1] : "";
                        return videoId ? (
                          <div
                            key={url}
                            className="flex justify-center bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 h-[600px]"
                          >
                            <iframe
                              src={`https://www.tiktok.com/embed/v2/${videoId}?lang=en-US`}
                              width="325"
                              height="600"
                              frameBorder="0"
                              allow="encrypted-media;"
                              title="TikTok video"
                              className="w-full h-full"
                            ></iframe>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
                      <Play className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium text-lg">
                        No TikTok videos found
                      </p>
                      <p className="text-gray-400 text-sm mt-1">
                        There are no videos tagged with this event yet.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ─── Right Column ─── */}
          <div className="space-y-5">
            {/* Map Card */}
            <StaggerItem index={2}>
              <Tilt3DCard intensity={2}>
                <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg transition-shadow">
                  <div className="relative h-[250px] overflow-hidden z-0">
                    <Map
                      pos={[event.latitude, event.longitude]}
                      className="h-full w-full"
                      popupContent={event.name_en}
                    />
                    {/* Glassmorphism overlay */}
                    <div className="absolute top-3 left-3 bg-white/80 backdrop-blur-xl rounded-xl px-3 py-2 flex items-center gap-2 border border-white/50 shadow-lg z-[400] pointer-events-none">
                      <Navigation2 className="w-4 h-4 text-pink-500" />
                      <span
                        className="text-xs text-gray-900"
                        style={{ fontWeight: 600 }}
                      >
                        Location
                      </span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">Latitude</p>
                        <p
                          className="text-sm text-gray-700"
                          style={{ fontWeight: 600 }}
                        >
                          {event.latitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-xl px-3 py-2.5">
                        <p className="text-xs text-gray-400 mb-0.5">
                          Longitude
                        </p>
                        <p
                          className="text-sm text-gray-700"
                          style={{ fontWeight: 600 }}
                        >
                          {event.longitude.toFixed(4)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Tilt3DCard>
            </StaggerItem>

            {/* Action Buttons */}
            <StaggerItem index={3}>
              <div className="space-y-2.5 sticky top-24">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    if (!user) {
                      router.push(`/auth/login?redirect=/event/${eventId}`);
                      return;
                    }
                    toggleFavorite(event.id);
                  }}
                  className={`w-full py-3.5 rounded-2xl text-sm transition-all duration-300 flex items-center justify-center gap-2.5 ${
                    isSaved
                      ? "bg-red-50 text-red-500 border-2 border-red-200 hover:bg-red-100 shadow-md shadow-red-100"
                      : "bg-gradient-to-r from-pink-500 to-rose-500 text-white hover:from-pink-600 hover:to-rose-600 shadow-lg shadow-pink-200/50"
                  }`}
                  style={{ fontWeight: 600 }}
                >
                  <Heart
                    className={`w-4 h-4 ${isSaved ? "fill-red-400 text-red-500" : ""}`}
                  />
                  {isSaved ? "Saved to Favorites" : "Save to Favorites"}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => router.push("/ai-planner")}
                  className="w-full py-3.5 rounded-2xl text-sm bg-[#0f1923] text-white hover:bg-[#162636] transition-all shadow-lg shadow-gray-300/30 flex items-center justify-center gap-2.5"
                  style={{ fontWeight: 600 }}
                >
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  Plan Trip with AI
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() =>
                    window.open(
                      `https://www.tiktok.com/search?q=${encodeURIComponent(event.name_en)}`,
                      "_blank",
                    )
                  }
                  className="w-full py-3.5 rounded-2xl text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-sm flex items-center justify-center gap-2.5"
                  style={{ fontWeight: 600 }}
                >
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                  Open in TikTok
                </motion.button>
              </div>
            </StaggerItem>
          </div>
        </div>
      </div>
    </div>
  );
}
