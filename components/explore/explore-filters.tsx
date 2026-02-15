"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { categoryService } from "@/lib/services/category";
import { provinceService } from "@/lib/services/province";
import { X, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useProvinces } from "@/hooks/api/useProvinces";
import { useCategories } from "@/hooks/api/useCategories";
import { cn } from "@/lib/utils";

interface ExploreFiltersProps {
    filters: any;
    setFilters: (filters: any) => void;
    setPage: (page: number) => void;
    className?: string;
    activeTab?: 'place' | 'event';
}

const REGIONS = ["North", "South", "Central", "Northeast", "East", "West"];
const SEASONS = ["summer", "winter", "rainy", "all_year"];

export function ExploreFilters({ filters, setFilters, setPage, className, activeTab = 'place' }: ExploreFiltersProps) {
    const [provinceSearch, setProvinceSearch] = useState("");
    const { data: categories = [] } = useCategories();
    const { data: provinces = [] } = useProvinces();

    const handleCategoryChange = (catId: string, checked: boolean | string) => {
        setFilters((prev: any) => ({
            ...prev,
            categoryId: checked ? Number(catId) : undefined,
        }));
        setPage(1);
    };

    const handleCheckboxChange = (category: string, value: string, checked: boolean | string) => {
        setFilters((prev: any) => {
            const current = prev[category] || [];
            const updated = checked
                ? [...current, value]
                : current.filter((item: string) => item !== value);

            // Reset pagination when filter changes
            return { ...prev, [category]: updated };
        });
        setPage(1);
    };

    const updateRating = (val: number) => {
        setFilters((prev: any) => ({ ...prev, minRating: val }));
        setPage(1);
    }

    const removeTag = (tag: string) => {
        setFilters((prev: any) => ({
            ...prev,
            tags: prev.tags.filter((t: string) => t !== tag),
        }));
        setPage(1);
    }

    const resetFilters = () => {
        setFilters({});
        setPage(1);
    }

    const filteredProvinces = provinces.filter(p =>
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
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground h-8 text-xs hover:text-red-500"
                    onClick={resetFilters}
                >
                    Reset
                </Button>
            </div>

            <Accordion type="multiple" defaultValue={["region", "type"]} className="w-full">
                {/* Regions */}
                <AccordionItem value="region">
                    <AccordionTrigger className="text-sm font-semibold">Region</AccordionTrigger>
                    <AccordionContent>
                        <div className="grid grid-cols-2 gap-2">
                            {REGIONS.map((region) => (
                                <div key={region} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`region-${region}`}
                                        checked={(filters.region || []).includes(region)}
                                        onCheckedChange={(c) => handleCheckboxChange("region", region, c)}
                                    />
                                    <Label htmlFor={`region-${region}`} className="text-sm font-normal cursor-pointer">{region}</Label>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>

                {/* Province */}
                <AccordionItem value="province">
                    <AccordionTrigger className="text-sm font-semibold">Province</AccordionTrigger>
                    <AccordionContent>
                        <div className="space-y-3">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                                <Input
                                    placeholder="Search province..."
                                    className="h-8 pl-8 text-xs"
                                    value={provinceSearch}
                                    onChange={(e) => setProvinceSearch(e.target.value)}
                                />
                            </div>
                            <div className="max-h-40 overflow-y-auto space-y-2 pr-2 scrollbar-thin">
                                {filteredProvinces.map((province) => (
                                    <div key={province.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={`prov-${province.id}`}
                                            checked={(filters.provinceIds || []).includes(province.id)}
                                            onCheckedChange={(c) => {
                                                setFilters((prev: any) => {
                                                    const current = prev.provinceIds || [];
                                                    const updated = c
                                                        ? [...current, province.id]
                                                        : current.filter((id: number) => id !== province.id);
                                                    return { ...prev, provinceIds: updated };
                                                });
                                                setPage(1);
                                            }}
                                        />
                                        <Label htmlFor={`prov-${province.id}`} className="text-sm font-normal cursor-pointer line-clamp-1">{province.name_en}</Label>
                                    </div>
                                ))}
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
                                        checked={filters.categoryId === cat.id}
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

                {/* Season */}
                <AccordionItem value="season">
                    <AccordionTrigger className="text-sm font-semibold">Season</AccordionTrigger>
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

            {/* Active Tags / Chips */}
            {(filters.tags && filters.tags.length > 0) && (
                <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Tags</h4>
                    <div className="flex flex-wrap gap-2">
                        {filters.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1 cursor-pointer">
                                {tag}
                                <X
                                    className="w-3 h-3 hover:text-red-500"
                                    onClick={() => removeTag(tag)}
                                />
                            </Badge>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
