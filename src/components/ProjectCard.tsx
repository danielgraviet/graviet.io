import type { Project } from "@/lib/types";

export default function ProjectCard({ project }: { project: Project }) {
  const Wrapper = project.url ? "a" : "div";
  const linkProps = project.url
    ? { href: project.url, target: "_blank" as const, rel: "noopener noreferrer" }
    : {};

  return (
    <Wrapper
      {...linkProps}
      className="group block rounded-lg border border-border bg-white p-6 transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-xl font-semibold group-hover:text-accent">
          {project.title}
        </h3>
        {project.featured && (
          <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
            Featured
          </span>
        )}
      </div>
      <p className="mt-2 text-text-secondary leading-relaxed">
        {project.description}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary"
          >
            {tag}
          </span>
        ))}
      </div>
      {project.url && (
        <p className="mt-4 text-sm font-medium text-accent">
          View project &rarr;
        </p>
      )}
    </Wrapper>
  );
}
