# Local business website previews

When asked to make a website preview for a local business, follow [`content/business-sites/README.md`](content/business-sites/README.md) and use the shared `/demo/[slug]` renderer. Do not create a one-off page unless the user explicitly asks for a different experience.

## Quality bar

- Give every business its own art direction. First inspect the official site, storefront photos, category, neighborhood, and brand. Write down a short visual direction, a restrained palette, and a type pairing before editing the profile. Do not reuse Pink Axolotl's colors, mascot, decorative stamp, copy, or food-specific layout by default.
- Make the first screen recognizable and useful: clear business-specific headline, strong image or intentional graphic composition, one primary action, and live Google rating/review proof when a Place ID is configured.
- Prefer real images supplied by the owner or explicitly cleared from the business's own materials. If none are available, make a clearly illustrative concept graphic or use a licensed asset; never imply generated imagery is a photo of the real business, staff, product, or location.
- Keep the layout conversion-focused and responsive. Select the primary action for the business (book, order, call, request a quote, directions, etc.); don't use a universal CTA.
- Use business-specific offerings, trust details, and imagery. Do not invent services, credentials, awards, customer counts, accessibility claims, or guarantees. Omit unknown facts.
- Keep all content profile-driven. Improve the shared renderer when a pattern should benefit future sites; avoid inline special cases keyed to a slug.

## Repeatable workflow

1. Start with the Maps link, exact business name, or a name and city. Use `npm run business:search -- "Business Name, City"` to find candidate Places and confirm the right location from the live output. Use `npm run business:inspect -- PLACE_ID` to see current details, review examples, and photo attributions. These commands print Google data only; they never save it.
2. Verify business facts against its current official website and public materials. Save only independently sourced facts in the profile. A Google `place_id` is the only Places result this workflow persists. Keep Places ratings, reviews, photos, attribution, and photo resource names live through the existing API-backed components; never paste them into JSON, Markdown, generated assets, or another cache.
3. Create a profile with `npm run business:scaffold -- --slug ... --name ... --category ... --city ... --place-id ...`. Fill its required facts and source URLs. Run `npm run business:validate -- SLUG` before previewing.
4. Build a bespoke visual concept. Use cleared business/owner media with `npm run business:asset -- --slug SLUG --url URL --file hero.jpg --alt "..." --credit "..." --source URL --rights owner|permission|license --role hero`. If a photo is not cleared, don't import it. For original raster illustrations or decorative art, use the image-generation workflow when available, store the output in `public/business-sites/SLUG/`, and identify it as concept artwork. SVG/CSS illustration is fine for code-native graphics.
5. Open `/demo/SLUG` and review the first fold, all CTA destinations, copy, attribution, hours, and desktop/mobile fit. Then build and publish through the repository's existing Git/Vercel flow when requested.

## Google Places handling

The Places API key is server-side only as `GOOGLE_PLACES_API_KEY`. Do not use a `NEXT_PUBLIC_` variable. Google Place IDs may be stored, but Places content and photo names must not be cached or persisted. Keep live API requests no-store and show the official Google Maps attribution plus individual author/source links. Treat Place Photos as place-level imagery; it is not necessarily attached to a specific review. Read the current official [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) and [Place Photos documentation](https://developers.google.com/maps/documentation/places/web-service/place-photos) if the integration changes.

