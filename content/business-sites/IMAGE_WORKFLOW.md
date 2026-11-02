# Image workflow for local business previews

Create a short brief for each profile before searching or generating:

```text
Business / category:
Neighborhood and audience:
Brand cues from the official site or storefront:
Visual direction (one sentence):
Palette (base, text, one accent):
Type mood (display + readable body):
Hero media needed:
Support media or graphic motif:
Primary action the imagery should support:
Assets we are allowed to use and their source/credit:
```

## Choose the right asset path

1. Ask for owner-provided photos or permission to use official business photos. A public image URL alone does not establish permission to download and rehost it.
2. Use `business:asset` for a cleared HTTPS image, with its credit, source, rights basis, and descriptive alt text. Compress large files and keep only the images used by the concept.
3. If no real photo is available, create an original illustration, background texture, collage, or typographic graphic. It must read as concept art, not a documentary photo of the business. Import a generated local output with `--rights generated` and label it as original concept art in the profile.
4. Google Place Photos are not downloaded with this helper. Keep them live through the Places API gallery so fresh photo names, Google Maps attribution, author attribution, source links, and reporting links stay together. Do not treat place photos as photos attached to particular reviews unless the API identifies that connection.

## Generation prompt frame

Use this structure with the available image-generation tool. Replace every bracketed field with findings from the business research:

> Create an original, art-directed visual for a website concept for **[business/category]** in **[neighborhood]**. Visual direction: **[specific direction, not a generic industry template]**. Use **[palette]** and visual motifs inspired by **[verified brand cues, architecture, craft, or local context]**. Composition: **[wide hero crop / square sticker / transparent mascot / background texture]**, with **[clear space for heading or CTA]**. Style: **[specific illustration/print/photography treatment]**, polished edges, deliberate texture, strong silhouette, coherent lighting. This is **concept artwork**, not a photograph or official logo; do not include readable text, fabricated signage, fake customer testimonials, or claims. Do not depict the real storefront, staff, or identifiable products as though photographed. Output at **[aspect ratio/resolution]**.

Make the result fit the actual profile's color and type direction. Avoid reusing the same illustration treatment, palette, or motif for unrelated businesses. Generate logos only when the preview clearly labels them as concept marks and does not imply an official identity.

