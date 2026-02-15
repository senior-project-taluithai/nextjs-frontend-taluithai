"use client";

import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Heart, Share2, Clock, Star, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { eventService } from "@/lib/services/event";
import { Separator } from "@/components/ui/separator";
import { ReviewsSection } from "@/components/reviews-section";
import { useEvent } from "@/hooks/api/useEvents";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useToggleFavoriteEvent, useIsFavoriteEvent } from "@/hooks/api/useFavorites";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("@/components/map/LeafletMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 animate-pulse flex items-center justify-center text-muted-foreground">Loading Map...</div>
});

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const eventId = Number(id);
    const { data: event, isLoading: isLoadingEvent, isError } = useEvent(eventId);
    const { data: provinces = [] } = useProvinces();
    const { mutate: toggleFavorite } = useToggleFavoriteEvent();
    const { data: isSaved = false } = useIsFavoriteEvent(eventId);

    // We can use isSaved directly or sync it. 
    // If we use local state for optimistic UI, we should init it with isSaved but useEffect to update?
    // Or just rely on isSaved from query which will update after mutation success?
    // Let's rely on query state mainly, but strict requirement "interactive" often implies optimistic.
    // Tanstack query handles optimistic updates or invalidation. 
    // My toggle hook invalidates "isSaved" query. So it should auto-update.
    // I will replace local state `isFavorite` with `isSaved` from hook.

    // const [isFavorite, setIsFavorite] = useState(false);  <-- Remove this


    if (isLoadingEvent) {
        return <div className="min-h-screen flex items-center justify-center">Loading event...</div>;
    }

    if (isError || !event) {
        notFound();
    }

    const province = provinces.find(p => p.id === event.province_id);
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    // Ensure image_urls exists
    const images = event.image_urls.length > 0 ? event.image_urls : [event.thumbnail_url];

    return (
        <div className="min-h-screen pb-20">
            {/* Gallery / Hero Section */}
            {/* Header Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery Side */}
                    <div className="relative h-[300px] md:h-[450px] w-full bg-slate-100 rounded-2xl overflow-hidden shadow-sm border">
                        {images.length > 0 ? (
                            <Carousel className="w-full h-full" opts={{ loop: true }}>
                                <CarouselContent className="h-full">
                                    {images.map((url, index) => (
                                        <CarouselItem key={index} className="h-full">
                                            <div className="relative h-full w-full">
                                                <Image
                                                    src={url}
                                                    alt={`${event.name} - ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    priority={index === 0}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                {images.length > 1 && (
                                    <>
                                        <CarouselPrevious className="left-4" />
                                        <CarouselNext className="right-4" />
                                    </>
                                )}
                            </Carousel>
                        ) : (
                            <div className="relative h-full w-full">
                                <Image
                                    src={event.thumbnail_url}
                                    alt={event.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                    </div>

                    {/* Info Side */}
                    <div className="flex flex-col justify-center">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge className="bg-primary text-primary-foreground border-0">
                                {event.categories[0] || 'Event'}
                            </Badge>
                            {event.is_highlight && (
                                <Badge variant="secondary" className="bg-yellow-500 text-white border-0 hover:bg-yellow-600">
                                    Highlight Event
                                </Badge>
                            )}
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{event.name_en}</h1>
                        <h2 className="text-xl md:text-2xl font-medium text-muted-foreground mb-6">{event.name}</h2>

                        <div className="space-y-4 text-sm md:text-base">
                            <div className="flex items-center gap-3 font-medium">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span className="text-muted-foreground">{province?.name_en || 'Thailand'}, Thailand</span>
                            </div>
                            <div className="flex items-center gap-3 font-medium">
                                <Calendar className="w-5 h-5 text-primary shrink-0" />
                                <span>
                                    {startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    {' - '}
                                    {endDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 font-medium">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                                <span>{event.rating ?? "New"} (0 reviews)</span>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className={`flex-1 gap-2 text-md ${isSaved ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                onClick={() => {
                                    toggleFavorite(event.id);
                                }}
                            >
                                <Heart className={`w-5 h-5 ${isSaved ? 'fill-white' : ''}`} />
                                {isSaved ? 'Saved' : 'Add to Favorites'}
                            </Button>
                            <Button size="lg" variant="outline" className="px-6">
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section className="bg-card p-0">
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Info className="w-6 h-6 text-primary" />
                                About this event
                            </h3>
                            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {event.detail}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {event.categories.map(tag => (
                                    <Badge key={tag} variant="outline" className="px-3 py-1">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        <section>
                            {/* Reviews currently mocked as empty or need separate API. Using empty array for now as DTO doesn't strictly have it populated in list */}
                            <ReviewsSection reviews={[]} />
                        </section>
                    </div>

                    {/* Right Column: Sidebar Actions & Map */}
                    <div className="space-y-6">
                        <div className="sticky top-24 space-y-6">
                            {/* Map Section */}
                            <div className="space-y-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    Location
                                </h3>
                                <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative z-0">
                                    <Map pos={[event.latitude, event.longitude]} className="h-full w-full" popupContent={event.name} />
                                </div>
                                <div className="flex justify-between text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                                    <div>
                                        <span className="font-semibold block">Latitude</span>
                                        <span className="font-mono">{event.latitude.toFixed(6)}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold block">Longitude</span>
                                        <span className="font-mono">{event.longitude.toFixed(6)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
