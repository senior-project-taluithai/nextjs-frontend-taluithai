
"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useUpdateTrip } from "@/hooks/api/useTrips";
import { toast } from "sonner";
import { MultiSelect } from "@/components/ui/multi-select";

const formSchema = z.object({
    name: z.string().min(1, "Trip name is required"),
    dateRange: z.object({
        from: z.date(),
        to: z.date(),
    }).refine((data) => data.from <= data.to, {
        message: "End date cannot be before start date",
        path: ["to"],
    }),
    province_ids: z.array(z.string()).min(1, "Select at least one province"),
});

interface EditTripDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    trip: any; // Using any for now to match the existing trip structure in page usage
}

export function EditTripDialog({ open, onOpenChange, trip }: EditTripDialogProps) {
    const { data: provinces, isLoading: provincesLoading } = useProvinces();
    const updateTripMutation = useUpdateTrip();

    const {
        control,
        handleSubmit,
        reset,
        setError,
        formState: { errors },
    } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            dateRange: {
                from: new Date(),
                to: new Date(),
            },
            province_ids: [],
        },
    });

    useEffect(() => {
        if (trip && open) {
            reset({
                name: trip.name,
                dateRange: {
                    from: new Date(trip.start_date),
                    to: new Date(trip.end_date),
                },
                province_ids: trip.provinces?.map((p: any) => p.id.toString()) || [],
            });
        }
    }, [trip, open, reset]);

    function onSubmit(values: z.infer<typeof formSchema>) {
        if (!trip) return;

        const startDate = values.dateRange.from;
        const endDate = values.dateRange.to;

        // Calculate duration in days
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

        if (diffDays < 1) {
            setError("dateRange", { message: "Trip must be at least 1 day long" });
            return;
        }

        updateTripMutation.mutate(
            {
                id: trip.id,
                data: {
                    name: values.name,
                    start_date: format(startDate, "yyyy-MM-dd"),
                    end_date: format(endDate, "yyyy-MM-dd"),
                    province_ids: values.province_ids.map((id) => parseInt(id)),
                },
            },
            {
                onSuccess: () => {
                    toast.success("Trip updated successfully");
                    onOpenChange(false);
                },
                onError: (error: any) => {
                    toast.error(`Failed to update trip: ${error.message} `);
                },
            }
        );
    }

    const provinceOptions = provinces?.map((p: any) => ({
        label: p.name_en,
        value: p.id.toString(),
    })) || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Trip Details</DialogTitle>
                    <DialogDescription>
                        Make changes to your trip here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Trip Name</Label>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <Input id="name" placeholder="My Awesome Trip" {...field} />
                            )}
                        />
                        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Provinces</Label>
                        <Controller
                            control={control}
                            name="province_ids"
                            render={({ field }) => (
                                <MultiSelect
                                    options={provinceOptions}
                                    selected={field.value}
                                    onChange={field.onChange}
                                    placeholder="Select provinces"
                                    className="w-full"
                                />
                            )}
                        />
                        {errors.province_ids && <p className="text-sm text-destructive">{errors.province_ids.message}</p>}
                    </div>

                    <div className="space-y-2 flex flex-col">
                        <Label>Dates</Label>
                        <Controller
                            control={control}
                            name="dateRange"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <>
                                                        {format(field.value.from, "LLL dd, y")} -{" "}
                                                        {format(field.value.to, "LLL dd, y")}
                                                    </>
                                                ) : (
                                                    format(field.value.from, "LLL dd, y")
                                                )
                                            ) : (
                                                <span>Pick a date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.dateRange && <p className="text-sm text-destructive">{errors.dateRange.message as string}</p>}
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={updateTripMutation.isPending}>
                            {updateTripMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

