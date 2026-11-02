# Business website previews

Each `*.json` profile in this directory creates a statically generated site at `/demo/{slug}` with one shared responsive layout. Copy `_template.json` to a kebab-case filename, fill in the profile, then add approved local image assets under `public/business-sites/{slug}/`.

## Agent workflow

1. **Check whether a site already exists.** Search the exact business name and address, inspect the Google Business Profile and any official site linked from it. Google can omit an active website: Pink Axolotl’s listing showed no website, but its online ordering site is `pinkaxolotlcoffee.com`. Treat a prospect with an existing site as a redesign or landing-page concept, not as having no web presence.
2. **Build a fact sheet.** Collect business name, category, current address/hours, phone/email, official website, ordering/booking links, services or menu items, and accessibility notes. Save the source URLs and the date each volatile detail was checked. Resolve conflicting details in favor of the current official business site, then cross-check the Maps listing.
3. **Add social proof carefully.** Record the current Google rating, review count, source URL, and verification date in `reviewSummary`. Choose one or two short review excerpts (under 25 words from each reviewer), preserve the reviewer’s visible attribution, and link each card to Google. Turn review topics into “mentioned in X reviews” menu/service callouts only when Maps shows the count. Avoid inventing customer claims or presenting old ratings as live.
4. **Use strong, cleared media.** Prefer photos and logos from the business’s own site, images the owner supplied, or assets the owner has permission to use. Add meaningful alt text, source, and credit. Google review photos belong to their contributors: don’t download and rehost them. The Places API can return place photos with author attributions and Google display requirements, but those photos are not guaranteed to be photos attached to a specific review. Label them “Google Maps photos” unless a specific review connection is actually provided.
5. **Choose the site direction.** Use the business’s existing colors/identity when available; otherwise select a specific design direction from the category and storefront. Set a clear headline, accent color, standout typography, and the strongest relevant action (order, book, call, get directions). Keep the source data and visual direction in JSON so the layout remains reusable.
6. **Create the profile.** Copy `_template.json` to `{slug}.json`. Add `reviewSummary`, `reviews`, `signatureDrinks`, `primaryCta`, `secondaryCta`, `heroImage` metadata, `mascotImage`, and `media` as needed. Do not include empty placeholder content. Keep `sourceUrl` for the original Maps listing and `officialWebsiteUrl` when one exists.
7. **Inspect before sharing.** Build and open `/demo/{slug}` at desktop and mobile widths. Check the first-fold image, review proof, CTA destinations, spelling, phone/address, hours, image credits, and page overflow. The preview uses `noindex` and a visible concept label. Deploy through the existing Vercel project, then share `https://www.graviet.io/demo/{slug}`.

## Live Google Places content

For a profile with a `googlePlaceId`, the preview requests current rating, review, and photo data from the Places API. The API key stays server-side in `GOOGLE_PLACES_API_KEY`; never use a `NEXT_PUBLIC_` key. Add the same variable to the Vercel Production environment to enable the live gallery there. The route does not write Places API results to profile files or cache responses. It makes one Place Details request when a preview opens, then fetches photo bytes on demand as visible gallery images load. Keep the Cloud API key restricted to the needed Places API, set usage quotas/budget alerts, and monitor calls before using the feature broadly.

Google Maps Platform requires the official Maps attribution, visible author attribution and direct source links for photos/reviews, plus public Terms of Use and Privacy Policy pages. The previews include those attribution patterns and link to the policy pages under `/demo/{slug}/terms` and `/demo/{slug}/privacy`. Review order/policy notices are shown with the Google review cards. See [Places API policies](https://developers.google.com/maps/documentation/places/web-service/policies) and [Place Photos](https://developers.google.com/maps/documentation/places/web-service/place-photos).

## Profile fields

- Required: `slug`, `name`, `category`, `headline`, `intro`, and `services`.
- Contact: `phone`, `email`, `address`, `hours`, `googleMapsUrl`, `officialWebsiteUrl`, and `instagramUrl`.
- Art direction: `accentColor`, `heroEyebrow`, `heroImage`, `heroImageAlt`, `heroImageCredit`, `heroImageSource`, `logoImage`, and `mascotImage`.
- Authority: store the exempt `googlePlaceId` for live Places content. `reviewSummary` and `reviews` are optional fallbacks for other sources; when provided, keep short excerpts attributed and linked to their source.
- Offerings: `signatureDrinks` entries have `name`, optional `description`, and optional `reviewMentions`. General businesses can use `services` with `name` and optional `description`.
- Conversion: `primaryCta` and `secondaryCta` each have a `label` and `href`.
- Gallery: `media` entries have `src` (a path under `public/`), `alt`, optional `caption`, `credit`, and `sourceUrl`.

Keep the preview clearly identified until the owner approves the final copy, imagery, and public launch.
