# Business website previews

Every `*.json` profile in this directory creates a statically generated site at `/demo/{slug}` using the shared responsive renderer. The renderer is deliberately profile-driven so new businesses start quickly; each profile still needs its own research, copy, and art direction.

## Fast path

```sh
npm run business:search -- "Business Name, City"
npm run business:inspect -- PLACE_ID
npm run business:scaffold -- --slug business-name --name "Business Name" --category "Local business" --city "City, State" --place-id PLACE_ID
npm run business:validate -- business-name
npm run dev
```

Search/inspect use `GOOGLE_PLACES_API_KEY` from the shell or local `.env` and print results to the terminal for current research. They never write Places results to disk. Only the selected Place ID is carried into the scaffold; Google permits storage of Place IDs while restricting storage of other Places content. Independently verify facts against the business's official website and public materials before adding them to a profile.

For a cleared owner/business image, import it with explicit rights and attribution:

```sh
npm run business:asset -- --slug business-name --url https://example.com/photo.jpg --file hero.jpg --alt "Description of the image" --credit "Business Name" --source https://example.com --rights permission --role hero
```

Use `--rights owner` when the owner supplied the file, `permission` when reuse was explicitly allowed, or `license` when its license permits use. This helper does not decide whether a URL is licensed. If no usable real image is cleared, use a licensed image or original concept art. Clearly label concept art; never depict it as a photo of the actual premises, staff, or product.

For generated art, make the image with the available image generation workflow, then import its local output so the profile records it as concept art:

```sh
npm run business:asset -- --slug business-name --local /absolute/path/to/concept.png --file concept.png --alt "Original illustrated artwork for Business Name" --credit "Original concept artwork" --rights generated --role hero
```

Use [`IMAGE_WORKFLOW.md`](IMAGE_WORKFLOW.md) for the reusable art brief and image sourcing rules.

## Agent process

See the root [`AGENTS.md`](../../AGENTS.md) for the detailed direction file. In short: verify the right location and official web presence; gather sourced facts; choose a category-specific visual direction; build a custom first fold with one strong CTA and live Google proof; use cleared or clearly illustrative media; keep content in the JSON profile; review the deployed-size desktop and mobile page.

## Profiles and components

- Copy [`_template.json`](_template.json) for the initial structure. `business:scaffold` creates this automatically.
- Required profile values: `slug`, `name`, `category`, `headline`, `intro`, and `services`.
- Art direction: `accentColor`, `heroEyebrow`, `heroImage`, `heroImageAlt`, `heroImageCredit`, `heroImageSource`, `mascotImage`, `mascotImageAlt`, `media`, and the category-appropriate section headings.
- Conversion: `primaryCta`, `secondaryCta`, and verified phone/booking/order links.
- Trust and content: sourced `highlights`, `services`, and optional testimonials from a non-Google source. Do not store Google ratings, review text, authors, photo URLs/names, or other Places responses. When `googlePlaceId` is configured, the existing client components request current reviews and photos directly from the server API route with no-store responses.
- `business:validate` checks required fields and referenced local files before previewing.

Google Places content must remain live, visibly attributed, and linked to the Google Maps source. Photo resource names can expire; ask the API for fresh names at runtime. Place Photos may include owner and user-contributed photos, and a Place Photo is not guaranteed to belong to a particular review. Keep the key server-side as `GOOGLE_PLACES_API_KEY`, restrict it to the required API, and configure it in Vercel for deployed previews. The preview includes public Terms and Privacy pages and Google attribution patterns. See [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) and [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos).
