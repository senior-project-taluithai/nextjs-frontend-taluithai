"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useCategories } from "@/hooks/api/useCategories";
import { cn } from "@/lib/utils";

interface TripFiltersProps {
    filters: any;
    setFilters: (filters: any) => void;
    tripProvinces: any[];
    className?: string;
    activeTab?: 'place' | 'event';
}

const SEASONS = ["summer", "winter", "rainy", "all_year"];

export function TripFilters({ filters, setFilters, tripProvinces, className, activeTab = 'place' }: TripFiltersProps) {
    const { data: categories = [] } = useCategories();
    const [provinceSearch, setProvinceSearch] = useState("");

    const handleCategoryChange = (catId: string, checked: boolean | string) => {
        setFilters((prev: any) => ({
            ...prev,
            category: checked ? catId : undefined,
            page: 1
        }));
    };

    const handleCheckboxChange = (category: string, value: any, checked: boolean | string) => {
        setFilters((prev: any) => {
            const current = prev[category] || [];
            const updated = checked
                ? [...current, value]
                : current.filter((item: any) => item !== value);

            return { ...prev, [category]: updated, page: 1 };
        });
    };

    const updateRating = (val: number) => {
        setFilters((prev: any) => ({ ...prev, minRating: val, page: 1 }));
    }

    const resetFilters = () => {
        setFilters({
            search: filters.search, // Keep search text? Or reset it too? Usually keep specific filters reset only.
            page: 1
        });
    }

    const filteredProvinces = tripProvinces.filter(p =>
        p.name_en.toLowerCase().includes(provinceSearch.toLowerCase()) ||
        p.name.includes(provinceSearch)
    );

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={`space-y-6 ${className}`} />;
    }

    return (
        <div className={cn("space-y-6", className)}>
            <div className="flex items-center justify-between">
                <h3 className="font-bold text-lg">Filters</h3>
                {Object.keys(filters).length > 2 && ( // Showing reset if more than default page/search
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground h-8 text-xs hover:text-red-500"
                        onClick={resetFilters}
                    >
                        Reset
                    </Button>
                )}
            </div>

            <Accordion type="multiple" defaultValue={["province", "category"]} className="w-full">
                {/* Province (scoped to Trip Provinces) */}
                <AccordionItem value="province">
                    <AccordionTrigger className="text-sm font-semibold">Province ({tripProvinces.length})</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-3">
                            {tripProvinces.length > 5 && (
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search province..."
                                        className="h-8 pl-8 text-xs"
                                        value={provinceSearch}
                                        onChange={(e) => setProvinceSearch(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                {filteredProvinces.map((province) => (
                                    <div key={province.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`prov-${province.id}`}
                                            checked={(filters.provinceIds || []).includes(province.id)}
                                            onCheckedChange={(c) => handleCheckboxChange("provinceIds", province.id, c)}
                                        />
                                        <Label htmlFor={`prov-${province.id}`} className="text-sm font-normal cursor-pointer line-clamp-1">{province.name_en}</Label>
                                    </div>
                                ))}
                                {filteredProvinces.length === 0 && (
                                    <p className="text-xs text-muted-foreground text-center py-2">No provinces found</p>
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Categories */}
                <AccordionItem value="category">
                    <AccordionTrigger className="text-sm font-semibold">Category</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                            {categories.map((cat: any) => (
                                <div key={cat.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`cat-${cat.id}`}
                                        checked={filters.category === cat.id.toString()}
                                        onCheckedChange={(c) => handleCategoryChange(cat.id.toString(), c)}
                                    />
                                    <Label htmlFor={`cat-${cat.id}`} className="text-sm font-normal cursor-pointer">
                                        {cat.nameEn} <span className="text-xs text-muted-foreground ml-1">({cat.name})</span>
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Season (Places only) */}
                {activeTab === 'place' && (
                    <AccordionItem value="season">
                        <AccordionTrigger className="text-sm font-semibold">Best Season</AccordionTrigger>
                        <AccordionContent>
                            <div className="space-y-2">
                                {SEASONS.map((season) => (
                                    <div key={season} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`season-${season}`}
                                            checked={(filters.bestSeason || []).includes(season)}
                                            onCheckedChange={(c) => handleCheckboxChange("bestSeason", season, c)}
                                        />
                                        <Label htmlFor={`season-${season}`} className="text-sm font-normal capitalize cursor-pointer">
                                            {season === 'all_year' ? 'All Year' : season}
                                        </Label>
                                    </div>
                                ))}
                            </div>
                        </AccordionContent>
                    </AccordionItem>
                )}

                {/* Rating */}
                <AccordionItem value="rating">
                    <AccordionTrigger className="text-sm font-semibold">Min Rating</AccordionTrigger>
                    <AccordionContent className="px-2">
                        <Slider
                            max={5}
                            step={0.5}
                            defaultValue={[0]}
                            value={[filters.minRating || 0]}
                            onValueChange={(vals) => updateRating(vals[0])}
                            className="my-4"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Any</span>
                            <span>{filters.minRating || 0}+ Stars</span>
                        </div>
                    </AccordionContent>
                </AccordionItem>

            </Accordion>
        </div>
    );
}
