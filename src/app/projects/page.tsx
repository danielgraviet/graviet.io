import type { Metadata } from "next";
import SectionHeading from "@/components/SectionHeading";
import ProjectCard from "@/components/ProjectCard";
import type { Project } from "@/lib/types";

export const metadata: Metadata = {
  title: "Projects",
};

const projects: Project[] = [
  {
    _id: "silicon-sampling",
    title: "Silicon Sampling",
    description:
      "TruckMind is a fully autonomous AI agent that launches and operates a pop-up food truck business from zero. Given a concept, it researches the market, builds a menu, sets prices, serves customers, and adapts in real time—with no human in the loop.",
    tags: ["Winner", "AI Agents", "Automation", "Hackathon", "Food Tech"],
    url: "https://lnkd.in/p/gtRvksTM",
    featured: false,
  },
  {
    _id: "go-explore-coding-agents",
    title: "Go-Explore Applied to Coding Agents",
    description:
      "Current research applying Go-Explore to coding agents by treating sandboxes as a search space. Uses snapshotting to preserve and branch from promising states, supporting more effective RL search under fixed token budgets.",
    tags: ["Research", "Go-Explore", "Coding Agents", "Reinforcement Learning", "Sandboxes", "Snapshotting"],
    url: "https://arxiv.org/abs/1901.10995",
    featured: false,
  },
  {
    _id: "rl-rollout-infrastructure-evaluation",
    title: "RL Rollout Infrastructure Evaluation",
    description:
      "Research project evaluating coding-agent RL rollouts across Amazon EC2, AWS Fargate, Docker, and sandbox environments. Characterized latency tradeoffs and scaling laws at scale, then identified optimizations such as warm pools and pre-cached images to reduce rollout overhead.",
    tags: ["Research", "Reinforcement Learning", "Coding Agents", "EC2", "Fargate", "Docker", "Sandboxes"],
    url: "https://www.daytona.io/dotfiles/the-hidden-infrastructure-tax-in-coding-agent-rl",
    featured: false,
  },
  {
    _id: "annex",
    title: "Annex",
    description:
      "A validation landing page for a curated network of extraordinary industrial and commercial workspaces. Annex helps startups and growing businesses discover flexible space inside hangars, warehouses, workshops, and industrial campuses built for teams doing real work.",
    tags: ["Proof of Concept", "Next.js", "TypeScript", "Tailwind CSS", "Landing Page", "Marketplace"],
    featured: false,
  },
  {
    _id: "topprompt",
    title: "TopPrompt",
    description:
      "A platform for developers to discover, rank, and share battle-tested AI prompts. Engineered as a Turborepo monorepo featuring a Next.js web application and a Plasmo Chrome extension, powered by PostgreSQL and Drizzle ORM.",
    tags: ["Proof of Concept", "Next.js", "TypeScript", "PostgreSQL", "Plasmo", "Turborepo"],
    featured: false,
  },
  {
    _id: "ohsheet",
    title: "OhSheet",
    description:
      "A student tool used by 15 people that synchronizes upcoming Canvas assignments into a single, collaborative Google Sheet. Powered by a Python/FastAPI backend with Redis, and features a React/Vite frontend for streamlined setup.",
    tags: ["Student Tool", "Python", "FastAPI", "React", "Redis", "Google Sheets API"],
    url: "https://github.com/danielgraviet/ohsheet",
    featured: false,
  },
  {
    _id: "thread-pool",
    title: "Thread Pool Management System",
    description:
      "A custom C++20 thread pool implementation built from scratch as a systems programming learning project. Features a thread-safe task queue, worker thread management, and concurrent execution using modern concurrency primitives.",
    tags: ["Learning Project", "C++20", "CMake", "Concurrency", "Systems Programming"],
    featured: false,
  },
  {
    _id: "helix",
    title: "Helix",
    description:
      "Self-extending AI agent that identifies missing capabilities and writes, containerizes, and deploys its own microservices. Features a Skill Factory using FastAPI and Jinja2 with a multi-provider agent loop and Telegram bot for real-time task management.",
    tags: ["Winner"],
    featured: false,
  },
  {
    _id: "code-quintet",
    title: "Code Quintet",
    description:
      "LLM ensemble system that generates five distinct code variants for a single task and benchmarks them in parallel using Daytona sandboxes against HumanEval datasets. Includes a Variant Marketplace for hot-swapping prompt strategies.",
    tags: ["Winner"],
    url: "https://devpost.com/software/code-quintet",
    featured: false,
  },
  {
    _id: "polysandbox",
    title: "PolySandbox",
    description:
      "Backend-agnostic API to run and evaluate code across Daytona, E2B, and Docker through a single interface. Features a normalization layer for cross-sandbox metrics and a Streamlit dashboard for visual benchmarking.",
    tags: ["Winner"],
    url: "https://devpost.com/software/polysandbox",
    featured: false,
  },
  {
    _id: "infertrace",
    title: "infertrace",
    description:
      "High-throughput monitoring layer for ML models inspired by distributed tracing systems like Jaeger. Uses Go and gRPC for low-latency telemetry with a Go-Python bridge for seamless data science integration.",
    tags: ["Learning Project", "Go", "gRPC", "Python"],
    featured: false,
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
