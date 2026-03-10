/**
 * Server-side tool definitions for the AI Travel Assistant.
 * These tools call the NestJS backend /tools/* endpoints.
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

async function backendGet(path: string, params: Record<string, string | number | undefined>) {
  const url = new URL(path, BACKEND_URL);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== "") {
      url.searchParams.set(k, String(v));
    }
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Backend ${path} failed: ${res.status}`);
  return res.json();
}

async function backendPost(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend ${path} failed: ${res.status}`);
  return res.json();
}

// ─── Tool Handlers ───────────────────────────────────────────────

export async function vectorSearch({ query, limit }: { query: string; limit?: number }) {
  return backendGet("/tools/vector-search", { query, limit: limit ?? 10 });
}

export async function placeSearch({
  query,
  collections,
  limit,
}: {
  query: string;
  collections?: string;
  limit?: number;
}) {
  return backendGet("/tools/place-search", { query, collections, limit: limit ?? 10 });
}

export async function eventSearch({
  query,
  province,
  limit,
}: {
  query?: string;
  province?: string;
  limit?: number;
}) {
  return backendGet("/tools/event-search", { query, province, limit: limit ?? 10 });
}

export async function nearbySearch({
  latitude,
  longitude,
  radius_km,
  collections,
  limit,
}: {
  latitude: number;
  longitude: number;
  radius_km?: number;
  collections?: string;
  limit?: number;
}) {
  return backendGet("/tools/nearby", {
    latitude,
    longitude,
    radius_km: radius_km ?? 5,
    collections,
    limit: limit ?? 10,
  });
}

export async function calculateRoute({
  waypoints,
}: {
  waypoints: { latitude: number; longitude: number }[];
}) {
  return backendPost("/tools/route", { waypoints });
}

// ─── CopilotKit Action Definitions ──────────────────────────────

// Safe wrapper: ensures handlers always return a string and never throw
function safeHandler<T>(fn: (args: T) => Promise<unknown>) {
  return async (args: T): Promise<string> => {
    try {
      const result = await fn(args);
      return JSON.stringify(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error("[Tool Error]", message);
      return JSON.stringify({ error: message });
    }
  };
}

export const backendActions = [
  {
    name: "searchPlacesSemantic",
    description:
      "Semantic search for places in Thailand using natural language. " +
      "Use this to find places matching a description like 'ancient temple with river view' or 'beach resort Krabi'. " +
      "Returns places with title, address, rating, lat/lng, and category from the vector database.",
    parameters: [
      { name: "query", type: "string" as const, description: "Natural language search query (Thai or English)", required: true },
      { name: "limit", type: "number" as const, description: "Max results (default 10)", required: false },
    ],
    handler: safeHandler(async (args: { query: string; limit?: number }) => {
      const results = await vectorSearch(args);
      return {
        results: results.slice(0, args.limit ?? 10).map((r: Record<string, unknown>) => ({
          pg_place_id: r.pg_place_id,
          title: r.title,
          address: r.address,
          category: r.category,
          latitude: r.latitude,
          longitude: r.longitude,
          review_rating: r.review_rating,
          thumbnail: r.thumbnail,
          score: r.score,
          source_collection: r.source_collection,
        })),
      };
    }),
  },

  {
    name: "searchPlacesByKeyword",
    description:
      "Text search for places in both Postgres and MongoDB databases. " +
      "Use for exact name searches like 'วัดพระแก้ว' or category-based searches. " +
      "Returns places from both databases with ID, name, lat/lng, rating.",
    parameters: [
      { name: "query", type: "string" as const, description: "Search keyword", required: true },
      {
        name: "collections",
        type: "string" as const,
        description: "Comma-separated MongoDB collections: hotel,temple,attraction,restaurants,cafe,park,musuem,hospital",
        required: false,
      },
      { name: "limit", type: "number" as const, description: "Max results per source (default 10)", required: false },
    ],
    handler: safeHandler(async (args: { query: string; collections?: string; limit?: number }) => {
      return placeSearch(args);
    }),
  },

  {
    name: "searchEvents",
    description:
      "Search for festivals, events, and cultural activities in Thailand. " +
      "Can filter by province name. Returns event name, dates, province, and description.",
    parameters: [
      { name: "query", type: "string" as const, description: "Event search query", required: false },
      { name: "province", type: "string" as const, description: "Province name to filter", required: false },
      { name: "limit", type: "number" as const, description: "Max results", required: false },
    ],
    handler: safeHandler(async (args: { query?: string; province?: string; limit?: number }) => {
      return eventSearch(args);
    }),
  },

  {
    name: "findNearbyPlaces",
    description:
      "Find places near a specific location (lat/lng). " +
      "Use this after finding a place to suggest nearby restaurants, hotels, or attractions. " +
      "Returns places sorted by distance with distance_km.",
    parameters: [
      { name: "latitude", type: "number" as const, description: "Latitude of center point", required: true },
      { name: "longitude", type: "number" as const, description: "Longitude of center point", required: true },
      { name: "radius_km", type: "number" as const, description: "Search radius in km (default 5, max 50)", required: false },
      {
        name: "collections",
        type: "string" as const,
        description: "Comma-separated types: restaurants,cafe,hotel,attraction,temple,park,musuem,hospital",
        required: false,
      },
      { name: "limit", type: "number" as const, description: "Max results (default 10)", required: false },
    ],
    handler: safeHandler(async (args: {
      latitude: number;
      longitude: number;
      radius_km?: number;
      collections?: string;
      limit?: number;
    }) => {
      return nearbySearch(args);
    }),
  },

  {
    name: "calculateRoute",
    description:
      "Calculate driving route between waypoints using OSRM. " +
      "Returns distance_km, duration_minutes, legs, and geometry for drawing on map. " +
      "Provide waypoints in order of visit.",
    parameters: [
      {
        name: "waypoints",
        type: "object[]" as const,
        description: "Array of {latitude, longitude} points in visit order",
        attributes: [
          { name: "latitude", type: "number" as const, description: "Latitude", required: true },
          { name: "longitude", type: "number" as const, description: "Longitude", required: true },
        ],
      },
    ],
    handler: safeHandler(async (args: { waypoints: { latitude: number; longitude: number }[] }) => {
      const route = await calculateRoute(args);
      return {
        distance_km: route.distance_km,
        duration_minutes: route.duration_minutes,
        legs: route.legs,
        geometry_summary: {
          type: route.geometry?.type,
          point_count: route.geometry?.coordinates?.length,
        },
      };
    }),
  },
];
