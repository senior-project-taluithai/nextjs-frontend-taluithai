"use client";

import { use } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Share2, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { placeService } from "@/lib/services/place";
import { Separator } from "@/components/ui/separator";
import { ReviewsSection } from "@/components/reviews-section";
import { usePlace } from "@/hooks/api/usePlaces";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useToggleFavoritePlace, useIsFavoritePlace } from "@/hooks/api/useFavorites";
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

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const placeId = Number(id);
    const { data: place, isLoading: isLoadingPlace, isError } = usePlace(placeId);
    const { data: provinces = [] } = useProvinces();
    const { mutate: toggleFavorite } = useToggleFavoritePlace();
    const { data: isSaved = false } = useIsFavoritePlace(placeId);

    if (isLoadingPlace) {
        return <div className="min-h-screen flex items-center justify-center">Loading place...</div>;
    }

    if (isError || !place) {
        notFound();
    }

    const province = provinces.find(p => p.id === place.province_id);

    return (
        <div className="min-h-screen pb-20">
            {/* Split Header Layout */}
            {/* Header Content */}
            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                    {/* Image Gallery Side */}
                    <div className="relative h-[300px] md:h-[450px] w-full bg-slate-100 rounded-2xl overflow-hidden shadow-sm border">
                        {place.image_urls.length > 0 ? (
                            <Carousel className="w-full h-full" opts={{ loop: true }}>
                                <CarouselContent className="h-full">
                                    {place.image_urls.map((url, index) => (
                                        <CarouselItem key={index} className="h-full">
                                            <div className="relative h-full w-full">
                                                <Image
                                                    src={url}
                                                    alt={`${place.name} - ${index + 1}`}
                                                    fill
                                                    className="object-cover"
                                                    priority={index === 0}
                                                />
                                            </div>
                                        </CarouselItem>
                                    ))}
                                </CarouselContent>
                                <CarouselPrevious className="left-4" />
                                <CarouselNext className="right-4" />
                            </Carousel>
                        ) : (
                            <div className="relative h-full w-full">
                                <Image
                                    src={place.thumbnail_url || '/placeholder.svg'}
                                    alt={place.name}
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        )}
                    </div>

                    {/* Content Side */}
                    <div className="flex flex-col justify-center">
                        <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="secondary" className="text-sm font-medium">
                                {place.categories[0] || 'Place'}
                            </Badge>
                            <Badge variant="outline" className="text-sm font-medium">
                                Best: {place.best_season}
                            </Badge>
                        </div>

                        <h1 className="text-3xl md:text-5xl font-bold mb-2">{place.name_en}</h1>
                        <h2 className="text-xl md:text-2xl font-medium text-muted-foreground mb-6">{place.name}</h2>

                        <div className="space-y-4 text-sm md:text-base">
                            <div className="flex items-center gap-3 font-medium">
                                <MapPin className="w-5 h-5 text-primary shrink-0" />
                                <span>{province?.name_en || 'Thailand'}, Thailand</span>
                            </div>
                            <div className="flex items-center gap-3 font-medium">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                                <span>{place.rating} (0 reviews)</span>
                            </div>
                        </div>

                        <Separator className="my-8" />



                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className={`flex-1 gap-2 text-md ${isSaved ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                onClick={() => {
                                    toggleFavorite(place.id);
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

            {/* Details Section */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
                    {/* Left Column: Content */}
                    <div className="lg:col-span-2 space-y-12">
                        <section>
                            <h3 className="text-2xl font-bold mb-6 flex items-center gap-2">
                                <Info className="w-6 h-6 text-primary" />
                                About this place
                            </h3>
                            <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 whitespace-pre-line">
                                {place.detail}
                            </p>
                        </section>

                        <section>
                            <h3 className="text-xl font-bold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {place.categories.map(tag => (
                                    <Badge key={tag} variant="secondary" className="px-3 py-1 text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </section>

                        <section>
                            {/* Reviews mocked as empty for now */}
                            <ReviewsSection reviews={[]} />
                        </section>
                    </div>

                    {/* Right Column: Map */}
                    <div className="space-y-6">
                        <div className="sticky top-24 space-y-4">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                Location
                            </h3>
                            <div className="h-[400px] w-full rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800 relative z-0">
                                <Map pos={[place.latitude, place.longitude]} className="h-full w-full" popupContent={place.name} />
                            </div>
                            <div className="flex justify-between text-sm text-muted-foreground bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
                                <div>
                                    <span className="font-semibold block">Latitude</span>
                                    <span className="font-mono">{place.latitude.toFixed(6)}</span>
                                </div>
                                <div className="text-right">
                                    <span className="font-semibold block">Longitude</span>
                                    <span className="font-mono">{place.longitude.toFixed(6)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
