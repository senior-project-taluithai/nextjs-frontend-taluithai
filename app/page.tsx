"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Star, ArrowRight } from "lucide-react";
import dynamic from "next/dynamic";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useRecommendedPlaces, usePopularPlaces, useBestForSeasonPlaces } from "@/hooks/api/usePlaces";
import { useUpcomingEvents } from "@/hooks/api/useEvents";
import { placeService } from "@/lib/services/place";
import { eventService } from "@/lib/services/event";
import { Place } from "@/lib/dtos/place.dto";
import { Event } from "@/lib/dtos/event.dto";
import { Province } from "@/lib/dtos/province.dto";

const RegionalTabs = dynamic(() => import("@/components/regional-tabs").then(mod => mod.RegionalTabs), {
  ssr: false,
  loading: () => <div className="h-40 w-full flex items-center justify-center text-muted-foreground">Loading regions...</div>
});
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRef } from "react";

export default function Home() {
  const { data: provinces = [] } = useProvinces();
  const { data: recommendedPlaces = [], isLoading: isLoadingRecommended } = useRecommendedPlaces();
  const { data: popularPlaces = [], isLoading: isLoadingPopular } = usePopularPlaces();
  const { data: bestForSeasonPlaces = [], isLoading: isLoadingSeason } = useBestForSeasonPlaces();
  const { data: upcomingEvents = [], isLoading: isLoadingEvents } = useUpcomingEvents();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const autoplayPlugin = useRef(
    Autoplay({ delay: 3000, stopOnInteraction: true }) as any
  );

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[600px] w-full flex items-center justify-center overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?auto=format&fit=crop&q=80&w=2000"
          alt="Thailand Travel"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="relative z-10 text-center text-white space-y-6 max-w-4xl px-4">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-4 duration-1000">
            Discover Amazing Thailand
          </h1>
          <p className="text-xl md:text-2xl font-light text-gray-200">
            Explore beautiful destinations, vibrant festivals, and unforgettable experiences.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-lg transition-transform hover:scale-105">
              Start Exploring
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-16 space-y-20">

        {/* Recommended Places for You */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recommended Places for You</h2>
              <p className="text-muted-foreground">Destinations carefully selected based on your preferences</p>
            </div>
            <Button variant="ghost" className="hidden md:flex gap-2">See More <ArrowRight className="w-4 h-4" /></Button>
          </div>

          {isLoadingRecommended ? (
            <div className="h-64 flex items-center justify-center">Loading recommendations...</div>
          ) : (
            <Carousel
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {recommendedPlaces.map((place) => (
                  <CarouselItem key={place.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <PlaceCard place={place} provinces={provinces} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12" />
              <CarouselNext className="hidden md:flex -right-12" />
            </Carousel>
          )}
        </section>

        {/* Recommended Festivals/Events for You -> Using Upcoming for now as per plan */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Recommended Festivals & Events</h2>
              <p className="text-muted-foreground">Don't miss these events matching your interests</p>
            </div>
          </div>
          {isLoadingEvents ? (
            <div className="h-64 flex items-center justify-center">Loading events...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {upcomingEvents.slice(0, 2).map((event) => (
                <EventCard key={event.id} event={event} provinces={provinces} />
              ))}
            </div>
          )}
        </section>

        {/* Popular Destinations Carousel */}
        <section>
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">Popular Destinations</h2>
              <p className="text-muted-foreground">Top-rated places you shouldn't miss</p>
            </div>
            <Button variant="ghost" className="hidden md:flex gap-2">View All <ArrowRight className="w-4 h-4" /></Button>
          </div>

          {isLoadingPopular ? (
            <div className="h-64 flex items-center justify-center">Loading popular places...</div>
          ) : (
            <Carousel
              plugins={[autoplayPlugin.current]}
              className="w-full"
              opts={{
                align: "start",
                loop: true,
              }}
            >
              <CarouselContent className="-ml-2 md:-ml-4">
                {popularPlaces.map((place) => (
                  <CarouselItem key={place.id} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                    <PlaceCard place={place} provinces={provinces} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex -left-12" />
              <CarouselNext className="hidden md:flex -right-12" />
            </Carousel>
          )}
        </section>

        {/* Seasonal Recommendations */}
        <section className="bg-slate-50 dark:bg-slate-900 -mx-4 px-4 py-16 rounded-3xl">
          <div className="container mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Badge variant="outline" className="px-3 py-1 text-sm bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800">
                Recommended now
              </Badge>
              <h2 className="text-3xl font-bold">Best for this Season</h2>
            </div>

            {isLoadingSeason ? (
              <div className="h-64 flex items-center justify-center">Loading seasonal places...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {bestForSeasonPlaces.slice(0, 4).map((place) => (
                  <PlaceCard key={place.id} place={place} provinces={provinces} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Highlight Events -> Using Upcoming (Highlight logic check?) */}
        <section>
          <h2 className="text-3xl font-bold mb-8">Upcoming Festivals & Events</h2>
          {isLoadingEvents ? (
            <div className="h-64 flex items-center justify-center">Loading upcoming events...</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {upcomingEvents.filter(e => e.is_highlight).slice(0, 2).map((event) => (
                <EventCard key={event.id} event={event} provinces={provinces} />
              ))}
            </div>
          )}
        </section>

        {/* Explore by Region */}
        <section>
          <h2 className="text-3xl font-bold mb-8 text-center">Explore by Region</h2>
          <RegionalTabs provinces={provinces} />
        </section>
      </div>
    </main>
  );
}

function PlaceCard({ place, provinces }: { place: Place; provinces: Province[] }) {
  return (
    <Link href={`/place/${place.id}`} className="block h-full">
      <Card className="h-full border-0 shadow-md hover:shadow-xl transition-all duration-300 group overflow-hidden">
        <div className="relative aspect-[4/3] overflow-hidden">
          <Image
            src={place.thumbnail_url}
            alt={place.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute top-3 right-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-1 text-sm font-semibold shadow-sm">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            {place.rating}
          </div>
        </div>
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <Badge variant="secondary" className="mb-2 text-xs font-normal">
              {place.categories[0] || 'Place'}
            </Badge>
          </div>
          <h3 className="font-bold text-lg line-clamp-1 mb-1 group-hover:text-primary transition-colors">{place.name}</h3>
          <p className="text-muted-foreground text-sm flex items-center gap-1 mb-2">
            <MapPin className="w-3 h-3" /> {provinces.find(p => p.id === place.province_id)?.name_en}
          </p>
          <p className="text-sm text-gray-500 line-clamp-2">{place.detail}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

function EventCard({ event, provinces }: { event: Event; provinces: Province[] }) {
  const province = provinces.find(p => p.id === event.province_id);
  const startDate = new Date(event.start_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

  return (
    <Link href={`/event/${event.id}`} className="block h-full">
      <Card className="flex flex-col md:flex-row overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow h-full group">
        <div className="relative w-full md:w-2/5 aspect-video md:aspect-auto">
          <Image
            src={event.thumbnail_url}
            alt={event.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 rounded-md text-center shadow-lg">
            <span className="block text-xs font-bold uppercase tracking-wider">Start</span>
            <span className="block text-lg font-extrabold leading-none">{startDate.split(' ')[1]}</span>
            <span className="block text-xs font-bold uppercase">{startDate.split(' ')[0]}</span>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center">
          <div className="flex gap-2 mb-3">
            {event.categories.map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
          <h3 className="text-2xl font-bold mb-2 group-hover:text-primary transition-colors">{event.name_en}</h3>
          <p className="text-muted-foreground mb-4 line-clamp-2">{event.detail}</p>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-auto">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {province?.name_en}
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {event.categories[0]}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}