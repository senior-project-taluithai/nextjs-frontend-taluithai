"use client";

import { useState } from "react";
import { ExploreCard } from "@/components/explore/explore-card";
import { Heart, MapPin, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useFavoritePlaces, useFavoriteEvents } from "@/hooks/api/useFavorites";

export default function SavedPage() {
    // Independent Pagination States
    const [placePage, setPlacePage] = useState(1);
    const [eventPage, setEventPage] = useState(1);

    const { data: favoritePlacesData, isLoading: isLoadingPlaces } = useFavoritePlaces(placePage, 8);
    const { data: favoriteEventsData, isLoading: isLoadingEvents } = useFavoriteEvents(eventPage, 8);

    const savedPlaces = favoritePlacesData?.data ?? [];
    const savedEvents = favoriteEventsData?.data ?? [];
    const totalPlacePages = favoritePlacesData?.lastPage ?? 1;
    const totalEventPages = favoriteEventsData?.lastPage ?? 1;


    // Render a Pagination Control helper
    const renderPagination = (currentPage: number, setPage: (p: number) => void, totalPages: number) => (
        <div className="flex justify-end items-center gap-2 mt-4">
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium mx-2 flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <Button
                        key={p}
                        variant={currentPage === p ? "default" : "ghost"}
                        size="sm"
                        className={`w-8 h-8 p-0 ${currentPage === p ? 'pointer-events-none' : ''}`}
                        onClick={() => setPage(p)}
                    >
                        {p}
                    </Button>
                ))}
            </span>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => setPage(Math.min(true ? totalPages : 1, currentPage + 1))} // Fix logic if needed, totalPages from API is correct
                disabled={currentPage === totalPages}
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen space-y-12">
            <div className="mb-8">
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Heart className="w-8 h-8 text-primary fill-primary" />
                    Saved Places & Events
                </h1>
                <p className="text-muted-foreground mt-2">
                    Your collection of favorite destinations and upcoming events.
                </p>
            </div>

            {/* Places Section */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <MapPin className="text-blue-500" />
                        Saved Places
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({favoritePlacesData?.total ?? 0} items)
                        </span>
                    </h2>
                </div>

                {isLoadingPlaces ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">Loading saved places...</div>
                ) : savedPlaces.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {savedPlaces.map((item) => (
                                <ExploreCard
                                    key={`place-${item.id}`}
                                    item={item}
                                    type="place"
                                />
                            ))}
                        </div>
                        {totalPlacePages > 1 && renderPagination(placePage, setPlacePage, totalPlacePages)}
                    </>
                ) : (
                    <EmptyState type="places" />
                )}
            </section>

            <Separator />

            {/* Events Section */}
            <section className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-2xl font-semibold flex items-center gap-2">
                        <Calendar className="text-orange-500" />
                        Saved Events
                        <span className="text-sm font-normal text-muted-foreground ml-2">
                            ({favoriteEventsData?.total ?? 0} items)
                        </span>
                    </h2>
                </div>

                {isLoadingEvents ? (
                    <div className="h-40 flex items-center justify-center text-muted-foreground">Loading saved events...</div>
                ) : savedEvents.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {savedEvents.map((item) => (
                                <ExploreCard
                                    key={`event-${item.id}`}
                                    item={item}
                                    type="event"
                                />
                            ))}
                        </div>
                        {totalEventPages > 1 && renderPagination(eventPage, setEventPage, totalEventPages)}
                    </>
                ) : (
                    <EmptyState type="events" />
                )}
            </section>

        </div>
    );
}

function EmptyState({ type = "items" }: { type?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-muted/30">
            <div className="bg-muted p-3 rounded-full mb-3">
                <Heart className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-md font-semibold text-muted-foreground">No saved {type} yet</h3>
        </div>
    );
}
