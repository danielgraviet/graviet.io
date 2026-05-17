import type { Metadata } from "next";
import Image from "next/image";
import {
  Cpu,
  GraduationCap,
  Globe,
  Code,
  XCircle,
  Briefcase,
  BookOpen,
  Tv,
  Brain,
  FlaskConical,
} from "lucide-react";
import { type LucideIcon } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
};

const timeline: { year: string; event: string; Icon: LucideIcon }[] = [
  {
    year: "~2019",
    Icon: Cpu,
    event:
      "Built a mini Arduino project with my brother-in-law Josh Greaves — my first taste of programming and the joy of creating something interactive that others could use.",
  },
  {
    year: "2021",
    Icon: GraduationCap,
    event:
      "Arrived at BYU as a freshman studying Computer Science. Took my first CS class with Dr. Nancy Fulda, learning C++, and fell in love with programming and debugging (except memory leaks).",
  },
  {
    year: "2022–2024",
    Icon: Globe,
    event:
      "Served a two-year mission in Vietnam. Stepped away from coding, but returned more interested — especially with the rise of large language models.",
  },
  {
    year: "Fall 2024",
    Icon: Code,
    event:
      "Back at BYU. Started learning React via an online course by Mosh, explored HTML and CSS, and dove into back-end programming as I entered my sophomore year.",
  },
  {
    year: "Winter 2024",
    Icon: XCircle,
    event:
      "Applied for a web dev role at BYU's College of Humanities — wore a tie, built a personal site, practiced my pitch. Got rejected. It pushed me to find better opportunities on my own.",
  },
  {
    year: "Sept. 2024",
    Icon: Briefcase,
    event:
      "Met Jake Gunter and became lead web developer for Howard Lewis & Peterson, Gunter Injury Law, and Provo Criminal Defense. Learned PHP for real-world apps, SEO, and performance optimization.",
  },
  {
    year: "2024–2025",
    Icon: BookOpen,
    event:
      "Sophomore year at BYU. Took CS235 and CS240 (Software Design), deepening my skills in Java and TypeScript.",
  },
  {
    year: "Summer 2025",
    Icon: Tv,
    event:
      "Interned at BLERP, a Twitch-associated company. Worked with GraphQL and JavaScript, building data pipelines that affected real streamers. Learned a ton from Aaron Hsu and Derek Omori.",
  },
  {
    year: "Fall 2025",
    Icon: Brain,
    event:
      "Machine learning internship at Martian in San Francisco. Helped build data pipelines replicating popular ML benchmarks (HumanEval, MBPP, ARC-AGI). Learned from engineers from Google DeepMind, Meta, Snorkel, Telcoin, and UPenn.",
  },
  {
    year: "Winter 2025–Present",
    Icon: FlaskConical,
    event:
      "Junior year at BYU. Became a research assistant in Dr. David Wingate's PCCL lab, currently working on a WhatsApp LLM integration and a project called EVO.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
      <section className="grid gap-10 md:grid-cols-[1fr_2fr]">
        {/* Photo */}
        <div className="relative aspect-square overflow-hidden rounded-xl">
          <Image
            src="/portrait.webp"
            alt="Daniel Graviet"
            fill
            className="object-cover"
          />
        </div>

        <div className="space-y-4 leading-relaxed text-text-secondary">
          <p>
            Thanks for visiting my website. I'm a CS student at BYU interested
            in the systems side of machine learning. Specifically how frontier
            models are built, served, and made faster in production.
          </p>
          <p>
            I got here by trying a lot of things first. Early on I built with
            PHP, did some SEO, learned frontend, picked up GraphQL, and messed
            around with Arduino projects. That breadth eventually pointed me
            toward what really interests me: understanding what's happening
            underneath the abstraction.
          </p>
          <p>
            Right now I'm focused on ML infrastructure. Things like CPU/GPU
            optimization, inference efficiency, and the systems that make models
            work at scale. I've found that the most interesting problems for me
            are between how a model is built and how it runs. Still learning,
            but that's the niche I'm going deep on.
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="mt-16">
        <h3 className="mb-6 text-2xl">Timeline</h3>
        <ol className="space-y-6 border-l-2 border-border pl-6">
          {timeline.map((item) => (
            <li key={item.year} className="relative">
              <span className="absolute -left-[1.85rem] top-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-border">
                <item.Icon className="h-3 w-3 text-foreground" />
              </span>
              <span className="text-sm font-semibold text-accent">
                {item.year}
              </span>
              <p className="text-text-secondary">{item.event}</p>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
