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
  return { title: { absolute: site ? `${site.name} concept privacy` : "Preview privacy" }, robots: { index: false, follow: false } };
}

export default async function PreviewPrivacyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) notFound();

  return (
    <main className={styles.policy}>
      <Link href={`/demo/${site.slug}`} className={styles.back}>← Back to {site.name}</Link>
      <p className={styles.eyebrow}>PREVIEW WEBSITE</p>
      <h1>Privacy</h1>
      <p className={styles.updated}>Last updated November 2, 2026</p>
      <p>This independent concept preview is prepared by Daniel Graviet for {site.name}. It has no contact form, account sign-in, or checkout of its own.</p>

      <h2>Google Maps Platform content</h2>
      <p>When live Google Places content is enabled, this preview asks Google Places for business details, reviews, and photos for {site.name}. The preview does not store those Places API results in its business profile files. Photo requests are made through this site without response caching. Google Maps Platform content and related processing are subject to the <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google Privacy Policy</a> and <a href="https://cloud.google.com/maps-platform/terms" target="_blank" rel="noreferrer">Google Maps Platform Terms</a>.</p>

      <h2>Hosting and usage analytics</h2>
      <p>This preview is hosted by Vercel. Vercel may process request and security logs and this site may use Vercel Analytics to understand page usage. See the <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">Vercel Privacy Policy</a>.</p>

      <h2>Questions</h2>
      <p>For questions about this concept preview, contact Daniel Graviet through <a href="https://graviet.io">graviet.io</a>.</p>
      <Link href={`/demo/${site.slug}/terms`} className={styles.footerLink}>Preview terms →</Link>
    </main>
  );
}
