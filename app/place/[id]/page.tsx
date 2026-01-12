"use client";

import { use, useState } from "react";
import Image from "next/image";
import { places, provinces } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Heart, Share2, Info } from "lucide-react";
import { notFound } from "next/navigation";
import { Separator } from "@/components/ui/separator";
import { ReviewsSection } from "@/components/reviews-section";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";

export default function PlaceDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const place = places.find((p) => p.id === Number(id));
    const [isFavorite, setIsFavorite] = useState(false);

    if (!place) {
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
                                    src={place.thumbnail_url}
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
                                <span>{province?.name_en}, Thailand</span>
                            </div>
                            <div className="flex items-center gap-3 font-medium">
                                <Star className="w-5 h-5 text-yellow-500 fill-yellow-500 shrink-0" />
                                <span>{place.rating} ({place.place_reviews.length} reviews)</span>
                            </div>
                        </div>

                        <Separator className="my-8" />

                        <p className="text-lg leading-relaxed text-slate-600 dark:text-slate-300 mb-8">
                            {place.detail}
                        </p>

                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className={`flex-1 gap-2 text-md ${isFavorite ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                onClick={() => setIsFavorite(!isFavorite)}
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
                                {isFavorite ? 'Saved' : 'Add to Favorites'}
                            </Button>
                            <Button size="lg" variant="outline" className="px-6">
                                <Share2 className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            <div className="container mx-auto px-4 py-16 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-12">
                        <section>
                            <h3 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Info className="w-6 h-6 text-primary" />
                                About this place
                            </h3>
                            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
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
                            <ReviewsSection reviews={place.place_reviews as any} />
                        </section>
                    </div>

                    {/* Sidebar Info */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-4">
                            <h4 className="font-bold text-lg">Location Info</h4>
                            <div className="aspect-video bg-slate-200 rounded-lg relative overflow-hidden group cursor-pointer">
                                {/* Placeholder Map */}
                                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-medium bg-slate-200 dark:bg-slate-800">
                                    Map View
                                </div>
                            </div>
                            <div className="text-sm space-y-2">
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Latitude:</span>
                                    <span className="font-mono">{place.latitude.toFixed(4)}</span>
                                </p>
                                <p className="flex justify-between">
                                    <span className="text-muted-foreground">Longitude:</span>
                                    <span className="font-mono">{place.longitude.toFixed(4)}</span>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
