import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

const projects: Project[] = [
  {
    _id: "helix",
    title: "Helix",
    description:
      "Self-extending AI agent that identifies missing capabilities and writes, containerizes, and deploys its own microservices. Features a Skill Factory using FastAPI and Jinja2 with a multi-provider agent loop and Telegram bot for real-time task management.",
    tags: ["Python", "Docker", "FastAPI", "Anthropic API", "Pydantic"],
    featured: true,
  },
  {
    _id: "code-quintet",
    title: "Code Quintet",
    description:
      "LLM ensemble system that generates five distinct code variants for a single task and benchmarks them in parallel using Daytona sandboxes against HumanEval datasets. Includes a Variant Marketplace for hot-swapping prompt strategies.",
    tags: ["Python", "Daytona SDK", "OpenAI API", "HumanEval"],
    featured: true,
  },
  {
    _id: "polysandbox",
    title: "PolySandbox",
    description:
      "Backend-agnostic API to run and evaluate code across Daytona, E2B, and Docker through a single interface. Features a normalization layer for cross-sandbox metrics and a Streamlit dashboard for visual benchmarking.",
    tags: ["FastAPI", "Streamlit", "Docker", "E2B", "Daytona"],
    featured: true,
  },
  {
    _id: "infertrace",
    title: "infertrace",
    description:
      "High-throughput monitoring layer for ML models inspired by distributed tracing systems like Jaeger. Uses Go and gRPC for low-latency telemetry with a Go-Python bridge for seamless data science integration.",
    tags: ["Go", "gRPC", "Python"],
    featured: true,
  },
];

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">
      <SectionHeading title="Projects" subtitle="Things I've built" />
      <div className="grid gap-6 sm:grid-cols-2">
        {projects.map((project) => (
          <ProjectCard key={project._id} project={project} />
        ))}
      </div>
    </div>
  );
}
