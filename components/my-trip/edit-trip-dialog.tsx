"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, Loader2, X, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
    trip: any;
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: {
        label: "Draft",
        className: "bg-gray-100 text-gray-700 border-gray-200",
    },
    planning: {
        label: "Planning",
        className: "bg-primary/10 text-primary border-primary/30",
    },
    upcoming: {
        label: "Upcoming",
        className: "bg-sky-100 text-sky-700 border-sky-200",
    },
    ongoing: {
        label: "Ongoing",
        className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
    completed: {
        label: "Completed",
        className: "bg-indigo-100 text-indigo-700 border-indigo-200",
    },
    cancelled: {
        label: "Cancelled",
        className: "bg-red-100 text-red-700 border-red-200",
    },
};

export function EditTripDialog({ open, onOpenChange, trip }: EditTripDialogProps) {
    const { data: provinces, isLoading: provincesLoading } = useProvinces();
    const updateTripMutation = useUpdateTrip();

    const {
        control,
        handleSubmit,
        reset,
        setError,
        watch,
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

    const selectedProvinceIds = watch("province_ids");
const provinceOptions = provinces?.map((p: any) => ({
        label: p.name_en,
        value: p.id.toString(),
    })) || [];

const selectedProvinces = provinceOptions.filter((opt) =>
        selectedProvinceIds?.includes(opt.value)
    );

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
                    toast.error(`Failed to update trip: ${error.message}`);
                },
            }
        );
    }

    const removeProvince = (provinceId: string, onChange: (value: string[]) => void) => {
        onChange(selectedProvinceIds.filter((id) => id !== provinceId));
    };

    const tripStatus = trip?.status || "draft";
    const statusInfo = statusConfig[tripStatus] || statusConfig.draft;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl bg-background border-border shadow-xl">
                <DialogHeader className="pb-4 relative">
                    <div className="flex items-start justify-between pr-10">
                        <div className="space-y-1.5 text-left">
                            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground">Edit Trip Details</DialogTitle>
                            <DialogDescription className="text-base text-muted-foreground">
                                Update your trip information below.
                            </DialogDescription>
                        </div>
                        <Badge 
                            variant="secondary" 
                            className={cn("absolute right-8 top-0 text-sm font-medium px-4 py-1.5 rounded-full bg-gray-100 text-gray-700 border-none shadow-sm", statusInfo.className)}
                        >
                            {statusInfo.label}
                        </Badge>
                    </div>
                </DialogHeader>

                {selectedProvinces.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2 pb-4 border-b border-border/60">
                        {selectedProvinces.map((province) => (
                            <Controller
                                key={province.value}
                                control={control}
                                name="province_ids"
                                render={({ field }) => (
                                    <span
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-full shadow-sm"
                                    >
                                        <MapPin className="w-4 h-4" />
                                        {province.label}
                                        <button
                                            type="button"
                                            onClick={() => {
                                                field.onChange(selectedProvinceIds.filter((id) => id !== province.value));
                                            }}
                                            className="ml-0.5 hover:bg-primary-foreground/20 rounded-full p-0.5 transition-colors focus:outline-none"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </span>
                                )}
                            />
                        ))}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 pt-4">
                    <div className="space-y-2.5">
                        <Label htmlFor="trip-name" className="text-base font-semibold text-foreground">
                            Trip Name
                        </Label>
                        <Controller
                            control={control}
                            name="name"
                            render={({ field }) => (
                                <Input
                                    id="trip-name"
                                    placeholder="Enter trip name..."
                                    className="h-12 rounded-xl text-base px-4 bg-background border-input focus:border-primary focus:ring-primary/30 shadow-sm"
                                    {...field}
                                />
                            )}
                        />
                        {errors.name && (
                            <p className="text-sm text-destructive">{errors.name.message}</p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <Label htmlFor="provinces" className="text-base font-semibold text-foreground">
                            Provinces
                        </Label>
                        <Controller
                            control={control}
                            name="province_ids"
                            render={({ field }) => (
                                <Select
                                    value=""
                                    onValueChange={(value) => {
                                        if (value && !field.value.includes(value)) {
                                            field.onChange([...field.value, value]);
                                        }
                                    }}
                                >
                                    <SelectTrigger 
                                        id="provinces"
                                        className="h-12 w-full rounded-xl text-base px-4 bg-background border-input focus:ring-primary/30 [&:focus]:border-primary shadow-sm"
                                    >
                                        <SelectValue placeholder={
                                            field.value.length > 0 
                                                ? `${field.value.length} province${field.value.length > 1 ? 's' : ''} selected`
                                                : "Select provinces..."
                                        } />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border">
                                        {provincesLoading ? (
                                            <div className="flex items-center justify-center py-4">
                                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                            </div>
                                        ) : (
                                            provinceOptions
                                                .filter((opt) => !field.value.includes(opt.value))
                                                .map((option) => (
                                                    <SelectItem 
                                                        key={option.value} 
                                                        value={option.value}
                                                        className="focus:bg-primary/10 focus:text-primary"
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ))
                                        )}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.province_ids && (
                            <p className="text-sm text-destructive">{errors.province_ids.message}</p>
                        )}
                    </div>

                    <div className="space-y-2.5">
                        <Label className="text-base font-semibold text-foreground">
                            Trip Dates
                        </Label>
                        <Controller
                            control={control}
                            name="dateRange"
                            render={({ field }) => (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className={cn(
                                                "h-12 w-full justify-start rounded-xl text-base px-4 text-left font-normal bg-background border-input hover:bg-accent hover:text-accent-foreground focus:ring-primary/30 [&:focus]:border-primary shadow-sm",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            <CalendarIcon className="mr-3 h-5 w-5 text-primary" />
                                            {field.value?.from ? (
                                                field.value.to ? (
                                                    <span className="text-foreground">
                                                        {format(field.value.from, "MMM d, yyyy")} - {format(field.value.to, "MMM d, yyyy")}
                                                    </span>
                                                ) : (
                                                    <span className="text-foreground">{format(field.value.from, "MMM d, yyyy")}</span>
                                                )
                                            ) : (
                                                <span>Select date range...</span>
                                            )}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                                        <Calendar
                                            mode="range"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            disabled={(date) =>
                                                date < new Date("1900-01-01")
                                            }
                                            initialFocus
                                            className="bg-popover"
                                        />
                                    </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.dateRange && (
                            <p className="text-sm text-destructive">{errors.dateRange.message as string}</p>
                        )}
                    </div>

                    <DialogFooter className="gap-3 pt-6 sm:gap-0 mt-2">
                        <div className="flex w-full justify-end gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={updateTripMutation.isPending}
                                className="h-12 rounded-xl px-6 text-base font-semibold bg-background border-input hover:bg-accent hover:text-accent-foreground shadow-sm"
                            >
                                Cancel
                            </Button>
                            <Button 
                                type="submit" 
                                disabled={updateTripMutation.isPending}
                                className="h-12 rounded-xl px-6 text-base font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                            >
                                {updateTripMutation.isPending && (
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                )}
                                Save Changes
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}