"use client";

import Link from "next/link";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { provinces } from "@/lib/mock-data";

const regions = ["North", "Central", "South", "Northeast", "East", "West"];

export function RegionalTabs() {
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {regionProvinces.map((province) => (
                                <Link href={`#`} key={province.id} className="group cursor-pointer">
                                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3">
                                        <Image
                                            src={province.image_url}
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
                            {regionProvinces.length === 0 && (
                                <div className="col-span-full text-center py-10 text-muted-foreground">
                                    No provinces found in this region for simple mock data.
                                </div>
                            )}
                        </div>
                    </TabsContent>
                )
            })}
        </Tabs>
    );
}
