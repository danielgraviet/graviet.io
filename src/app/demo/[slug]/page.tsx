import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { getBusinessSite, getBusinessSiteSlugs } from "@/lib/business-sites";
import { GooglePlacesProvider, GoogleReviewProof, GoogleReviewSection, GooglePlacesGallery } from "./GooglePlacesContent";
import styles from "./business-demo.module.css";

const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--demo-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--demo-body" });

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getBusinessSiteSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) return { title: { absolute: "Business website preview" }, robots: { index: false, follow: false } };
  return { title: { absolute: site.name }, description: site.intro, robots: { index: false, follow: false } };
}

function telephoneHref(phone?: string) {
  return phone ? `tel:${phone.replace(/[^0-9+]/g, "")}` : undefined;
}

export default async function BusinessDemoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) notFound();

  const accent = site.accentColor || "#e83778";
  const phoneHref = telephoneHref(site.phone);
  const primaryCta = site.primaryCta || (phoneHref ? { label: "Call the shop", href: phoneHref } : undefined);
  const secondaryCta = site.secondaryCta || (site.googleMapsUrl ? { label: "Get directions", href: site.googleMapsUrl } : undefined);
  const heroImage = site.heroImage || site.media?.[0]?.src;
  const heroAlt = site.heroImageAlt || site.media?.[0]?.alt || `${site.name} at the shop`;

  return (
    <GooglePlacesProvider slug={site.slug} placeId={site.googlePlaceId} initialSummary={site.reviewSummary} initialReviews={site.reviews}>
    <main className={`${styles.site} ${displayFont.variable} ${bodyFont.variable}`} style={{ "--demo-accent": accent } as CSSProperties}>
      <div className={styles.previewNotice}>
        <span>Independent website concept · Preview only</span>
        {site.reviewSummary ? <a href={site.reviewSummary.sourceUrl} target="_blank" rel="noreferrer"><span aria-label={`${site.reviewSummary.rating} out of 5 stars`} className={styles.stars}>★★★★★</span><strong>{site.reviewSummary.rating}</strong><span>· {site.reviewSummary.reviewCount} Google reviews</span></a> : null}
      </div>

      <header className={styles.header}>
        <a href="#home" className={styles.brand} aria-label={`${site.name} home`}>
          {site.logoImage ? <Image src={site.logoImage} alt="" width={54} height={54} className={styles.logoImage} /> : null}
          <span><strong>{site.name}</strong><small>{site.category}</small></span>
        </a>
        <nav className={styles.nav} aria-label="Main navigation"><a href="#favorites">The drinks</a><a href="#reviews">Reviews</a><a href="#visit">Find us</a></nav>
        {primaryCta ? <a className={`${styles.button} ${styles.buttonSmall}`} href={primaryCta.href} target={primaryCta.href.startsWith("http") ? "_blank" : undefined} rel={primaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{primaryCta.label}<span aria-hidden="true">↗</span></a> : null}
      </header>

      <section id="home" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.eyebrowDot} /> {site.heroEyebrow || site.category}</p>
          <h1>{site.headline}</h1>
          <p className={styles.heroIntro}>{site.intro}</p>
          <div className={styles.heroActions}>
            {primaryCta ? <a className={styles.button} href={primaryCta.href} target={primaryCta.href.startsWith("http") ? "_blank" : undefined} rel={primaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{primaryCta.label}<span aria-hidden="true">↗</span></a> : null}
            {secondaryCta ? <a className={styles.textLink} href={secondaryCta.href} target={secondaryCta.href.startsWith("http") ? "_blank" : undefined} rel={secondaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{secondaryCta.label}<span aria-hidden="true">↗</span></a> : null}
          </div>
          <GoogleReviewProof initialSummary={site.reviewSummary} mapsUrl={site.googleMapsUrl} />
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroPhotoWrap}>
            {heroImage ? <Image src={heroImage} alt={heroAlt} fill priority sizes="(max-width: 760px) 92vw, 48vw" className={styles.heroPhoto} /> : null}
            <span className={styles.photoStamp}>MADE FOR<br />THE MOOD</span>
          </div>
          {site.mascotImage ? <Image src={site.mascotImage} alt="Playful axolotl drink illustration" width={218} height={218} className={styles.mascot} priority /> : null}
          {site.heroImageCredit ? <a className={styles.photoCredit} href={site.heroImageSource || site.sourceUrl} target="_blank" rel="noreferrer">Photo: {site.heroImageCredit}</a> : null}
        </div>
      </section>

      {site.highlights?.length ? <section className={styles.highlightStrip} aria-label="Highlights">{site.highlights.map((highlight) => <span key={highlight}><i aria-hidden="true">✳</i>{highlight}</span>)}</section> : null}

      {site.signatureDrinks?.length ? (
        <section id="favorites" className={styles.favorites}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>THE REGULARS’ SHORTLIST</p><h2>{site.drinksHeading || "A few crowd favorites."}</h2><p>{site.drinksIntro || "A taste of what people come back for."}</p></div>
          <div className={styles.drinkGrid}>{site.signatureDrinks.map((drink, index) => <article className={`${styles.drinkCard} ${styles[`drinkTone${index % 3}`]}`} key={drink.name}>
            <span className={styles.drinkNumber}>0{index + 1}</span><span className={styles.drinkSpark} aria-hidden="true">✳</span><h3>{drink.name}</h3>
            {drink.description ? <p>{drink.description}</p> : null}{drink.reviewMentions ? <span className={styles.mentionTag}>Mentioned in {drink.reviewMentions} Google reviews</span> : null}
          </article>)}</div>
        </section>
      ) : site.services.length ? (
        <section id="favorites" className={styles.favorites}><div className={styles.sectionHeading}><p className={styles.eyebrow}>WHAT WE DO</p><h2>Good work, close to home.</h2></div>
          <div className={styles.drinkGrid}>{site.services.map((service, index) => <article className={`${styles.drinkCard} ${styles[`drinkTone${index % 3}`]}`} key={service.name}><span className={styles.drinkNumber}>0{index + 1}</span><h3>{service.name}</h3>{service.description ? <p>{service.description}</p> : null}</article>)}</div>
        </section>
      ) : null}

      {site.reviewSummary || site.reviews?.length ? <GoogleReviewSection fallbackSummary={site.reviewSummary} fallbackReviews={site.reviews} mapsUrl={site.googleMapsUrl} /> : null}

      <GooglePlacesGallery slug={site.slug} businessName={site.name} fallbackMedia={site.media} mapsUrl={site.googleMapsUrl} />

      <section id="visit" className={styles.visit}>
        <div className={styles.visitShape} aria-hidden="true">✳</div>
        <div className={styles.visitCopy}><p className={styles.eyebrow}>YOUR OREM COFFEE RUN</p><h2>See you soon?</h2><p>{site.address}</p>
          {site.phone ? <p><a href={phoneHref}>{site.phone}</a></p> : null}
          <div className={styles.visitActions}>{secondaryCta ? <a className={`${styles.button} ${styles.buttonLight}`} href={secondaryCta.href} target={secondaryCta.href.startsWith("http") ? "_blank" : undefined} rel={secondaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{secondaryCta.label}<span aria-hidden="true">↗</span></a> : null}{site.instagramUrl ? <a className={styles.visitLink} href={site.instagramUrl} target="_blank" rel="noreferrer">Follow on Instagram ↗</a> : null}</div>
        </div>
        <div className={styles.hoursCard}><h3>Come by today</h3>{site.hours?.length ? <ul>{site.hours.map((hour) => { const [day, time] = hour.split(" · "); return <li key={hour}><span>{day}</span><span>{time}</span></li>; })}</ul> : <p>Check the listing for current hours.</p>}{site.googleMapsUrl ? <a href={site.googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a> : null}</div>
      </section>

      <footer className={styles.footer}><span>{site.name} · {site.address}</span><span className={styles.footerMeta}>Independent concept preview by Daniel Graviet <span><a href={`/demo/${site.slug}/terms`}>Terms</a> · <a href={`/demo/${site.slug}/privacy`}>Privacy</a></span></span></footer>
      {primaryCta ? <a className={styles.mobileCta} href={primaryCta.href} target={primaryCta.href.startsWith("http") ? "_blank" : undefined} rel={primaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{primaryCta.label}<span aria-hidden="true">↗</span></a> : null}
    </main>
    </GooglePlacesProvider>
  );
}
