import { NextResponse } from "next/server";
import { getBusinessSite } from "@/lib/business-sites";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const photoName = new URL(request.url).searchParams.get("name") || "";

  if (!site?.googlePlaceId || !apiKey) {
    return new Response("Google Places is not configured.", { status: 503, headers: noStoreHeaders });
  }

  const expectedPrefix = `places/${site.googlePlaceId}/photos/`;
  if (!photoName.startsWith(expectedPrefix) || !/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(photoName)) {
    return new Response("Invalid photo reference.", { status: 400, headers: noStoreHeaders });
  }

  const photoUrl = new URL(`https://places.googleapis.com/v1/${photoName}/media`);
  photoUrl.searchParams.set("maxWidthPx", "1400");
  photoUrl.searchParams.set("maxHeightPx", "1200");

  const upstream = await fetch(photoUrl, {
    headers: { "X-Goog-Api-Key": apiKey },
    cache: "no-store",
    redirect: "follow",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response("Google photo could not be loaded.", { status: 502, headers: noStoreHeaders });
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  return new Response(upstream.body, {
    headers: { ...noStoreHeaders, "Content-Type": contentType },
  });
}
