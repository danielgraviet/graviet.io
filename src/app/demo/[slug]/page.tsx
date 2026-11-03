import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { Bricolage_Grotesque, DM_Sans, Barlow_Condensed, Manrope } from "next/font/google";
import { notFound } from "next/navigation";
import { getBusinessSite, getBusinessSiteSlugs } from "@/lib/business-sites";
import { GooglePlacesProvider, GoogleReviewProof, GoogleReviewSection, GooglePlacesGallery, GooglePlaceContactDetails, GooglePlacesHero, BusinessAction } from "./GooglePlacesContent";
import { AutomotiveShowcase } from "./AutomotiveShowcase";
import styles from "./business-demo.module.css";

const displayFont = Bricolage_Grotesque({ subsets: ["latin"], variable: "--demo-display" });
const bodyFont = DM_Sans({ subsets: ["latin"], variable: "--demo-body" });
const architecturalDisplayFont = Barlow_Condensed({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-architectural-display" });
const architecturalBodyFont = Manrope({ subsets: ["latin"], variable: "--font-architectural-body" });

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

  const accent = site.accentColor || "#176b58";
  const mapsUrl = site.googleMapsUrl || (site.googlePlaceId ? `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(site.googlePlaceId)}` : undefined);
  const phoneHref = telephoneHref(site.phone);
  const primaryCta = site.primaryCta || (phoneHref ? { label: "Call the shop", href: phoneHref } : undefined);
  const secondaryCta = site.secondaryCta || (mapsUrl ? { label: "Get directions", href: mapsUrl } : undefined);
  const heroImage = site.heroImage || site.media?.[0]?.src;
  const heroAlt = site.heroImageAlt || site.media?.[0]?.alt || `${site.name} at the shop`;
  const heroImageSource = site.heroImageSource || site.sourceUrl;

  return (
    <GooglePlacesProvider slug={site.slug} placeId={site.googlePlaceId} initialSummary={site.reviewSummary} initialReviews={site.reviews}>
    <main className={`${styles.site} ${site.visualStyle ? styles[`${site.visualStyle}Theme`] : ""} ${displayFont.variable} ${bodyFont.variable} ${architecturalDisplayFont.variable} ${architecturalBodyFont.variable}`} style={{ "--demo-accent": accent } as CSSProperties}>
      {site.visualStyle === "darkMode" ? <AutomotiveShowcase site={site} mapsUrl={mapsUrl} /> : <>
      <div className={styles.previewNotice}>
        <span>Independent website concept · Preview only</span>
        {site.reviewSummary ? <a href={site.reviewSummary.sourceUrl} target="_blank" rel="noreferrer"><span aria-label={`${site.reviewSummary.rating} out of 5 stars`} className={styles.stars}>★★★★★</span><strong>{site.reviewSummary.rating}</strong><span>· {site.reviewSummary.reviewCount} Google reviews</span></a> : null}
      </div>

      <header className={styles.header}>
        <a href="#home" className={styles.brand} aria-label={`${site.name} home`}>
          {site.logoImage ? <Image src={site.logoImage} alt="" width={54} height={54} className={styles.logoImage} /> : null}
          <span><strong>{site.name}</strong><small>{site.category}</small></span>
        </a>
        <nav className={styles.nav} aria-label="Main navigation">{site.signatureDrinks?.length || site.services.length ? <a href="#favorites">{site.offeringsLabel || "What we offer"}</a> : null}<a href="#reviews">Reviews</a><a href="#visit">Visit</a></nav>
        {primaryCta ? <BusinessAction className={`${styles.button} ${styles.buttonSmall}`} label={primaryCta.label} href={primaryCta.href} fallbackHref={mapsUrl} showPhone={primaryCta.href === "place-phone"} /> : null}
      </header>

      <section id="home" className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}><span className={styles.eyebrowDot} /> {site.heroEyebrow || site.category}</p>
          <h1>{site.headline}</h1>
          <p className={styles.heroIntro}>{site.intro}</p>
          <div className={styles.heroActions}>
            {primaryCta ? <BusinessAction className={styles.button} label={primaryCta.label} href={primaryCta.href} fallbackHref={mapsUrl} showPhone={primaryCta.href === "place-phone"} /> : null}
            {secondaryCta ? <a className={styles.textLink} href={secondaryCta.href} target={secondaryCta.href.startsWith("http") ? "_blank" : undefined} rel={secondaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{secondaryCta.label}<span aria-hidden="true">↗</span></a> : null}
            {site.portfolioUrl ? <a className={styles.textLink} href={site.portfolioUrl} target="_blank" rel="noreferrer">{site.portfolioLabel || "See our work"}<span aria-hidden="true">↗</span></a> : null}
          </div>
          <GoogleReviewProof initialSummary={site.reviewSummary} mapsUrl={mapsUrl} />
        </div>
        <div className={styles.heroVisual}>
          <div className={styles.heroPhotoWrap}>
            <GooglePlacesHero slug={site.slug} businessName={site.name} fallbackImage={heroImage} alt={heroAlt} fallbackCredit={site.heroImageCredit} fallbackSource={heroImageSource} />
            {site.heroBadge ? <span className={styles.photoStamp}>{site.heroBadge}</span> : null}
          </div>
          {site.mascotImage ? <Image src={site.mascotImage} alt={site.mascotImageAlt || `${site.name} brand illustration`} width={218} height={218} className={styles.mascot} priority /> : null}
        </div>
      </section>

      {site.highlights?.length ? <section className={styles.highlightStrip} aria-label="Highlights">{site.highlights.map((highlight) => <span key={highlight}><i aria-hidden="true">✳</i>{highlight}</span>)}</section> : null}

      {site.signatureDrinks?.length ? (
        <section id="favorites" className={styles.favorites}>
          <div className={styles.sectionHeading}><p className={styles.eyebrow}>{site.offeringsLabel || "Featured offerings"}</p><h2>{site.offeringsHeading || site.drinksHeading || "A few customer favorites."}</h2><p>{site.offeringsIntro || site.drinksIntro || "A look at what this business offers."}</p></div>
          <div className={styles.drinkGrid}>{site.signatureDrinks.map((drink, index) => <article className={`${styles.drinkCard} ${styles[`drinkTone${index % 3}`]}`} key={drink.name}>
            <span className={styles.drinkNumber}>0{index + 1}</span><span className={styles.drinkSpark} aria-hidden="true">✳</span><h3>{drink.name}</h3>
            {drink.description ? <p>{drink.description}</p> : null}{drink.reviewMentions ? <span className={styles.mentionTag}>Mentioned in {drink.reviewMentions} Google reviews</span> : null}
          </article>)}</div>
        </section>
      ) : site.services.length ? (
        <section id="favorites" className={styles.favorites}><div className={styles.sectionHeading}><p className={styles.eyebrow}>{site.offeringsLabel || "Services"}</p><h2>{site.offeringsHeading || "Good work, close to home."}</h2>{site.offeringsIntro ? <p>{site.offeringsIntro}</p> : null}</div>
          <div className={styles.drinkGrid}>{site.services.map((service, index) => <article className={`${styles.drinkCard} ${styles[`drinkTone${index % 3}`]}`} key={service.name}><span className={styles.drinkNumber}>0{index + 1}</span><h3>{service.name}</h3>{service.description ? <p>{service.description}</p> : null}</article>)}</div>
        </section>
      ) : null}

      {site.googlePlaceId || site.reviewSummary || site.reviews?.length ? <GoogleReviewSection fallbackSummary={site.reviewSummary} fallbackReviews={site.reviews} mapsUrl={mapsUrl} /> : null}

      <GooglePlacesGallery slug={site.slug} businessName={site.name} fallbackMedia={site.media} mapsUrl={mapsUrl} eyebrow={site.galleryEyebrow} heading={site.galleryHeading} heroUsesPlacePhoto={Boolean(site.googlePlaceId)} />

      <section id="visit" className={styles.visit}>
        <div className={styles.visitShape} aria-hidden="true">✳</div>
        <div className={styles.visitCopy}><p className={styles.eyebrow}>{site.visitEyebrow || site.category}</p><h2>{site.visitHeading || "Come see us."}</h2>{site.visitIntro ? <p>{site.visitIntro}</p> : null}<p>{site.city}</p>
          {site.phone ? <p><a href={phoneHref}>{site.phone}</a></p> : null}
          <div className={styles.visitActions}>{secondaryCta ? <a className={`${styles.button} ${styles.buttonLight}`} href={secondaryCta.href} target={secondaryCta.href.startsWith("http") ? "_blank" : undefined} rel={secondaryCta.href.startsWith("http") ? "noreferrer" : undefined}>{secondaryCta.label}<span aria-hidden="true">↗</span></a> : null}{site.instagramUrl ? <a className={styles.visitLink} href={site.instagramUrl} target="_blank" rel="noreferrer">Follow on Instagram ↗</a> : null}</div>
        </div>
        <GooglePlaceContactDetails mapsUrl={mapsUrl} fallbackAddress={site.address} fallbackHours={site.hours} />
      </section>

      <footer className={styles.footer}><span>{site.name} · {site.city}</span><span className={styles.footerMeta}>Independent concept preview by Daniel Graviet <span><a href={`/demo/${site.slug}/terms`}>Terms</a> · <a href={`/demo/${site.slug}/privacy`}>Privacy</a></span></span></footer>
      {primaryCta ? <BusinessAction className={styles.mobileCta} label={primaryCta.label} href={primaryCta.href} fallbackHref={mapsUrl} showPhone={primaryCta.href === "place-phone"} /> : null}
      </>}
    </main>
    </GooglePlacesProvider>
  );
}
