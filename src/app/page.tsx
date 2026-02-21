import Link from "next/link";
import ProjectRow from "@/components/ProjectRow";
import RiceTerraces from "@/components/RiceTerraces";
import { getLatestPosts } from "@/lib/sanity.queries";
import { getAllProjects } from "@/lib/sanity.queries";

export default async function Home() {
  const [posts, projects] = await Promise.all([
    getLatestPosts(3),
    getAllProjects(),
  ]);

  return (
    <>
      {/* Hero */}
      <section className="relative flex h-[calc(100vh-5rem)] flex-col items-center justify-center overflow-hidden">
        <div className="relative z-10 flex items-center gap-4 rounded-full border border-border bg-background/80 px-8 py-4 backdrop-blur-sm">
          <span className="relative flex h-4 w-4 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-4 w-4 rounded-full bg-green-500" />
          </span>
          <span className="text-base font-medium text-foreground">
            Currently: EVO research project @ BYU PCCL
          </span>
        </div>
        <RiceTerraces className="pointer-events-none absolute bottom-0 left-0 w-full text-foreground" />
      </section>

      {/* About / Intro */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-12 md:grid-cols-2 md:items-start md:px-6 md:py-24">
        <h2 className="text-4xl font-bold leading-tight tracking-tight md:text-5xl">
          I explore new technologies through projects and write about what I discover.
        </h2>
        <div className="flex items-start">
          <p className="text-sm leading-relaxed text-text-secondary">
            I love meeting new people, learning new things, and building impactful products. Right now, I'm focused on large-scale distributed systems, but I'm always excited to explore new domains and technologies.
          </p>
        </div>
      </section>

      {/* Project Gallery */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-24">
        <p className="mb-8 text-xs uppercase tracking-[0.2em] text-text-secondary">
          Selected Projects
        </p>
        <div className="border-t border-border">
          {projects.map((project) => (
            <ProjectRow key={project._id} project={project} />
          ))}
        </div>
      </section>

      {/* Latest Posts */}
      <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 md:py-24">
        <p className="mb-8 text-xs uppercase tracking-[0.2em] text-text-secondary">
          Latest Posts
        </p>
        <div className="border-t border-border">
          {posts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group flex items-baseline justify-between border-b border-border py-4 transition-colors hover:text-accent"
            >
              <span className="text-sm font-medium">{post.title}</span>
              <time className="shrink-0 text-xs text-text-secondary">
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </Link>
          ))}
        </div>
      </section>
    </>
  );
}
