"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import styles from "./business-demo.module.css";

type Attribution = { displayName?: string; uri?: string; photoUri?: string };
type PlacePhoto = {
  name: string;
  googleMapsUri?: string;
  flagContentUri?: string;
  authorAttributions?: Attribution[];
};
type PlaceReview = {
  rating?: number;
  text?: { text?: string };
  relativePublishTimeDescription?: string;
  googleMapsUri?: string;
  flagContentUri?: string;
  authorAttribution?: Attribution;
};
type PlacesContent = {
  rating?: number;
  reviewCount?: number;
  googleMapsUri?: string;
  formattedAddress?: string;
  phoneNumber?: string;
  weekdayHours?: string[];
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  reviewSortNote?: string;
  reviewPolicyNote?: string;
};
type FallbackSummary = { rating: number; reviewCount: number; sourceUrl: string; verifiedAt?: string };
type FallbackReview = { quote: string; author: string; rating?: number; sourceUrl?: string };

const PlacesContext = createContext<PlacesContent | null>(null);

function useGooglePhoto(slug: string, photoName?: string) {
  const [imageUrl, setImageUrl] = useState<string>();
  useEffect(() => {
    if (!photoName) { setImageUrl(undefined); return; }
    const controller = new AbortController();
    let objectUrl: string | undefined;
    setImageUrl(undefined);
    fetch(`/api/business-sites/${encodeURIComponent(slug)}/places/photo`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoName }),
      cache: "no-store",
      signal: controller.signal,
    }).then((response) => response.ok ? response.blob() : null)
      .then((blob) => {
        if (!blob) return;
        objectUrl = URL.createObjectURL(blob);
        setImageUrl(objectUrl);
      }).catch(() => undefined);
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [slug, photoName]);
  return imageUrl;
}

export function BusinessAction({ label, href, fallbackHref, className }: {
  label: string;
  href: string;
  fallbackHref?: string;
  className: string;
}) {
  const data = useContext(PlacesContext);
  const placePhone = data?.phoneNumber ? `tel:${data.phoneNumber.replace(/[^0-9+]/g, "")}` : undefined;
  const targetHref = href === "place-phone" ? placePhone || fallbackHref || "#visit" : href;
  const external = targetHref.startsWith("http");
  return <a className={className} href={targetHref} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined}>{label}<span aria-hidden="true">↗</span></a>;
}

export function GooglePlacesProvider({
  slug,
  placeId,
  initialSummary,
  initialReviews,
  children,
}: {
  slug: string;
  placeId?: string;
  initialSummary?: FallbackSummary;
  initialReviews?: FallbackReview[];
  children: ReactNode;
}) {
  const [data, setData] = useState<PlacesContent | null>(() => initialSummary ? {
    rating: initialSummary.rating,
    reviewCount: initialSummary.reviewCount,
    googleMapsUri: initialSummary.sourceUrl,
    reviews: initialReviews?.map((review) => ({
      rating: review.rating,
      text: { text: review.quote },
      googleMapsUri: review.sourceUrl || initialSummary.sourceUrl,
      authorAttribution: { displayName: review.author },
    })),
  } : null);

  useEffect(() => {
    if (!placeId) return;
    const controller = new AbortController();
    fetch(`/api/business-sites/${encodeURIComponent(slug)}/places`, { cache: "no-store", signal: controller.signal })
      .then((response) => response.ok ? response.json() : null)
      .then((places: PlacesContent | null) => { if (places) setData(places); })
      .catch(() => undefined);
    return () => controller.abort();
  }, [slug, placeId]);

  return <PlacesContext.Provider value={data}>{children}</PlacesContext.Provider>;
}

function GoogleMapsLogo({ dark = false }: { dark?: boolean }) {
  return <Image src={dark ? "/business-sites/shared/google-maps-dark.png" : "/business-sites/shared/google-maps-white.png"} width={98} height={18} alt="Google Maps" className={styles.googleLogo} />;
}

export function GooglePlacesHero({ slug, businessName, fallbackImage, alt, fallbackCredit, fallbackSource }: {
  slug: string;
  businessName: string;
  fallbackImage?: string;
  alt: string;
  fallbackCredit?: string;
  fallbackSource?: string;
}) {
  const data = useContext(PlacesContext);
  const photo = data?.photos?.[0];
  const imageUrl = useGooglePhoto(slug, photo?.name);
  if (!photo || !imageUrl) {
    return <>
      {fallbackImage ? <Image src={fallbackImage} alt={alt} fill priority sizes="(max-width: 760px) 92vw, 48vw" className={styles.heroPhoto} /> : null}
      {fallbackCredit ? fallbackSource ? <a className={styles.photoCredit} href={fallbackSource} target="_blank" rel="noreferrer">Photo: {fallbackCredit}</a> : <span className={styles.photoCredit}>Artwork: {fallbackCredit}</span> : null}
    </>;
  }

  const author = photo.authorAttributions?.[0];
  const source = photo.googleMapsUri || data?.googleMapsUri || "#visit";
  return <>
    <img className={styles.heroPhoto} src={imageUrl} alt={`${businessName} photo shared on Google Maps`} fetchPriority="high" />
    <div className={styles.heroGoogleAttribution}>
      <GoogleMapsLogo />
      {author?.photoUri ? <a className={styles.authorAvatar} href={author.uri || source} target="_blank" rel="noreferrer"><img src={author.photoUri} alt="" /></a> : null}
      <span>{author?.uri ? <a href={author.uri} target="_blank" rel="noreferrer">Photo by {author.displayName || "Google Maps contributor"}</a> : "Google Maps photo"}</span>
      <a className={styles.heroPhotoSource} href={source} target="_blank" rel="noreferrer">View source ↗</a>
      {photo.flagContentUri ? <a className={styles.heroPhotoReport} href={photo.flagContentUri} target="_blank" rel="noreferrer">Report</a> : null}
    </div>
  </>;
}

function GooglePhotoCard({ photo, businessName, source, slug, lead }: {
  photo: PlacePhoto;
  businessName: string;
  source: string;
  slug: string;
  lead: boolean;
}) {
  const author = photo.authorAttributions?.[0];
  const imageUrl = useGooglePhoto(slug, photo.name);
  return (
    <figure className={`${styles.googlePhotoCard} ${lead ? styles.googlePhotoLead : ""}`}>
      <a className={styles.googlePhotoLink} href={source} target="_blank" rel="noreferrer" aria-label={`Open this photo of ${businessName} on Google Maps`}>
        {imageUrl ? <img className={styles.googlePhotoImage} src={imageUrl} alt={`${businessName} photo from Google Maps`} loading="lazy" /> : null}
      </a>
      <figcaption className={styles.googlePhotoAttribution}>
        {author?.photoUri ? <a className={styles.authorAvatar} href={author.uri || source} target="_blank" rel="noreferrer"><img src={author.photoUri} alt="" loading="lazy" /></a> : null}
        <span>{author?.uri ? <a href={author.uri} target="_blank" rel="noreferrer">Photo by {author.displayName || "Google Maps contributor"}</a> : "Google Maps photo"}</span>
        <a className={styles.photoSourceLink} href={source} target="_blank" rel="noreferrer">View source ↗</a>
        {photo.flagContentUri ? <a className={styles.photoReportLink} href={photo.flagContentUri} target="_blank" rel="noreferrer">Report</a> : null}
      </figcaption>
    </figure>
  );
}

function stars(rating: number) {
  return <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>★★★★★</span>;
}

function shortQuote(value: string) {
  const text = value.replace(/\s+/g, " ").trim();
  const firstSentence = text.match(/^.{1,220}?[.!?](?:\s|$)/)?.[0]?.trim() || text;
  const words = firstSentence.split(/\s+/);
  if (words.length <= 22) return firstSentence;
  return `${words.slice(0, 22).join(" ").replace(/[.,;:]$/, "")}…`;
}

export function GoogleReviewProof({
  initialSummary,
  mapsUrl,
}: {
  initialSummary?: FallbackSummary;
  mapsUrl?: string;
}) {
  const data = useContext(PlacesContext);
  const rating = data?.rating ?? initialSummary?.rating;
  const count = data?.reviewCount ?? initialSummary?.reviewCount;
  const source = data?.googleMapsUri || initialSummary?.sourceUrl || mapsUrl || "#reviews";
  const review = data?.reviews?.[0];
  const quote = review?.text?.text ? shortQuote(review.text.text) : undefined;
  const author = review?.authorAttribution?.displayName;
  const authorUri = review?.authorAttribution?.uri;

  if (!rating || !count) return null;

  return (
    <div className={styles.proofCard}>
      <a className={styles.proofCardLink} href={source} target="_blank" rel="noreferrer" aria-label="Open Google Maps reviews">
      <span className={styles.proofTop}><GoogleMapsLogo dark /><span>{stars(rating)} REVIEWS</span></span>
      <span className={styles.proofScore}>{rating}<small>/5</small></span>
      <span className={styles.proofBottom}>{count} public reviews <span aria-hidden="true">↗</span></span>
      </a>
      {quote ? <span className={styles.proofQuote}>“{quote}”<small>— {authorUri ? <a href={authorUri} target="_blank" rel="noreferrer">{author || "Google reviewer"}</a> : author || "Google reviewer"}</small></span> : null}
    </div>
  );
}

export function GoogleReviewSection({
  fallbackReviews = [],
  fallbackSummary,
  mapsUrl,
}: {
  fallbackReviews?: FallbackReview[];
  fallbackSummary?: FallbackSummary;
  mapsUrl?: string;
}) {
  const data = useContext(PlacesContext);
  const liveReviews = data?.reviews?.length ? data.reviews : null;
  const reviews: PlaceReview[] = liveReviews || fallbackReviews.map((review) => ({
    rating: review.rating,
    text: { text: review.quote },
    googleMapsUri: review.sourceUrl || fallbackSummary?.sourceUrl || mapsUrl,
    authorAttribution: { displayName: review.author },
  }));
  const source = data?.googleMapsUri || fallbackSummary?.sourceUrl || mapsUrl || "#visit";
  const rating = data?.rating ?? fallbackSummary?.rating;
  const count = data?.reviewCount ?? fallbackSummary?.reviewCount;

  if (!reviews.length) return null;

  return (
    <section id="reviews" className={styles.reviewBand}>
      <div className={styles.reviewIntro}>
        <p className={styles.eyebrow}>KIND WORDS, STRAIGHT FROM GOOGLE</p>
        <h2>Don’t just take our word for it.</h2>
        {rating && count ? <p>{rating} average from {count} public reviews.</p> : null}
        <a className={styles.seeAllReviews} href={source} target="_blank" rel="noreferrer">Read all reviews on Google Maps ↗</a>
      </div>
      <div className={styles.reviewList}>
        {reviews.slice(0, 2).map((review, index) => {
          const author = review.authorAttribution;
          const quote = review.text?.text ? shortQuote(review.text.text) : "";
          const reviewUrl = review.googleMapsUri || source;
          return (
            <figure className={styles.reviewCard} key={`${author?.displayName || "review"}-${index}`}>
              {stars(review.rating || 5)}
              <blockquote>“{quote}”</blockquote>
              <figcaption>
                <span className={styles.reviewAuthor}>
                  {author?.photoUri ? <img src={author.photoUri} alt="" loading="lazy" /> : null}
                  {author?.uri ? <a href={author.uri} target="_blank" rel="noreferrer">{author.displayName || "Google reviewer"}</a> : <span>{author?.displayName || "Google reviewer"}</span>}
                  {review.relativePublishTimeDescription ? <small>{review.relativePublishTimeDescription}</small> : null}
                </span>
                <span className={styles.reviewLinks}><a href={reviewUrl} target="_blank" rel="noreferrer">View review ↗</a>{review.flagContentUri ? <a href={review.flagContentUri} target="_blank" rel="noreferrer">Report</a> : null}</span>
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className={styles.googleDisclosure}>
        <GoogleMapsLogo />
        <span>Short excerpts are shown; open each source for the full review. {data?.reviewSortNote || "Reviews are ordered by relevance."} {data?.reviewPolicyNote || "Google checks reviews for policy violations and removes fake content when it is identified; reviews are not verified by Google."}</span>
      </div>
    </section>
  );
}

export function GooglePlacesGallery({ slug, businessName, fallbackMedia = [], mapsUrl, eyebrow, heading, heroUsesPlacePhoto = false }: {
  slug: string;
  businessName: string;
  fallbackMedia?: { src: string; alt: string; caption?: string; credit?: string; sourceUrl?: string }[];
  mapsUrl?: string;
  eyebrow?: string;
  heading?: string;
  heroUsesPlacePhoto?: boolean;
}) {
  const data = useContext(PlacesContext);
  const photos = (data?.photos || []).slice(heroUsesPlacePhoto ? 1 : 0, heroUsesPlacePhoto ? 4 : 3);

  if (!photos.length) {
    if (!fallbackMedia.length) return null;
    return (
      <section className={styles.gallery} aria-label="Photos">
        <div className={styles.galleryHeading}><p className={styles.eyebrow}>{eyebrow || "A closer look"}</p><h2>{heading || `Get to know ${businessName}.`}</h2></div>
        <div className={styles.galleryGrid}>{fallbackMedia.map((item, index) => <figure className={`${styles.galleryItem} ${index === 0 ? styles.galleryLarge : ""}`} key={item.src}>
          <Image src={item.src} alt={item.alt} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 60vw" : "(max-width: 760px) 48vw, 30vw"} className={styles.galleryPhoto} />
          {item.caption ? <figcaption><span>{item.caption}</span>{item.credit ? <small>Photo: {item.credit}</small> : null}</figcaption> : null}
        </figure>)}</div>
      </section>
    );
  }

  return (
    <section className={styles.gallery} aria-label="Google Maps photos">
      <div className={styles.galleryHeading}><p className={styles.eyebrow}>{eyebrow || `FROM THE ${businessName.toUpperCase()} COMMUNITY`}</p><h2>{heading || "A look around."}</h2><GoogleMapsLogo dark /></div>
      <div className={styles.googlePhotoGrid}>
        {photos.map((photo, index) => {
          const photoSource = photo.googleMapsUri || data?.googleMapsUri || mapsUrl || "#visit";
          return <GooglePhotoCard key={photo.name} photo={photo} businessName={businessName} source={photoSource} slug={slug} lead={index === 0 && photos.length > 1} />;
        })}
      </div>
      <div className={styles.googlePhotoFooter}><GoogleMapsLogo dark /><a href={data?.googleMapsUri || mapsUrl || "#visit"} target="_blank" rel="noreferrer">Open {businessName} on Google Maps ↗</a></div>
    </section>
  );
}

export function GooglePlaceContactDetails({ mapsUrl, fallbackAddress, fallbackHours }: {
  mapsUrl?: string;
  fallbackAddress?: string;
  fallbackHours?: string[];
}) {
  const data = useContext(PlacesContext);
  const address = data?.formattedAddress || fallbackAddress;
  const hours = data?.weekdayHours || fallbackHours;
  const phone = data?.phoneNumber;
  const source = data?.googleMapsUri || mapsUrl;

  return <div className={styles.hoursCard}>
    <h3>Visit & contact</h3>
    {address ? <p>{address}</p> : null}
    {phone ? <p><a href={`tel:${phone.replace(/[^0-9+]/g, "")}`}>{phone}</a></p> : null}
    {hours?.length ? <ul>{hours.map((hour) => <li key={hour}>{hour}</li>)}</ul> : null}
    {source ? <div className={styles.placeDetailsSource}><GoogleMapsLogo dark /><a href={source} target="_blank" rel="noreferrer">Current details on Google Maps ↗</a></div> : null}
  </div>;
}
