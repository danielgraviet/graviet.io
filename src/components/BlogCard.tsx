import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/dates";

export default function BlogCard({ post }: { post: Post }) {
  const className =
    "group relative flex flex-col gap-2 border border-border bg-background px-5 py-4 transition-colors hover:border-foreground sm:flex-row sm:items-baseline sm:justify-between sm:gap-8";

  const cardContent = (
    <>
      <div className="min-w-0 flex-1">
        <h3 className="text-lg leading-snug group-hover:opacity-70">{post.title}</h3>
        {post.excerpt && (
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {post.excerpt}
          </p>
        )}
      </div>
      <time className="shrink-0 text-sm text-text-secondary">
        {formatPostDate(post.publishedAt)}
      </time>
    </>
  );

  if (post.externalUrl) {
    return (
      <a href={post.externalUrl} className={className}>
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className={className}>
      {cardContent}
    </Link>
  );
}
