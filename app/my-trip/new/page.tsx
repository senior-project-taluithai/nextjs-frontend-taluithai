"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarIcon, ChevronRight, Map, Clock, ArrowRight } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { MultiSelect } from "@/components/ui/multi-select";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useCreateTrip } from "@/hooks/api/useTrips";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CreateTripPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [date, setDate] = useState<DateRange | undefined>();
    const [provinceIds, setProvinceIds] = useState<string[]>([]);
    const [isHoveringSubmit, setIsHoveringSubmit] = useState(false);

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
        label: p.name_en, // Use primarily English names for the refined look
        value: p.id.toString(),
    })) || [];

    const isFormValid = name && date?.from && date?.to && provinceIds.length > 0;

    return (
        <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4 relative overflow-hidden">

            {/* Background Decorations */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

            <div className="w-full max-w-xl z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-xl shadow-emerald-500/10 mb-6">
                        <Map className="w-8 h-8 text-emerald-500" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Plan a New Trip</h1>
                    <p className="text-lg text-gray-500">Let's start with the basics. Where and when are you going?</p>
                </motion.div>

                <motion.form
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="bg-white/80 backdrop-blur-xl p-5 sm:p-8 rounded-3xl border border-white/50 shadow-2xl shadow-emerald-500/5 space-y-6 sm:space-y-8 relative overflow-hidden"
                >
                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-3 text-sm font-medium mb-6">
                        <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                            <span className="bg-emerald-500 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-sm">1</span>
                            Trip Basics
                        </div>
                        <div className="h-px w-8 bg-gray-200"></div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] border border-gray-200 bg-gray-50">2</span>
                            Itinerary Builder
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-gray-700 font-medium ml-1">Trip Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Summer Escape in Phuket"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-14 px-4 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-lg"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium ml-1">Travel Dates</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        id="date"
                                        variant={"outline"}
                                        className={cn(
                                            "w-full h-14 justify-start text-left font-normal rounded-xl border-gray-200 bg-gray-50/50 hover:bg-white hover:border-emerald-300 transition-all px-4 text-base",
                                            !date && "text-gray-400"
                                        )}
                                    >
                                        <CalendarIcon className="mr-3 h-5 w-5 text-emerald-500" />
                                        {date?.from ? (
                                            date.to ? (
                                                <span className="text-gray-900 font-medium">
                                                    {format(date.from, "MMM dd, yyyy")} - {format(date.to, "MMM dd, yyyy")}
                                                </span>
                                            ) : (
                                                <span className="text-gray-900 font-medium">
                                                    {format(date.from, "MMM dd, yyyy")}
                                                </span>
                                            )
                                        ) : (
                                            <span>Select your start and end dates</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 rounded-2xl border-gray-100 shadow-xl" align="center">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={date?.from}
                                        selected={date}
                                        onSelect={setDate}
                                        numberOfMonths={1}
                                        className="p-4"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-gray-700 font-medium ml-1">Destinations (Provinces)</Label>
                            <div className="[&>div]:min-h-[56px] [&>div]:rounded-xl [&>div]:border-gray-200 [&>div]:bg-gray-50/50 hover:[&>div]:border-emerald-300 [&>div]:transition-all">
                                <MultiSelect
                                    options={provinceOptions}
                                    selected={provinceIds}
                                    onChange={setProvinceIds}
                                    placeholder={provincesLoading ? "Loading provinces..." : "Select provinces to visit"}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={!isFormValid || createTrip.isPending}
                            onMouseEnter={() => setIsHoveringSubmit(true)}
                            onMouseLeave={() => setIsHoveringSubmit(false)}
                            className={cn(
                                "w-full h-14 rounded-xl font-semibold text-lg flex items-center justify-center gap-2 transition-all duration-300 relative overflow-hidden group",
                                isFormValid
                                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 hover:shadow-emerald-500/40"
                                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                            )}
                        >
                            {/* Button Shine Effect */}
                            {isFormValid && (
                                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-shimmer" />
                            )}

                            <span className="relative z-10">
                                {createTrip.isPending ? "Setting up itinerary..." : "Continue to Planner"}
                            </span>

                            {!createTrip.isPending && (
                                <motion.div
                                    animate={{ x: isHoveringSubmit && isFormValid ? 5 : 0 }}
                                    className="relative z-10"
                                >
                                    <ArrowRight className="w-5 h-5" />
                                </motion.div>
                            )}
                        </button>
                    </div>
                </motion.form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.back()}
                        className="text-gray-500 hover:text-gray-900 text-sm font-medium transition-colors"
                    >
                        Cancel and return
                    </button>
                </div>
            </div>
        </div>
    );
}
