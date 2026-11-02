import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getBusinessSite, getBusinessSiteSlugs } from "@/lib/business-sites";
import styles from "../policy.module.css";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getBusinessSiteSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  return { title: { absolute: site ? `${site.name} concept terms` : "Preview terms" }, robots: { index: false, follow: false } };
}

export default async function PreviewTermsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) notFound();

  return (
    <main className={styles.policy}>
      <Link href={`/demo/${site.slug}`} className={styles.back}>← Back to {site.name}</Link>
      <p className={styles.eyebrow}>PREVIEW WEBSITE</p>
      <h1>Terms</h1>
      <p className={styles.updated}>Last updated November 2, 2026</p>
      <p>This is an independent website concept prepared by Daniel Graviet. It is a preview for discussion and has not been approved as the official website of {site.name}. Business details and hours may change; confirm current information with the business before visiting.</p>

      <h2>Google Maps Platform content</h2>
      <p>Google Maps Platform content, including place details, reviews, and photos, is provided with attribution and links to its source. It is governed by the <a href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noreferrer">Google Maps Platform Terms</a> and Google’s applicable policies. Use of the linked ordering and social services is governed by their own terms.</p>

      <h2>Preview status</h2>
      <p>This page is a concept preview, not a service agreement, sales offer, or representation that {site.name} sponsors or endorses the concept.</p>
      <Link href={`/demo/${site.slug}/privacy`} className={styles.footerLink}>Preview privacy →</Link>
    </main>
  );
}
