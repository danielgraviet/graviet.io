import SectionHeading from "@/components/SectionHeading";
import BlogCard from "@/components/BlogCard";
import ProjectCard from "@/components/ProjectCard";
import { getLatestPosts } from "@/lib/sanity.queries";
import { getAllProjects } from "@/lib/sanity.queries";

export default async function Home() {
  const [posts, projects] = await Promise.all([
    getLatestPosts(3),
    getAllProjects(),
  ]);

  const featuredProjects = projects.filter((p) => p.featured);

  return (
    <>
      {/* Hero */}
      <section className="py-12 text-center">
        <h1 className="font-serif text-5xl font-bold leading-tight">
          Hey, I&apos;m <span className="text-accent">Graviet</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-text-secondary">
          Developer, tinkerer, and lifelong learner. I build things for the web
          and write about what I discover along the way.
        </p>
      </section>

      {/* Latest Posts */}
      <section className="py-12">
        <SectionHeading
          title="Latest Posts"
          subtitle="Recent thoughts and tutorials"
        />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post._id} post={post} />
          ))}
        </div>
      </section>

      {/* Featured Projects */}
      <section className="py-12">
        <SectionHeading
          title="Featured Projects"
          subtitle="A few things I've been working on"
        />
        <div className="grid gap-6 sm:grid-cols-2">
          {featuredProjects.map((project) => (
            <ProjectCard key={project._id} project={project} />
          ))}
        </div>
      </section>
    </>
  );
}
