"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi-select";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useCreateTrip } from "@/hooks/api/useTrips";
import { toast } from "sonner";

export default function CreateTripPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [date, setDate] = useState<DateRange | undefined>();
    const [provinceIds, setProvinceIds] = useState<string[]>([]);

    const { data: provinces, isLoading: provincesLoading } = useProvinces();
    const createTrip = useCreateTrip();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!name || !date?.from || !date?.to || provinceIds.length === 0) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            const newTrip = await createTrip.mutateAsync({
                name,
                start_date: format(date.from, "yyyy-MM-dd"),
                end_date: format(date.to, "yyyy-MM-dd"),
                province_ids: provinceIds.map(id => parseInt(id)),
                status: "draft",
            });

            toast.success(`${name} has been created successfully!`);
            router.push(`/my-trip/${newTrip.id}`);
        } catch (error) {
            console.error("Failed to create trip:", error);
            toast.error("Failed to create trip. Please try again.");
        }
    };

    const provinceOptions = provinces?.map(p => ({
        label: `${p.name_en} (${p.name})`,
        value: p.id.toString(),
    })) || [];

    return (
        <div className="container mx-auto px-4 py-8 max-w-2xl min-h-screen">
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Plan a New Trip</h1>
                    <p className="text-muted-foreground mt-2">Let's start with the basics. Where and when are you going?</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8 bg-card p-6 rounded-xl border shadow-sm">
                    {/* Step Indicator */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <span className="bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        Trip Basics
                        <span className="h-px w-8 bg-border mx-2"></span>
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border border-muted bg-muted text-muted-foreground">2</span>
                        Planner
                    </div>

                    <div className="space-y-4">
                        <div className="grid w-full items-center gap-1.5">
                            <Label htmlFor="name">Trip Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Summer in Phuket"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label>Dates</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {date?.from ? (
                                            date.to ? (
                                                <>
                                                    {format(date.from, "LLL dd, y")} -{" "}
                                                    {format(date.to, "LLL dd, y")}
                                                </>
                                            ) : (
                                                format(date.from, "LLL dd, y")
                                            )
                                        ) : (
                                            <span>Pick your travel dates</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid w-full items-center gap-1.5">
                            <Label>Provinces</Label>
                            <MultiSelect
                                options={provinceOptions}
                                selected={provinceIds}
                                onChange={setProvinceIds}
                                placeholder={provincesLoading ? "Loading provinces..." : "Select provinces for your trip"}
                            />
                            <p className="text-xs text-muted-foreground">
                                Select one or more provinces you plan to visit
                            </p>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={!name || !date?.from || !date?.to || provinceIds.length === 0 || createTrip.isPending}
                    >
                        {createTrip.isPending ? "Creating..." : "Start Planning"}
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
