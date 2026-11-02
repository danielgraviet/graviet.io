import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const profilesDirectory = path.join(process.cwd(), "content/business-sites");

export type BusinessSite = {
  slug: string;
  name: string;
  category: string;
  headline: string;
  intro: string;
  phone?: string;
  email?: string;
  address?: string;
  hours?: string[];
  services: { name: string; description?: string }[];
  highlights?: string[];
  heroImage?: string;
  accentColor?: string;
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
