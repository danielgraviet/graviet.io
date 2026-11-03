import type { BusinessSite } from "@/lib/business-sites";
import {
  BusinessAction,
  GooglePlacesGallery,
  GooglePlacesHero,
  GooglePlaceContactDetails,
  GoogleReviewProof,
  GoogleReviewSection,
} from "./GooglePlacesContent";
import styles from "./automotive-showcase.module.css";

export function AutomotiveShowcase({ site, mapsUrl }: { site: BusinessSite; mapsUrl?: string }) {
  const primary = site.primaryCta || { label: "Call now", href: site.phone ? `tel:${site.phone.replace(/[^0-9+]/g, "")}` : "place-phone" };
  const secondary = site.secondaryCta;

  return (
    <div className={styles.showcase}>
      <div className={styles.previewLine}>Independent website concept · Preview only</div>
      <header className={styles.masthead}>
        <a href="#home" className={styles.wordmark} aria-label={`${site.name} home`}>
          <strong>CH<span> / </span>WRAPS</strong>
          <small>Take pride in your ride</small>
        </a>
        <nav aria-label="Main navigation">
          <a href="#services">Services</a><a href="#gallery">Work</a><a href="#reviews">Reviews</a><a href="#visit">Find us</a>
        </nav>
        <BusinessAction className={styles.navCall} label="Call the shop" href={primary.href} fallbackHref={mapsUrl} showPhone />
      </header>

      <main>
        <section id="home" className={styles.cover}>
          <div className={styles.coverPhoto}>
            <GooglePlacesHero slug={site.slug} businessName={site.name} fallbackImage={site.heroImage} alt={site.heroImageAlt || `${site.name} vehicle wrap portfolio`} fallbackCredit={site.heroImageCredit} fallbackSource={site.heroImageSource} />
          </div>
          <div className={styles.coverShade} />
          <div className={styles.coverContent}>
            <p className={styles.kicker}><span /> VINYL · PROTECTION · DETAIL</p>
            <h1>{site.headline}</h1>
            <p>{site.intro}</p>
            <div className={styles.coverActions}>
              <BusinessAction className={styles.callButton} label="Call now" href={primary.href} fallbackHref={mapsUrl} showPhone />
              <a className={styles.workLink} href="#gallery">Explore the work <span aria-hidden="true">↓</span></a>
            </div>
          </div>
          <div className={styles.coverProof}>
            <span className={styles.proofLabel}>THE WORD ON THE WORK · GOOGLE</span>
            <GoogleReviewProof variant="automotive" initialSummary={site.reviewSummary} mapsUrl={mapsUrl} />
            <a href="#reviews">Read customer notes <span aria-hidden="true">↘</span></a>
          </div>
          <span className={styles.coverIndex}>VINEYARD, UTAH <i>·</i> VEHICLE RESTYLING</span>
        </section>

        <section id="services" className={styles.services}>
          <div className={styles.servicesIntro}>
            <p className={styles.kicker}><span /> THE FINISH IS YOURS</p>
            <h2>Three ways to change the feel of your vehicle.</h2>
            <p>Choose a new expression, protect the finish you love, or refine the details.</p>
          </div>
          <div className={styles.serviceIndex}>
            {site.services.map((service, index) => (
              <article className={styles.serviceRow} key={service.name}>
                <span className={styles.serviceNumber}>0{index + 1}</span>
                <h3>{service.name}</h3>
                <p>{service.description}</p>
                <span className={styles.serviceMark} aria-hidden="true">↗</span>
              </article>
            ))}
          </div>
        </section>

        <GoogleReviewSection variant="automotive" fallbackSummary={site.reviewSummary} fallbackReviews={site.reviews} mapsUrl={mapsUrl} />

        <GooglePlacesGallery id="gallery" variant="automotive" slug={site.slug} businessName={site.name} fallbackMedia={site.media} mapsUrl={mapsUrl} eyebrow={site.galleryEyebrow} heading={site.galleryHeading} heroUsesPlacePhoto={Boolean(site.googlePlaceId)} />

        <section id="visit" className={styles.contact}>
          <div className={styles.contactCopy}>
            <p className={styles.kicker}><span /> START WITH A CONVERSATION</p>
            <h2>{site.visitHeading || "Let’s make it yours."}</h2>
            <p>{site.visitIntro || "Talk through the look you have in mind."}</p>
            <BusinessAction className={styles.contactCall} label="Call CH Wraps" href={primary.href} fallbackHref={mapsUrl} showPhone />
            {secondary ? <a className={styles.directions} href={secondary.href} target={secondary.href.startsWith("http") ? "_blank" : undefined} rel={secondary.href.startsWith("http") ? "noreferrer" : undefined}>{secondary.label} <span aria-hidden="true">↗</span></a> : null}
            {site.portfolioUrl ? <a className={styles.videoLink} href={site.portfolioUrl} target="_blank" rel="noreferrer">{site.portfolioLabel || "Watch the work"} <span aria-hidden="true">↗</span></a> : null}
          </div>
          <div className={styles.contactDetails}><GooglePlaceContactDetails mapsUrl={mapsUrl} fallbackAddress={site.address} fallbackHours={site.hours} /></div>
        </section>
      </main>

      <footer className={styles.footer}><a href="#home">CH / WRAPS</a><span>{site.city}</span><span>Independent concept preview by Daniel Graviet</span></footer>
      <BusinessAction className={styles.mobileCall} label="Call CH Wraps" href={primary.href} fallbackHref={mapsUrl} showPhone />
    </div>
  );
}
