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
  photos?: PlacePhoto[];
  reviews?: PlaceReview[];
  reviewSortNote?: string;
  reviewPolicyNote?: string;
};
type FallbackSummary = { rating: number; reviewCount: number; sourceUrl: string; verifiedAt?: string };
type FallbackReview = { quote: string; author: string; rating?: number; sourceUrl?: string };

const PlacesContext = createContext<PlacesContent | null>(null);

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

export function GooglePlacesGallery({ slug, businessName, fallbackMedia = [], mapsUrl }: {
  slug: string;
  businessName: string;
  fallbackMedia?: { src: string; alt: string; caption?: string; credit?: string; sourceUrl?: string }[];
  mapsUrl?: string;
}) {
  const data = useContext(PlacesContext);
  const photos = data?.photos || [];

  if (!photos.length) {
    if (!fallbackMedia.length) return null;
    return (
      <section className={styles.gallery} aria-label="Photos">
        <div className={styles.galleryHeading}><p className={styles.eyebrow}>A LITTLE LOOK AROUND</p><h2>Bring your appetite.</h2></div>
        <div className={styles.galleryGrid}>{fallbackMedia.map((item, index) => <figure className={`${styles.galleryItem} ${index === 0 ? styles.galleryLarge : ""}`} key={item.src}>
          <Image src={item.src} alt={item.alt} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 60vw" : "(max-width: 760px) 48vw, 30vw"} className={styles.galleryPhoto} />
          {item.caption ? <figcaption><span>{item.caption}</span>{item.credit ? <small>Photo: {item.credit}</small> : null}</figcaption> : null}
        </figure>)}</div>
      </section>
    );
  }

  return (
    <section className={styles.gallery} aria-label="Google Maps photos">
      <div className={styles.galleryHeading}><p className={styles.eyebrow}>FROM THE PINK AXOLOTL COMMUNITY</p><h2>A peek inside.</h2><GoogleMapsLogo dark /></div>
      <div className={styles.googlePhotoGrid}>
        {photos.slice(0, 3).map((photo, index) => {
          const author = photo.authorAttributions?.[0];
          const photoSource = photo.googleMapsUri || data?.googleMapsUri || mapsUrl || "#visit";
          const photoEndpoint = `/api/business-sites/${encodeURIComponent(slug)}/places/photo?name=${encodeURIComponent(photo.name)}`;
          return (
            <figure className={`${styles.googlePhotoCard} ${index === 0 ? styles.googlePhotoLead : ""}`} key={photo.name}>
              <a className={styles.googlePhotoLink} href={photoSource} target="_blank" rel="noreferrer" aria-label={`Open this photo of ${businessName} on Google Maps`}>
                <img className={styles.googlePhotoImage} src={photoEndpoint} alt={`${businessName} photo from Google Maps`} loading="lazy" />
              </a>
              <figcaption className={styles.googlePhotoAttribution}>
                {author?.photoUri ? <a className={styles.authorAvatar} href={author.uri || photoSource} target="_blank" rel="noreferrer"><img src={author.photoUri} alt="" loading="lazy" /></a> : null}
                <span>{author?.uri ? <a href={author.uri} target="_blank" rel="noreferrer">Photo by {author.displayName || "Google Maps contributor"}</a> : "Google Maps photo"}</span>
                <a className={styles.photoSourceLink} href={photoSource} target="_blank" rel="noreferrer">View source ↗</a>
                {photo.flagContentUri ? <a className={styles.photoReportLink} href={photo.flagContentUri} target="_blank" rel="noreferrer">Report</a> : null}
              </figcaption>
            </figure>
          );
        })}
      </div>
      <div className={styles.googlePhotoFooter}><GoogleMapsLogo dark /><a href={data?.googleMapsUri || mapsUrl || "#visit"} target="_blank" rel="noreferrer">Open Pink Axolotl on Google Maps ↗</a></div>
    </section>
  );
}
