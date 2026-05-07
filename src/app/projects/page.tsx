import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

const projects: Project[] = [
    {
    _id: "annex",
    title: "Annex",
    description:
      "A validation landing page for a curated network of extraordinary industrial and commercial workspaces. Annex helps startups and growing businesses discover flexible space inside hangars, warehouses, workshops, and industrial campuses built for teams doing real work.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS", "Landing Page", "Marketplace"],
    featured: true,
  },
  {
    _id: "topprompt",
    title: "TopPrompt",
    description:
      "A platform for developers to discover, rank, and share battle-tested AI prompts. Engineered as a Turborepo monorepo featuring a Next.js web application and a Plasmo Chrome extension, powered by PostgreSQL and Drizzle ORM.",
    tags: ["Next.js", "TypeScript", "PostgreSQL", "Plasmo", "Turborepo"],
    featured: true,
  },
  {
    _id: "ohsheet",
    title: "OhSheet",
    description:
      "An automation service that synchronizes upcoming Canvas assignments into a single, collaborative Google Sheet. Powered by a Python/FastAPI backend with Redis, and features a React/Vite frontend for streamlined setup.",
    tags: ["Python", "FastAPI", "React", "Redis", "Google Sheets API"],
    featured: true,
  },
  {
    _id: "thread-pool",
    title: "Thread Pool Management System",
    description:
      "A custom C++20 thread pool implementation built from scratch as a systems programming learning project. Features a thread-safe task queue, worker thread management, and concurrent execution using modern concurrency primitives.",
    tags: ["C++20", "CMake", "Concurrency", "Systems Programming"],
    featured: true,
  },
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
