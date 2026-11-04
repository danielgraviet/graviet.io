import type { CSSProperties, ReactNode } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/dates";
import styles from "./blog.module.css";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Blog",
};

export default async function BlogPage() {
  const posts = await getAllPosts();
  const leadPost = posts.find((post) => post.featured) ?? posts[0];
  const articles = leadPost
    ? posts.filter((post) => post._id !== leadPost._id)
    : [];

  return (
    <section className="mx-auto max-w-5xl py-2">
      <header className="mb-10 text-center md:mb-14">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
          All posts
        </p>
        <h1 className="mt-2 font-serif text-4xl tracking-tight md:text-5xl">
          Writing
        </h1>
      </header>

      {leadPost ? (
        <article className="grid overflow-hidden rounded-lg border border-border bg-background md:grid-cols-[1.15fr_1fr]">
          <div className="flex flex-col items-start p-6 md:p-8">
            <time className="font-sans text-sm text-text-secondary">
              {formatPostDate(leadPost.publishedAt)}
            </time>
            <PostLink
              post={leadPost}
              className="mt-4 text-2xl leading-tight transition-opacity hover:opacity-70 md:text-[1.7rem]"
            >
              <h2>{leadPost.title}</h2>
            </PostLink>
            {leadPost.excerpt && (
              <p className="mt-4 leading-relaxed text-text-secondary">
                {leadPost.excerpt}
              </p>
            )}
            <p className="mt-auto pt-6 font-sans text-sm text-text-secondary">
              Daniel Graviet
            </p>
          </div>

          <PostLink
            post={leadPost}
            className={`relative m-3 mt-0 block aspect-[1.55] overflow-hidden rounded md:my-3 md:ml-0 md:aspect-auto ${styles.leadVisual}`}
            ariaLabel={`Read ${leadPost.title}`}
          >
            {leadPost.coverImage ? (
              <Image
                src={leadPost.coverImage}
                alt={leadPost.coverImageAlt ?? ""}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover"
              />
            ) : (
              <TopicArtwork post={leadPost} />
            )}
          </PostLink>
        </article>
      ) : null}

      {articles.length ? (
        <section className="mt-12 md:mt-16" aria-labelledby="more-writing">
          <div className="mb-5 flex items-end justify-between">
            <h2 id="more-writing" className="font-serif text-2xl md:text-3xl">
              More writing
            </h2>
          </div>
          <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((post, index) => (
              <li
                key={post._id}
                className={`${styles.card} transition-shadow hover:shadow-md`}
                style={{ "--card-delay": `${Math.min(index * 40, 240)}ms` } as CSSProperties}
              >
                <PostLink post={post} className="group flex h-full flex-col">
                  <div className={`relative aspect-[1.6] overflow-hidden rounded-t-lg bg-muted ${styles.cardVisual}`}>
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.coverImageAlt ?? ""}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    ) : (
                      <TopicArtwork post={post} />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <time className="font-sans text-xs text-text-secondary">
                      {formatPostDate(post.publishedAt)}
                    </time>
                    <h3 className="mt-3 text-xl leading-snug transition-opacity group-hover:opacity-70">
                      {post.title}
                    </h3>
                    {post.excerpt && (
                      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-text-secondary">
                        {post.excerpt}
                      </p>
                    )}
                  </div>
                </PostLink>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </section>
  );
}

function PostLink({
  post,
  className,
  children,
  ariaLabel,
}: {
  post: Post;
  className: string;
      children: ReactNode;
  ariaLabel?: string;
}) {
  if (post.externalUrl) {
    return (
      <a href={post.externalUrl} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}

function TopicArtwork({ post }: { post: Post }) {
  return (
    <div className="lab-grid flex h-full w-full items-center justify-center px-5 text-center">
      <span className="font-sans text-sm font-medium tracking-wide text-text-secondary">
        {post.tags[0] ?? "Writing"}
      </span>
    </div>
  );
}
