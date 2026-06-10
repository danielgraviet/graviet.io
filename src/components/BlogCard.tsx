import Link from "next/link";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/dates";

export default function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block rounded-lg border border-border bg-white p-6 transition-shadow hover:shadow-md"
    >
      <time className="text-sm text-text-secondary">
        {formatPostDate(post.publishedAt)}
      </time>
      <h3 className="mt-2 text-xl group-hover:text-accent">
        {post.title}
      </h3>
      <p className="mt-2 text-text-secondary leading-relaxed">{post.excerpt}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {post.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
    </Link>
  );
}
