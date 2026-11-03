import { NextResponse } from "next/server";
import { getBusinessSite } from "@/lib/business-sites";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const noStoreHeaders = {
  "Cache-Control": "no-store, no-cache, max-age=0, must-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

function reviewExcerpt(value: string) {
  const sentences = value.replace(/\s+/g, " ").trim().match(/[^.!?]+[.!?]?/g) || [value];
  const menuTerms = /matcha|mexican mocha|mocha|horchata|latte|coffee|pastry|croissant/i;
  const positiveTerms = /fantastic|amazing|creamy|balanced|friendly|quick|delicious|refreshing/i;
  const best = sentences
    .map((sentence, index) => ({
      sentence: sentence.trim(),
      index,
      score:
        (sentence.match(new RegExp(menuTerms.source, "gi"))?.length || 0) * 4 +
        (sentence.match(new RegExp(positiveTerms.source, "gi"))?.length || 0) * 2,
    }))
    .filter((candidate) => candidate.sentence.length > 18)
    .sort((a, b) => b.score - a.score || a.index - b.index)[0]?.sentence || sentences[0].trim();
  const words = best.split(/\s+/);
  return words.length <= 22 ? best : `${words.slice(0, 22).join(" ").replace(/[.,;:]$/, "")}…`;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!site?.googlePlaceId) {
    return NextResponse.json({ error: "Google Place is not configured for this preview." }, { status: 404, headers: noStoreHeaders });
  }
  if (!apiKey) {
    return NextResponse.json({ error: "Google Places API is not configured on this deployment." }, { status: 503, headers: noStoreHeaders });
  }

  const fields = [
    "id", "displayName", "formattedAddress", "nationalPhoneNumber", "regularOpeningHours.weekdayDescriptions", "rating", "userRatingCount", "googleMapsUri",
    "photos.name", "photos.widthPx", "photos.heightPx", "photos.authorAttributions",
    "photos.googleMapsUri", "photos.flagContentUri",
    "reviews.rating", "reviews.text", "reviews.authorAttribution",
    "reviews.googleMapsUri", "reviews.flagContentUri", "reviews.relativePublishTimeDescription",
  ].join(",");

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(site.googlePlaceId)}`, {
    headers: {
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": fields,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Google Places could not load this business profile." }, { status: 502, headers: noStoreHeaders });
  }

  const place = await response.json();
  const photos = (place.photos || []).slice(0, 10);
  const reviews = (place.reviews || []).slice(0, 3).map((review: { text?: { text?: string; [key: string]: unknown } }) => ({
    ...review,
    text: review.text?.text ? { ...review.text, text: reviewExcerpt(review.text.text) } : review.text,
  }));

  return NextResponse.json({
    rating: place.rating,
    reviewCount: place.userRatingCount,
    googleMapsUri: place.googleMapsUri,
    formattedAddress: place.formattedAddress,
    phoneNumber: place.nationalPhoneNumber,
    weekdayHours: place.regularOpeningHours?.weekdayDescriptions,
    photos,
    reviews,
    reviewSortNote: "Reviews are ordered by Google’s relevance ranking.",
    reviewPolicyNote: "Google checks reviews for policy violations and removes fake content when it is identified; reviews are not verified by Google.",
  }, { headers: noStoreHeaders });
}
