"use client";

import { use, useState } from "react";
import Image from "next/image";
import { events, provinces } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Heart, Share2, Clock, Star } from "lucide-react";
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

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const event = events.find((e) => e.id === Number(id));
    const [isFavorite, setIsFavorite] = useState(false);

    if (!event) {
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
                                <span>{province?.name_en}, Thailand</span>
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
                                <span>{event.rating ?? "New"} ({event.event_reviews?.length ?? 0} reviews)</span>
                            </div>
                        </div>

                        <Separator className="my-8" />

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

            <div className="container mx-auto px-4 py-12 max-w-4xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="md:col-span-2 space-y-12">
                        <section className="bg-card p-6 rounded-xl border shadow-sm">
                            <h3 className="text-xl font-bold mb-4">Event Details</h3>
                            <p className="text-lg leading-relaxed text-muted-foreground whitespace-pre-line">
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
                            <ReviewsSection reviews={event.event_reviews || []} />
                        </section>
                    </div>

                    {/* Sidebar Actions & Summary */}
                    <div className="space-y-6">
                        <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border space-y-6 sticky top-24">
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground uppercase tracking-wider font-bold mb-1">Event Status</p>
                                <p className="text-green-600 font-bold flex items-center justify-center gap-2">
                                    <Clock className="w-4 h-4" /> Upcoming
                                </p>
                            </div>

                            <Separator />

                            <div className="space-y-3">
                                <Button
                                    size="lg"
                                    className={`w-full gap-2 text-md ${isFavorite ? 'bg-red-500 hover:bg-red-600' : ''}`}
                                    onClick={() => setIsFavorite(!isFavorite)}
                                >
                                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-white' : ''}`} />
                                    {isFavorite ? 'Saved to Calendar' : 'Add to Favorites'}
                                </Button>
                                <Button size="lg" variant="outline" className="w-full gap-2">
                                    <Share2 className="w-5 h-5" /> Share Event
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
