import { createClient } from "@sanity/client";
import { projectId, dataset, apiVersion } from "@/sanity/env";

export const isSanityConfigured = Boolean(projectId && dataset);

export const sanityClient = createClient({
  projectId: projectId || "placeholder",
  dataset: dataset || "production",
  apiVersion,
  useCdn: false,
});
