"use client";

import { useState } from "react";
import type { Project } from "@/lib/types";

export default function ProjectRow({ project }: { project: Project }) {
  const [hovered, setHovered] = useState(false);

  const content = (
    <div
      className="group border-b border-border py-6 cursor-pointer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="flex items-baseline justify-between">
        <h3 className="text-3xl transition-colors group-hover:text-accent md:text-5xl">
          {project.title}
        </h3>
        {project.url && (
          <span className="text-sm font-medium text-text-secondary transition-opacity group-hover:opacity-100 opacity-0">
            View &rarr;
          </span>
        )}
      </div>
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{
          maxHeight: hovered ? "120px" : "0px",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "translateY(0)" : "translateY(-8px)",
        }}
      >
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-secondary">
          {project.description}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-sm font-medium text-accent"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  if (project.url) {
    return (
      <a href={project.url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return content;
}
