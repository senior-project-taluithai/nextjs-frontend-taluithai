"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Calendar, MapPin, Star } from "lucide-react";
import { Place } from "@/lib/dtos/place.dto";
import { Event } from "@/lib/dtos/event.dto";
import { useProvinces } from "@/hooks/api/useProvinces";

interface ExploreCardProps {
    item: Place | Event;
    type: "place" | "event";
}

export function ExploreCard({ item, type }: ExploreCardProps) {
    const { data: provinces = [] } = useProvinces();
    const province = provinces.find((p) => p.id === item.province_id);
    const imageUrl = item.thumbnail_url;

    const rating = item.rating;

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-all duration-300 border-none shadow-sm flex flex-col h-full bg-card">
            <div className="relative h-48 w-full overflow-hidden">
                <Image
                    src={imageUrl || "/placeholder.jpg"}
                    alt={item.name || item.name_en || "Explore Item"}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 flex gap-2">
                    <Badge variant="secondary" className="backdrop-blur-md bg-white/80 text-black shadow-sm uppercase text-[10px]">
                        {(item.categories || [])[0] || type}
                    </Badge>
                </div>
                {(item as any).best_season && (
                    <div className="absolute top-3 left-3">
                        <Badge className="bg-primary/90 hover:bg-primary capitalize shadow-sm text-[10px]">
                            {(item as any).best_season}
                        </Badge>
                    </div>
                )}
            </div>

            <CardContent className="p-4 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                            {item.name_en}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                            {item.name}
                        </p>
                    </div>
                    <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 dark:bg-yellow-900/20 dark:border-yellow-900/50 h-fit">
                        <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs font-bold text-yellow-700 dark:text-yellow-500">
                            {rating}
                        </span>
                    </div>
                </div>

                <div className="space-y-2 mt-3">
                    <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 mr-2 text-primary" />
                        {province?.name_en}
                    </div>

                    {type === "event" && (item as Event).start_date && (
                        <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                            {new Date((item as Event).start_date).toLocaleDateString("en-GB", { month: 'short', day: 'numeric' })}
                            {' - '}
                            {new Date((item as Event).end_date).toLocaleDateString("en-GB", { month: 'short', day: 'numeric' })}
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-1.5">
                    {(item.categories || []).slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                            #{tag}
                        </span>
                    ))}
                    {(item.categories || []).length > 3 && (
                        <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-full text-slate-600 dark:text-slate-400 font-medium border border-slate-200 dark:border-slate-700">
                            +{(item.categories || []).length - 3}
                        </span>
                    )}
                </div>
            </CardContent>

            <CardFooter className="p-4 pt-0">
                <Link href={`/${type}/${item.id}`} className="w-full">
                    <div className="w-full h-10 px-4 py-2 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-transparent hover:bg-primary hover:text-white">
                        View Details
                    </div>
                </Link>
            </CardFooter>
        </Card>
    );
}

