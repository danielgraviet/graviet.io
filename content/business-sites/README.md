# Business website previews

Each `*.json` profile in this directory creates a statically generated preview at `/demo/{slug}` using one shared template. Copy `_template.json` to a kebab-case filename, update the profile fields, then add any approved image assets under `public/business-sites/{slug}/`.

## Agent workflow

When given a Google Business Profile URL or profile details:

1. Collect only visible business facts: name, category, public contact details, address, listed hours, services, and map link. Save the profile URL in `sourceUrl` for later checking.
2. Draft a short headline and introduction using only those facts. Do not invent awards, years in business, guarantees, prices, service areas, or customer quotes.
3. Create `{slug}.json` by copying `_template.json`. Use an empty string or omit optional values that are not listed. Keep `services` to confirmed offerings.
4. Do not copy Google photos, logos, reviews, or other copyrighted materials into the preview. Use an image supplied by the owner or an image Daniel has permission to use. The layout has a designed placeholder when there is no approved hero image.
5. Build and inspect the preview locally at `/demo/{slug}`. Confirm phone, map, hours, spelling, and mobile layout before sharing it.
6. Commit and deploy through the existing Vercel project. The preview URL is `https://www.graviet.io/demo/{slug}`. It is marked `noindex` and labeled as a concept preview. Treat the first demo as a private link until the owner approves publication.
7. After the owner agrees, confirm business copy, assets, contact links, the $20/month hosting terms, and any domain preference. Then remove the preview notice and arrange their chosen public URL in a separate launch step.

## Data rules

- Filename and `slug` must match and use lowercase letters, numbers, and hyphens.
- `name`, `category`, `headline`, `intro`, and `services` are required.
- `phone`, `email`, `address`, `hours`, `highlights`, `heroImage`, `accentColor`, `googleMapsUrl`, and `sourceUrl` are optional.
- `heroImage` is a path under `public/`, for example `/business-sites/cedar-cafe/hero.jpg`.
- `accentColor` should be a readable dark color that works with white button text.

The Google profile is a source for research, not authorization to imply the business has approved or endorsed the site. Keep previews clearly identified until the owner has reviewed the content and given permission to publish.
