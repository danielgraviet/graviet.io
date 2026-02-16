import { sanityClient, isSanityConfigured } from "./sanity";
import { placeholderPosts, placeholderProjects } from "./placeholder-data";
import type { Post, Project } from "./types";

export async function getAllPosts(): Promise<Post[]> {
  if (!isSanityConfigured) return placeholderPosts;
  try {
    return await sanityClient.fetch(
      `*[_type == "post"] | order(publishedAt desc) {
        _id, title, "slug": slug.current, excerpt, publishedAt, tags
      }`
    );
  } catch {
    return placeholderPosts;
  }
}

export async function getLatestPosts(count = 3): Promise<Post[]> {
  if (!isSanityConfigured) return placeholderPosts.slice(0, count);
  try {
    return await sanityClient.fetch(
      `*[_type == "post"] | order(publishedAt desc)[0...$count] {
        _id, title, "slug": slug.current, excerpt, publishedAt, tags
      }`,
      { count }
    );
  } catch {
    return placeholderPosts.slice(0, count);
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSanityConfigured) {
    return placeholderPosts.find((p) => p.slug === slug) ?? null;
  }
  try {
    return await sanityClient.fetch(
      `*[_type == "post" && slug.current == $slug][0] {
        _id, title, "slug": slug.current, excerpt, publishedAt, tags, body
      }`,
      { slug }
    );
  } catch {
    return placeholderPosts.find((p) => p.slug === slug) ?? null;
  }
}

export async function getAllSlugs(): Promise<string[]> {
  if (!isSanityConfigured) return placeholderPosts.map((p) => p.slug);
  try {
    const results: { slug: string }[] = await sanityClient.fetch(
      `*[_type == "post"]{ "slug": slug.current }`
    );
    return results.map((r) => r.slug);
  } catch {
    return placeholderPosts.map((p) => p.slug);
  }
}

export async function getAllProjects(): Promise<Project[]> {
  if (!isSanityConfigured) return placeholderProjects;
  try {
    return await sanityClient.fetch(
      `*[_type == "project"] | order(featured desc, title asc) {
        _id, title, description, tags, url, featured
      }`
    );
  } catch {
    return placeholderProjects;
  }
}
