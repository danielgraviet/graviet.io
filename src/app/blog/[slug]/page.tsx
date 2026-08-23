import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getAllSlugs } from "@/lib/posts";
import { formatPostDate } from "@/lib/dates";
import MarkdownRenderer from "@/components/MarkdownRenderer";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const slugs = await getAllSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 md:px-6">
      <header className="mb-8">
        <time className="text-sm text-text-secondary">
          {formatPostDate(post.publishedAt)}
        </time>
        <h1 className="mt-2 text-3xl leading-tight md:text-4xl">
          {post.title}
        </h1>
      </header>

      {post.body && <MarkdownRenderer html={post.body} />}
    </article>
  );
}
