"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

// Fix for default marker icon missing assets
const icon = L.icon({
    iconUrl: "/images/marker-icon.png",
    shadowUrl: "/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

// If we don't have local assets, we can use CDN or just CSS markers. 
// For now, let's try to use valid CDN links for standard Leaflet markers if local ones aren't guaranteed.
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface MapProps {
    pos: [number, number];
    zoom?: number;
    popupContent?: string;
    className?: string;
}

function FlyToLocation({ pos, zoom }: { pos: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(pos, zoom);
    }, [pos, zoom, map]);
    return null;
}

export default function LeafletMap({ pos, zoom = 13, popupContent, className = "h-[400px] w-full rounded-xl z-0" }: MapProps) {
    // Ensure map only renders on client
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className={`${className} bg-muted animate-pulse flex items-center justify-center text-muted-foreground`}>Loading Map...</div>;

    return (
        <MapContainer
            center={pos}
            zoom={zoom}
            scrollWheelZoom={false}
            className={className}
            style={{ zIndex: 0 }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={pos}>
                {popupContent && <Popup>{popupContent}</Popup>}
            </Marker>
            <FlyToLocation pos={pos} zoom={zoom} />
        </MapContainer>
    );
}
