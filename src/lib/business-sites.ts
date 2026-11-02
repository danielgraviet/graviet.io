import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const profilesDirectory = path.join(process.cwd(), "content/business-sites");

export type BusinessSite = {
  slug: string;
  name: string;
  category: string;
  city?: string;
  headline: string;
  intro: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string[];
  hoursHeading?: string;
  services: { name: string; description?: string }[];
  highlights?: string[];
  heroEyebrow?: string;
  heroBadge?: string;
  heroImage?: string;
  heroImageAlt?: string;
  heroImageCredit?: string;
  heroImageSource?: string;
  logoImage?: string;
  mascotImage?: string;
  mascotImageAlt?: string;
  media?: {
    src: string;
    alt: string;
    caption?: string;
    credit?: string;
    sourceUrl?: string;
  }[];
  assetRights?: { file: string; basis: "owner" | "permission" | "license" | "generated"; sourceUrl?: string; credit: string }[];
  reviewSummary?: {
    rating: number;
    reviewCount: number;
    sourceUrl: string;
    verifiedAt?: string;
  };
  reviews?: {
    quote: string;
    author: string;
    rating?: number;
    sourceUrl?: string;
  }[];
  signatureDrinks?: {
    name: string;
    description?: string;
    reviewMentions?: number;
  }[];
  drinksHeading?: string;
  drinksIntro?: string;
  offeringsLabel?: string;
  offeringsHeading?: string;
  offeringsIntro?: string;
  visitEyebrow?: string;
  visitHeading?: string;
  visitIntro?: string;
  galleryEyebrow?: string;
  galleryHeading?: string;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  instagramUrl?: string;
  officialWebsiteUrl?: string;
  googlePlaceId?: string;
  accentColor?: string;
  visualStyle?: "expressive" | "editorial" | "earthy" | "technical";
  designDirection?: string;
  googleMapsUrl?: string;
  sourceUrl?: string;
};

function isSlug(value: string) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

export async function getBusinessSite(slug: string): Promise<BusinessSite | null> {
  if (!isSlug(slug)) return null;

  try {
    const contents = await readFile(path.join(profilesDirectory, `${slug}.json`), "utf8");
    const profile = JSON.parse(contents) as BusinessSite;
    if (profile.slug !== slug || !profile.name || !profile.headline) return null;
    return profile;
  } catch {
    return null;
  }
}

export async function getBusinessSiteSlugs() {
  try {
    const files = await readdir(profilesDirectory);
    return files
      .filter((file) => file.endsWith(".json") && !file.startsWith("_"))
      .map((file) => file.slice(0, -5))
      .filter(isSlug);
  } catch {
    return [];
  }
}
