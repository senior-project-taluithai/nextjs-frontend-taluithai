"use client";

import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Province } from "@/lib/dtos/province.dto";

const regions = ["North", "Central", "South", "Northeast", "East", "West"];

interface RegionalTabsProps {
    provinces: Province[];
}

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function RegionalTabs({ provinces }: RegionalTabsProps) {
    return (
        <Tabs defaultValue="North" className="w-full">
            <TabsList className="w-full justify-center bg-transparent mb-8 flex-wrap h-auto gap-2">
                {regions.map((region) => (
                    <TabsTrigger
                        key={region}
                        value={region}
                        className="px-6 py-3 rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-muted hover:bg-muted/50 transition-all text-base"
                    >
                        {region}
                    </TabsTrigger>
                ))}
            </TabsList>

            {regions.map((region) => {
                const regionProvinces = provinces.filter(p => p.region_name === region);
                return (
                    <TabsContent key={region} value={region} className="mt-0">
                        <PaginatedProvinceGrid provinces={regionProvinces} />
                    </TabsContent>
                )
            })}
        </Tabs>
    );
}

function PaginatedProvinceGrid({ provinces }: { provinces: Province[] }) {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 8;
    const totalPages = Math.ceil(provinces.length / itemsPerPage);

    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleProvinces = provinces.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    if (provinces.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                No provinces found in this region.
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {visibleProvinces.map((province) => (
                    <Link href={`#`} key={province.id} className="group cursor-pointer">
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                            <Image
                                src={province.image_url || "/placeholder.svg"}
                                alt={province.name}
                                fill
                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                                <span className="text-white font-bold text-lg">{province.name_en}</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm font-medium">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            )}
        </div>
    );
}

