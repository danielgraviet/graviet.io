#!/usr/bin/env node

import { mkdir, readFile, writeFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const profilesDir = path.join(root, "content/business-sites");
const assetsRoot = path.join(root, "public/business-sites");
const args = process.argv.slice(2);
const [command, ...rest] = args;

function usage() {
  console.log(`Business preview tools

Commands:
  business:search -- "Business name, City"   Find matching Google Places
  business:inspect -- PLACE_ID               Inspect live details, reviews and photos
  business:scaffold -- --slug SLUG --name NAME --category CATEGORY --city CITY --place-id ID
  business:asset -- --slug SLUG --url URL --file FILE --alt TEXT --credit NAME --source URL --rights owner|permission|license --role hero|gallery
  business:asset -- --slug SLUG --local GENERATED_FILE --file FILE --alt TEXT --credit "Original concept artwork" --rights generated --role hero|gallery
  business:validate -- SLUG

Google Places responses are printed for live research only and are never saved by these commands.`);
}

function readFlags(values) {
  const flags = {};
  for (let i = 0; i < values.length; i += 1) {
    const item = values[i];
    if (item.startsWith("--")) {
      const key = item.slice(2);
      const next = values[i + 1];
      if (!next || next.startsWith("--")) throw new Error(`Missing value for --${key}`);
      flags[key] = next;
      i += 1;
    }
  }
  return flags;
}

async function getApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  try {
    const env = await readFile(path.join(root, ".env"), "utf8");
    const entry = env.match(/^\s*GOOGLE_PLACES_API_KEY\s*=\s*(.*?)\s*$/m)?.[1];
    const value = entry?.replace(/^(['"])(.*)\1$/, "$2");
    if (value) return value;
  } catch {}
  throw new Error("Set GOOGLE_PLACES_API_KEY in the shell or project .env file.");
}

async function placesRequest(url, fields, body) {
  const key = await getApiKey();
  const response = await fetch(url, {
    method: body ? "POST" : "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": key,
      "X-Goog-FieldMask": fields,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(`Places API ${response.status}: ${payload.error?.message || "Request failed"}`);
  return payload;
}

function cleanSlug(value) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || "")) throw new Error("Slug must be lowercase words separated by hyphens.");
  return value;
}

function required(flags, keys) {
  for (const key of keys) if (!flags[key]?.trim()) throw new Error(`Missing required flag: --${key}`);
}

async function search(query) {
  if (!query) throw new Error('Provide a query, e.g. npm run business:search -- "Rose Cafe, Orem UT"');
  const data = await placesRequest("https://places.googleapis.com/v1/places:searchText", [
    "places.id", "places.displayName", "places.formattedAddress", "places.primaryTypeDisplayName",
    "places.websiteUri", "places.googleMapsUri",
  ].join(","), { textQuery: query, maxResultCount: 8 });
  if (!data.places?.length) return console.log("No matches found.");
  for (const [index, place] of data.places.entries()) {
    console.log(`\n${index + 1}. ${place.displayName?.text || "Unnamed place"}`);
    console.log(`   ${place.formattedAddress || "Address unavailable"}`);
    if (place.primaryTypeDisplayName?.text) console.log(`   ${place.primaryTypeDisplayName.text}`);
    console.log(`   Place ID: ${place.id}`);
    if (place.websiteUri) console.log(`   Website: ${place.websiteUri}`);
    if (place.googleMapsUri) console.log(`   Maps: ${place.googleMapsUri}`);
  }
  console.log("\nChoose the matching Place ID and pass it to business:inspect and business:scaffold.");
}

async function inspect(placeId) {
  if (!placeId) throw new Error("Provide a Place ID from business:search.");
  const fields = [
    "id", "displayName", "formattedAddress", "primaryTypeDisplayName", "websiteUri", "googleMapsUri",
    "nationalPhoneNumber", "regularOpeningHours", "rating", "userRatingCount", "photos.name",
    "photos.widthPx", "photos.heightPx", "photos.authorAttributions", "photos.googleMapsUri", "photos.flagContentUri",
    "reviews.rating", "reviews.text", "reviews.authorAttribution", "reviews.googleMapsUri",
    "reviews.flagContentUri", "reviews.relativePublishTimeDescription",
  ].join(",");
  const data = await placesRequest(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`, fields);
  console.log(JSON.stringify(data, null, 2));
  console.log("\nLive API response only. Do not copy Google Places content into profile files or generated assets; store only the Place ID.");
}

async function scaffold(flags) {
  required(flags, ["slug", "name", "category", "city", "place-id"]);
  const slug = cleanSlug(flags.slug);
  const profilePath = path.join(profilesDir, `${slug}.json`);
  try { await access(profilePath); throw new Error(`${profilePath} already exists; refusing to overwrite.`); } catch (error) { if (error.message.includes("already exists")) throw error; }
  const template = JSON.parse(await readFile(path.join(profilesDir, "_template.json"), "utf8"));
  const name = flags.name.trim();
  const city = flags.city.trim();
  const profile = {
    ...template,
    slug,
    name,
    category: flags.category.trim(),
    city,
    heroEyebrow: `${flags.category.trim()} · ${city}`,
    headline: `${name}, made easier to choose.`,
    intro: `A short, specific introduction to ${name}, confirmed from its official public materials.`,
    address: "",
    googlePlaceId: flags["place-id"].trim(),
    phone: "",
    email: "",
    hours: [],
    primaryCta: { label: "Contact the business", href: "#visit" },
    secondaryCta: { label: "Get directions", href: "#visit" },
    offeringsLabel: "Services",
    offeringsHeading: `How ${name} can help`,
    offeringsIntro: "Add verified offerings from the business's own public materials.",
    services: [],
    highlights: [],
    media: [],
    accentColor: "#176b58",
    visualStyle: "editorial",
    designDirection: "Choose a distinctive direction that fits the brand and neighborhood.",
    sourceUrl: "",
    googleMapsUrl: "",
    officialWebsiteUrl: "",
  };
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`, { flag: "wx" });
  await mkdir(path.join(assetsRoot, slug), { recursive: true });
  console.log(`Created ${path.relative(root, profilePath)} and ${path.relative(root, assetsRoot)}/${slug}/`);
  console.log("Next: verify facts from official sources, pick the business-specific CTA and visual direction, then run business:validate.");
}

async function importAsset(flags) {
  required(flags, ["slug", "file", "alt", "credit", "rights", "role"]);
  const slug = cleanSlug(flags.slug);
  if (!["owner", "permission", "license", "generated"].includes(flags.rights)) throw new Error("--rights must be owner, permission, license, or generated.");
  if (!["hero", "gallery"].includes(flags.role)) throw new Error("--role must be hero or gallery.");
  if (path.basename(flags.file) !== flags.file || !/^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(jpg|jpeg|png|webp|avif)$/i.test(flags.file)) throw new Error("--file must be a simple image filename ending in jpg, png, webp, or avif.");
  if (flags.rights === "generated" ? !flags.local : !flags.url || !flags.source) throw new Error(flags.rights === "generated" ? "Generated assets require --local." : "Web assets require --url and --source.");
  const profilePath = path.join(profilesDir, `${slug}.json`);
  const profile = JSON.parse(await readFile(profilePath, "utf8"));
  let image;
  if (flags.rights === "generated") {
    image = await readFile(path.resolve(flags.local));
  } else {
    const url = new URL(flags.url);
    if (url.protocol !== "https:") throw new Error("Image source must use HTTPS.");
    const response = await fetch(url, { redirect: "follow" });
    if (!response.ok) throw new Error(`Image download failed with HTTP ${response.status}.`);
    const type = response.headers.get("content-type") || "";
    if (!type.startsWith("image/")) throw new Error(`Source returned ${type || "an unknown type"}, not an image.`);
    image = Buffer.from(await response.arrayBuffer());
  }
  if (image.length > 12 * 1024 * 1024) throw new Error("Image exceeds 12 MB. Resize it before adding it to the preview.");
  const relativeSrc = `/business-sites/${slug}/${flags.file}`;
  const output = path.join(assetsRoot, slug, flags.file);
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, image, { flag: "wx" });
  const item = { src: relativeSrc, alt: flags.alt, credit: flags.credit, ...(flags.source ? { sourceUrl: flags.source } : {}) };
  profile.media = [...(profile.media || []), item];
  if (flags.role === "hero") {
    profile.heroImage = relativeSrc;
    profile.heroImageAlt = flags.alt;
    profile.heroImageCredit = flags.credit;
    if (flags.source) profile.heroImageSource = flags.source;
  }
  profile.assetRights = [...(profile.assetRights || []), { file: relativeSrc, basis: flags.rights, ...(flags.source ? { sourceUrl: flags.source } : {}), credit: flags.credit }];
  await writeFile(profilePath, `${JSON.stringify(profile, null, 2)}\n`);
  console.log(`Imported ${relativeSrc}. Rights basis recorded as ${flags.rights}; verify it is accurate before publishing.`);
}

async function validate(slugValue) {
  const slug = cleanSlug(slugValue);
  const profilePath = path.join(profilesDir, `${slug}.json`);
  const profile = JSON.parse(await readFile(profilePath, "utf8"));
  const errors = [];
  for (const key of ["slug", "name", "category", "headline", "intro"]) if (!profile[key]) errors.push(`Missing required value: ${key}`);
  if (profile.slug !== slug) errors.push(`Profile slug must match filename (${slug}).`);
  if (!Array.isArray(profile.services)) errors.push("services must be an array; add only offerings verified on a non-Google source.");
  if (profile.googlePlaceId && !/^[A-Za-z0-9_-]+$/.test(profile.googlePlaceId)) errors.push("googlePlaceId has an unexpected format.");
  for (const field of ["heroImage", "logoImage", "mascotImage"]) {
    const src = profile[field];
    if (!src) continue;
    if (!src.startsWith("/")) errors.push(`${field} must use a local /public asset path.`);
    else try { await access(path.join(root, "public", src.slice(1))); } catch { errors.push(`${field} file not found: ${src}`); }
  }
  for (const item of profile.media || []) {
    if (!item.alt) errors.push(`Media ${item.src} needs alt text.`);
    if (item.src?.startsWith("/")) try { await access(path.join(root, "public", item.src.slice(1))); } catch { errors.push(`Media file not found: ${item.src}`); }
    const rights = profile.assetRights?.find((entry) => entry.file === item.src);
    if (item.credit && !item.sourceUrl && rights?.basis !== "generated") errors.push(`Media ${item.src} has credit but no sourceUrl or generated-art record.`);
    if (item.sourceUrl && !item.sourceUrl.startsWith("https://")) errors.push(`Media ${item.src} sourceUrl must use HTTPS.`);
  }
  if (profile.heroImage && !profile.heroImageAlt) errors.push("Add meaningful heroImageAlt text.");
  if (!profile.heroImage) errors.push("Add a strong first-fold image or original concept illustration.");
  for (const cta of [profile.primaryCta, profile.secondaryCta]) {
    if (cta && (!cta.label || !cta.href || cta.href === "#visit")) errors.push("Replace each placeholder CTA with a verified phone, order, booking, contact, or map destination.");
  }
  if (profile.sourceUrl && !profile.sourceUrl.startsWith("https://")) errors.push("sourceUrl must use HTTPS.");
  if (errors.length) {
    console.error(`Needs attention (${errors.length}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
    process.exitCode = 1;
  } else console.log(`${profile.name} (${slug}) passes the profile and local asset checks.`);
}

try {
  if (command === "search") await search(rest.join(" ").replace(/^--\s*/, "").trim());
  else if (command === "inspect") await inspect(rest.filter((part) => part !== "--")[0]);
  else if (command === "scaffold") await scaffold(readFlags(rest));
  else if (command === "asset") await importAsset(readFlags(rest));
  else if (command === "validate") await validate(rest.filter((part) => part !== "--")[0]);
  else usage();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

