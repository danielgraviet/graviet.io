import Link from "next/link";
import { Star } from "lucide-react";
import type { Post } from "@/lib/types";
import { formatPostDate } from "@/lib/dates";

export default function BlogCard({ post }: { post: Post }) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className={`group relative block rounded-lg border p-6 transition-shadow hover:shadow-md ${
        post.featured
          ? "border-red-200 bg-red-50"
          : "border-border bg-white"
      }`}
    >
      {post.featured && (
        <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500 text-white">
          <Star className="h-4 w-4 fill-current" />
        </span>
      )}
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
