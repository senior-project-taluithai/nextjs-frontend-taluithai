import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BACKEND_URL =
  process.env.BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://localhost:8000";

function getProxyHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const authHeader = req.headers.get("Authorization");
  const authCookie = req.cookies.get("Authentication")?.value;
  const token = authHeader?.replace("Bearer ", "") || authCookie;

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function POST(req: NextRequest) {
  const payload = await req.text();

  const backendRes = await fetch(`${BACKEND_URL}/route-planner/plan`, {
    method: "POST",
    headers: getProxyHeaders(req),
    body: payload,
    cache: "no-store",
  });

  const body = await backendRes.text();
  return new Response(body, {
    status: backendRes.status,
    headers: {
      "Content-Type":
        backendRes.headers.get("content-type") || "application/json",
      "Cache-Control": "no-store",
    },
  });
}
