"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import { useState } from "react";
import { BackgroundMap } from "@/components/ai-planner/background-map";
import { TripResultPanel } from "@/components/ai-planner/trip-result-panel";
import { useCopilotReadable, useCopilotAction } from "@copilotkit/react-core";
import "@copilotkit/react-ui/styles.css";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCreateTrip, useAddTripDayItem, tripExtendedService } from "@/hooks/api/useTrips";
import { useProvinces } from "@/hooks/api/useProvinces";
import { addDays, format } from "date-fns";

interface PlannedDay {
    day: number;
    items: {
        id?: string; // Real ID if found
        name: string;
        type: string;
        latitude?: number;
        longitude?: number;
        startTime?: string;
        endTime?: string;
        raw_id?: number; // Backend ID
        thumbnail_url?: string;
    }[];
}

interface PlannedTrip {
    name: string;
    description?: string;
    province?: string;
    startDate?: string;
    endDate?: string;
    days: PlannedDay[];
}

export default function AIPlannerPage() {
    return (
        <CopilotKit runtimeUrl="/api/copilotkit">
            <AIPlannerContent />
        </CopilotKit>
    );
}

function AIPlannerContent() {
    const router = useRouter();
    const createTripMutation = useCreateTrip();
    const addTripItemMutation = useAddTripDayItem();
    const { data: provinces } = useProvinces();

    const [trip, setTrip] = useState<PlannedTrip>({
        name: "",
        province: "",
        days: []
    });
    const [isConfirming, setIsConfirming] = useState(false);

    // Provide state to Copilot
    useCopilotReadable({
        description: "The current trip itinerary being planned.",
        value: trip,
    });

    // Provide available provinces context
    useCopilotReadable({
        description: "List of available provinces in Thailand with their names (en/th) and IDs.",
        value: provinces?.map(p => ({
            id: p.id,
            name: p.name,
            name_en: p.name_en
        })) || []
    });

    // Action: Generate/Update Trip
    useCopilotAction({
        name: "suggestTrip",
        description: "Suggests or updates a trip itinerary. Try to match place names to real locations in Thailand.",
        parameters: [
            { name: "tripName", type: "string", description: "Name of the trip", required: true },
            { name: "province", type: "string", description: "The province name (English preferred) for the trip", required: true },
            { name: "numberOfDays", type: "number", description: "Number of days for the trip", required: true },
            {
                name: "days",
                type: "object[]",
                description: "Array of days with planned items.",
                attributes: [
                    { name: "day", type: "number", description: "Day number (1, 2, ...)" },
                    {
                        name: "items",
                        type: "object[]",
                        description: "List of places/events.",
                        attributes: [
                            { name: "name", type: "string" },
                            { name: "type", type: "string", description: "'place' or 'event'" },
                            { name: "startTime", type: "string", description: "e.g. 09:00" },
                            { name: "endTime", type: "string", description: "e.g. 10:00" }
                        ]
                    }
                ]
            }
        ],
        handler: async ({ tripName, province, days }: { tripName: string; province: string; numberOfDays: number; days: PlannedDay[] }) => {
            toast.message("Verifying places with database...", { duration: 2000 });

            // Process days and try to find real places
            let foundCount = 0;
            const missingItems: string[] = [];
            const seenPlaceIds = new Set<number>(); // Track unique places

            const processedDays = await Promise.all(days.map(async (day) => {
                const processedItems = (await Promise.all(day.items.map(async (item) => {
                    // Try to find the place in the backend
                    try {
                        let searchResult;
                        if (item.type === 'place' || !item.type) { // Default to place
                            // Use the province name to narrow down if possible, or just search
                            searchResult = await tripExtendedService.searchPlaces(item.name);
                        }

                        if (searchResult && searchResult.data && searchResult.data.length > 0) {
                            // Find the first place that hasn't been used yet
                            const foundPlace = searchResult.data.find(p => !seenPlaceIds.has(p.id));

                            if (foundPlace) {
                                seenPlaceIds.add(foundPlace.id);
                                foundCount++;
                                return {
                                    ...item,
                                    name: foundPlace.name, // Use the DB name
                                    raw_id: foundPlace.id,
                                    latitude: foundPlace.latitude,
                                    longitude: foundPlace.longitude,
                                    thumbnail_url: foundPlace.thumbnail_url,
                                    id: Math.random().toString(36).substr(2, 9), // FE ID
                                    type: 'place'
                                };
                            } else {
                                // Unique place not found (or all matches used)
                                // If the top match was already used, it's a duplicate request from AI
                                const topMatch = searchResult.data[0];
                                if (topMatch && seenPlaceIds.has(topMatch.id)) {
                                    console.log("Skipping duplicate place:", topMatch.name);
                                    return null;
                                }
                                missingItems.push(item.name);
                                return null;
                            }
                        } else {
                            missingItems.push(item.name);
                            return null; // Return null if not found
                        }
                    } catch (e) {
                        console.error("Search failed for", item.name, e);
                        missingItems.push(item.name);
                        return null;
                    }
                }))).filter(item => item !== null); // Filter out nulls

                return { ...day, items: processedItems };
            }));

            if (foundCount > 0) {
                toast.success(`Found ${foundCount} valid places!`);
            }

            if (missingItems.length > 0) {
                toast.warning(`Could not find: ${missingItems.slice(0, 3).join(", ")}...`);
            }

            setTrip({
                name: tripName,
                province: province,
                days: processedDays as PlannedDay[]
            });

            if (missingItems.length > 0) {
                return `Trip updated. However, the following places were NOT found in the database and were removed: ${missingItems.join(", ")}. Please allow the user to suggest alternatives or try different search terms.`;
            }

            return "Trip itinerary updated successfully with verified locations from the database.";
        },
    });

    const handleConfirmTrip = async () => {
        if (!trip.name || trip.days.length === 0) return;

        setIsConfirming(true);
        try {
            // 1. Resolve Province ID
            let provinceId = 1; // Default Bangkok
            if (trip.province && provinces) {
                const foundProvince = provinces.find(p =>
                    p.name_en.toLowerCase() === trip.province?.toLowerCase() ||
                    p.name === trip.province
                );
                if (foundProvince) {
                    provinceId = foundProvince.id;
                }
            }

            // 2. Create the Trip
            const startDate = new Date();
            startDate.setDate(startDate.getDate() + 1); // Start tomorrow
            const endDate = addDays(startDate, trip.days.length);

            const newTrip = await createTripMutation.mutateAsync({
                name: trip.name,
                start_date: format(startDate, 'yyyy-MM-dd'),
                end_date: format(endDate, 'yyyy-MM-dd'),
                province_ids: [provinceId],
                status: 'draft'
            });

            const tripId = newTrip.id;

            // 3. Add Items to Trip Days
            for (const day of trip.days) {
                for (const item of day.items) {
                    try {
                        // If we found a real ID, use it.
                        // If not, we still need to add it -> Use fallback ID 1
                        const itemIdToUse = item.raw_id ? item.raw_id : 1;

                        await addTripItemMutation.mutateAsync({
                            tripId: tripId,
                            dayNumber: day.day,
                            item: {
                                item_type: 'place',
                                item_id: itemIdToUse,
                                start_time: item.startTime || "09:00",
                                end_time: item.endTime || "10:00",
                                note: item.name // Save the "AI Name" as a note!
                            }
                        });
                    } catch (e) {
                        console.error("Failed to add item", e);
                    }
                }
            }

            toast.success(`Trip "${trip.name}" created with items!`);
            router.push(`/my-trip/${tripId}`);
        } catch (error) {
            console.error(error);
            toast.error("Failed to create trip.");
        } finally {
            setIsConfirming(false);
        }
    };

    // Flatten items for map
    const mapItems = trip.days.flatMap(d => d.items.map(i => ({
        ...i,
        id: i.id || Math.random().toString(36).substr(2, 9)
    })));

    return (
        <div className="relative w-screen h-screen overflow-hidden flex">
            {/* Background Map */}
            <BackgroundMap items={mapItems} />

            {/* Left Panel: Result */}
            <div className="relative z-10 h-full">
                <TripResultPanel
                    tripName={trip.name}
                    days={trip.days}
                    onConfirm={handleConfirmTrip}
                    isConfirming={isConfirming}
                />
            </div>

            {/* Right Panel: Chat */}
            <CopilotSidebar
                defaultOpen={true}
                instructions="You are a helpful travel assistant for Thailand. You MUST ONLY suggest places that genuinely exist. The system will verify your suggestions against a database. If a place is not found, it will be removed. Prefer well-known tourist attractions. DO NOT suggest the same place twice in the same trip."
                labels={{
                    title: "Travel Assistant",
                    initial: "Hi! Where are you planning to go?"
                }}
            />
        </div>
    );
}
