import { useRef, useCallback } from "react";
import L from "leaflet";

function createProvinceClusterIcon(
  placesCount: number,
  eventsCount: number,
  provinceName: string,
): L.DivIcon {
  const total = placesCount + eventsCount;
  const placeColor = "#f59e0b";
  const eventColor = "#6366f1";

  const html = `
    <div style="
      min-width: 60px;
      background: white;
      border-radius: 12px;
      border: 2px solid #e5e7eb;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 8px 10px;
      font-family: system-ui, -apple-system, sans-serif;
      cursor: pointer;
    ">
      <div style="
        font-size: 11px;
        font-weight: 700;
        color: #374151;
        text-align: center;
        margin-bottom: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100px;
      ">${provinceName}</div>
      <div style="display: flex; flex-direction: column; gap: 4px;">
        ${placesCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            <div style="
              width: 10px;
              height: 10px;
              background: ${placeColor};
              border-radius: 50%;
              flex-shrink: 0;
            "></div>
            <span style="font-size: 10px; color: #6b7280;">${placesCount} places</span>
          </div>
        ` : ""}
        ${eventsCount > 0 ? `
          <div style="display: flex; align-items: center; gap: 4px;">
            <div style="
              width: 10px;
              height: 10px;
              background: ${eventColor};
              border-radius: 50%;
              flex-shrink: 0;
            "></div>
            <span style="font-size: 10px; color: #6b7280;">${eventsCount} events</span>
          </div>
        ` : ""}
      </div>
      <div style="
        position: absolute;
        top: -8px;
        right: -8px;
        background: #10b981;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 700;
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      ">${total}</div>
    </div>
  `;

  return L.divIcon({
    html,
    className: "province-cluster-icon",
    iconSize: [70, 60],
    iconAnchor: [35, 55],
    popupAnchor: [0, -55],
  });
}

function createPlaceIcon(): L.DivIcon {
  const html = `
    <div style="
      width: 36px;
      height: 44px;
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "place-marker-icon",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

function createEventIcon(): L.DivIcon {
  const html = `
    <div style="
      width: 36px;
      height: 44px;
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <svg style="transform: rotate(45deg); width: 16px; height: 16px; color: white;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    </div>
  `;
  return L.divIcon({
    html,
    className: "event-marker-icon",
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -44],
  });
}

export function useIconCache() {
  const cache = useRef<Map<string, L.DivIcon>>(new Map());
  const placeIcon = useRef<L.DivIcon | null>(null);
  const eventIcon = useRef<L.DivIcon | null>(null);

  const getProvinceIcon = useCallback(
    (id: number, places: number, events: number, name: string) => {
      const key = `province-${id}-${places}-${events}`;
      if (!cache.current.has(key)) {
        cache.current.set(key, createProvinceClusterIcon(places, events, name));
      }
      return cache.current.get(key)!;
    },
    []
  );

  const getPlaceIcon = useCallback(() => {
    if (!placeIcon.current) {
      placeIcon.current = createPlaceIcon();
    }
    return placeIcon.current;
  }, []);

  const getEventIcon = useCallback(() => {
    if (!eventIcon.current) {
      eventIcon.current = createEventIcon();
    }
    return eventIcon.current;
  }, []);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return {
    getProvinceIcon,
    getPlaceIcon,
    getEventIcon,
    clearCache,
  };
}