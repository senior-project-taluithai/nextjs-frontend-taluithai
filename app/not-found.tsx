"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { MapPin, Search, Home, List, Mail, Compass } from "lucide-react";

export default function NotFound() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/explore?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        <div className="text-center space-y-8">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/30 to-primary/5 flex items-center justify-center shadow-inner">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/40 to-primary/10 flex items-center justify-center shadow-md">
                  <MapPin className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-background border-4 border-background shadow-md flex items-center justify-center">
                <Search className="w-6 h-6 text-primary/70" />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-8xl sm:text-9xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-primary to-primary/60 drop-shadow-sm">
                404
              </h1>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
                Lost in Translation?
              </h2>
              <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
                The page you&apos;re looking for doesn&apos;t exist or has been moved to a new destination.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="space-y-4 mt-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search destinations, places, events..."
                className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border border-input bg-background/50 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm"
              />
            </div>
            <Button type="submit" size="lg" className="w-full h-14 rounded-2xl text-base font-semibold shadow-sm" disabled={!searchQuery.trim()}>
              <Compass className="w-5 h-5 mr-2" />
              Explore Destinations
            </Button>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Button variant="outline" size="lg" className="h-12 px-6 rounded-xl text-base font-semibold border-input shadow-sm" asChild>
              <Link href="/">
                <Home className="w-5 h-5 mr-2" />
                Go Back Home
              </Link>
            </Button>
            <Button variant="default" size="lg" className="h-12 px-6 rounded-xl text-base font-semibold shadow-sm" asChild>
              <Link href="/my-trip">
                <List className="w-5 h-5 mr-2" />
                View My Trips
              </Link>
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
              <Mail className="w-4 h-4" />
              Need help?{" "}
              <a 
                href="mailto:support@taluithai.com" 
                className="text-primary hover:underline font-medium"
              >
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}