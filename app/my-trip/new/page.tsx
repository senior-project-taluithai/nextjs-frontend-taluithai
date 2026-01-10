"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarIcon, ChevronRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { provinces } from "@/lib/mock-data";

export default function CreateTripPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [date, setDate] = useState<DateRange | undefined>();
    const [provinceId, setProvinceId] = useState<string>("");

    // Simulate API call and redirect
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validation (Basic)
        if (!name || !date?.from || !date?.to || !provinceId) return;

        // Simulate creation delay
        // In real app: POST /api/trips -> gets ID -> redirect
        const newTripId = Math.floor(Math.random() * 1000) + 2000;
        router.push(`/my-trip/${newTripId}`);
    };

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
                            <Label>Primary Destination (Province)</Label>
                            <Select onValueChange={setProvinceId} value={provinceId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a province" />
                                </SelectTrigger>
                                <SelectContent>
                                    {provinces.map((p) => (
                                        <SelectItem key={p.province_id} value={p.province_id.toString()}>
                                            {p.name_en} ({p.name})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={!name || !date?.from || !date?.to || !provinceId}>
                        Start Planning
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
