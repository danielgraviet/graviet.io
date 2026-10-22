import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Check,
  Gauge,
  MessageCircleMore,
  Newspaper,
  Search,
  Sparkles,
} from "lucide-react";
import GTIntakeLauncher from "@/components/gt-intake/GTIntakeLauncher";
import GTIntakePreview from "@/components/gt-intake/GTIntakePreview";
import { GTIntakeTrigger } from "@/components/gt-intake/GTIntakeTrigger";

export const metadata: Metadata = {
  title: "GT — Graviet Technologies",
  description:
    "Digital growth systems for small businesses: search visibility, AI discovery, conversion-minded websites, and dependable lead intake.",
};

const capabilities = [
  {
    title: "GT Intake assistant",
    description:
      "Give every site visitor a clear way to ask questions and send an inquiry to GT.",
    visual: "from-[#163b5f] via-[#102a43] to-[#171717]",
    icon: Bot,
  },
  {
    title: "Automated blog publishing",
    description:
      "Publish useful, search-focused articles on a consistent schedule without adding busywork.",
    visual: "from-[#3b3021] via-[#29241d] to-[#171717]",
    icon: Newspaper,
  },
  {
    title: "Lead capture and follow-up",
    description:
      "Collect the details your team needs and help every new inquiry get a timely next step.",
    visual: "from-[#253c31] via-[#1c2d25] to-[#171717]",
    icon: MessageCircleMore,
  },
  {
    title: "Website optimization",
    description:
      "Make your website faster, clearer, and easier to use so more visitors reach out.",
    visual: "from-[#3d2935] via-[#2c2028] to-[#171717]",
    icon: Gauge,
  },
  {
    title: "Search visibility",
    description:
      "Build stronger technical and local SEO foundations to help customers find your business.",
    visual: "from-[#263447] via-[#202a37] to-[#171717]",
    icon: Search,
  },
  {
    title: "AI answer visibility",
    description:
      "Organize your content so search engines and AI tools can better understand your expertise.",
    visual: "from-[#3b3520] via-[#2c291c] to-[#171717]",
    icon: Sparkles,
  },
];

const plans = [
  {
    name: "Website",
    description: "A polished, dependable home for your business online.",
    price: "$1,000",
    cadence: "one-time",
    setup: "Then $50/month for maintenance",
    features: [
      "Custom, responsive website up to 5 pages",
      "Clear service and contact paths",
      "Technical SEO and analytics setup",
      "Hosting, backups, and routine updates",
    ],
    action: "Build my website",
  },
  {
    name: "Growth",
    description: "A website and lead system that keeps improving over time.",
    price: "$1,250",
    cadence: "per month",
    setup: "$1,500 onboarding",
    features: [
      "Website build or conversion-focused refresh",
      "GT website intake assistant",
      "Lead capture and email or text follow-up",
      "2 SEO and AI-search articles published each month",
      "Monthly optimization and performance report",
    ],
    action: "Build my growth system",
    featured: true,
  },
  {
    name: "Pipeline",
    description: "A managed growth engine for businesses ready to go further.",
    price: "$3,500",
    cadence: "per month",
    setup: "$2,500 onboarding",
    features: [
      "Everything in Growth",
      "Inbound call handling and opted-in lead follow-up",
      "Up to 4 SEO and AI-search articles published each month",
      "4 edited short-form videos from your footage",
      "Monthly strategy and pipeline review",
    ],
    action: "Build my pipeline",
  },
];

const clients = [
  {
    name: "Howard, Lewis & Petersen",
    href: "https://provolawyers.com/",
  },
  {
    name: "Gunter Injury Law",
    href: "https://www.gunterinjurylaw.com/",
  },
  {
    name: "Provo Criminal Defense",
    href: "https://provocriminaldefense.com/",
  },
  {
    name: "Stratton Law Group",
    href: "https://www.strattonlawgroup.com/",
  },
  {
    name: "Ivory Dental Implant Center",
    href: "https://ivorydentalimplantcenter.com/",
  },
];

export default function GTPage() {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="gt-page mx-auto max-w-[1440px] px-5 font-sans text-white sm:px-8 lg:px-16">
        <header className="-mx-5 bg-black text-white sm:-mx-8 lg:-mx-16">
          <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between gap-3 px-5 sm:px-8 lg:px-16">
            <div className="flex min-w-0 items-center gap-3">
              <Link
                href="/gt"
                className="shrink-0 px-1 text-[1.35rem] font-semibold tracking-[-0.07em]"
                aria-label="GT home"
              >
                GT
              </Link>
              <nav
                className="flex items-center gap-1.5 text-[13px] font-medium"
                aria-label="GT navigation"
              >
                <a
                  className="rounded-full bg-[#252525] px-4 py-2.5 transition-colors hover:bg-[#363636]"
                  href="#system"
                >
                  Services
                </a>
                <a
                  className="hidden rounded-full bg-[#252525] px-4 py-2.5 transition-colors hover:bg-[#363636] md:inline-flex"
                  href="#approach"
                >
                  Our approach
                </a>
                <a
                  className="hidden rounded-full bg-[#252525] px-4 py-2.5 transition-colors hover:bg-[#363636] lg:inline-flex"
                  href="#pricing"
                >
                  Pricing
                </a>
              </nav>
            </div>
            <nav
              className="flex shrink-0 items-center gap-1.5 text-[13px] font-medium"
              aria-label="GT account navigation"
            >
              <Link
                className="hidden rounded-full px-4 py-2.5 transition-colors hover:bg-[#252525] md:inline-flex"
                href="/"
              >
                Home
              </Link>
              <GTIntakeTrigger
                entry="header"
                className="rounded-full bg-white px-5 py-2.5 text-black transition-colors hover:bg-[#e7e7e7]"
              >
                Let&apos;s talk
              </GTIntakeTrigger>
            </nav>
          </div>
          <div className="h-[3px] bg-[#00529b]" aria-hidden="true">
            <div className="mx-auto flex h-full max-w-[1440px] gap-[3px] px-5 sm:px-8 lg:px-16">
              <span className="h-full w-[3px] bg-white" />
              <span className="h-full w-[3px] bg-white" />
            </div>
          </div>
        </header>

        <section className="relative grid grid-cols-1 items-center gap-10 py-8 md:grid-cols-[1.05fr_0.95fr] md:gap-12 md:py-10 lg:gap-16">
          <div className="relative z-10 max-w-2xl">
            <h1 className="text-[clamp(3.5rem,6vw,5rem)] font-semibold leading-[0.94] tracking-[-0.075em]">
              Growth systems for small and medium-sized businesses.
            </h1>
            <p className="mt-7 max-w-lg text-lg leading-7 text-[#b3b3b3]">
              SEO, AI discovery, and intake automation help more potential
              customers find you, reach out, and become clients.
            </p>
            <GTIntakeTrigger
              entry="hero"
              className="mt-8 inline-flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-medium text-black transition-colors hover:bg-[#e7e7e7]"
            >
              Talk to GT <ArrowUpRight size={17} />
            </GTIntakeTrigger>
            <p className="mt-5 text-xs text-[#999]">
              Search visibility · AI discovery · Lead intake
            </p>
          </div>

          <GTIntakePreview />
        </section>

        <section
          aria-labelledby="clients-heading"
          className="border-y border-white/15 py-9 md:py-11"
        >
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#aaa]">
                Selected clients
              </p>
              <h2
                id="clients-heading"
                className="mt-2 text-2xl font-semibold tracking-[-0.05em]"
              >
                Teams we work with.
              </h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#999]">
              Law firms and businesses that trust GT with their digital growth.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {clients.map((client) => (
              <a
                key={client.name}
                href={client.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-20 items-center bg-black px-5 py-4 text-[15px] font-semibold leading-5 tracking-[-0.03em] text-white/80 transition-colors hover:bg-[#161616] hover:text-white"
              >
                {client.name}
                <ArrowUpRight
                  size={14}
                  className="ml-auto shrink-0 text-white/35"
                  aria-hidden="true"
                />
              </a>
            ))}
          </div>
        </section>

        <section
          id="system"
          className="scroll-mt-8 rounded-3xl bg-[#151515] px-6 py-12 sm:px-10 md:px-14 md:py-16"
        >
          <div className="mb-8 max-w-2xl">
            <h2 className="text-4xl font-semibold leading-[1] tracking-[-0.06em] sm:text-5xl">
              Explore what you can do with GT.
            </h2>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((item, index) => (
              <article
                key={item.title}
                className="group overflow-hidden rounded-2xl bg-[#242424] shadow-sm shadow-black/20 transition-colors hover:bg-[#2b2b2b]"
              >
                <GTIntakeTrigger
                  entry={`service_visual_${index + 1}`}
                  className={`relative flex h-40 w-full items-center justify-center overflow-hidden bg-gradient-to-br text-left ${item.visual}`}
                >
                  <span className="absolute -right-3 -top-12 text-[11rem] font-semibold leading-none tracking-[-0.1em] text-white/[0.04]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="absolute inset-x-8 bottom-0 h-12 rounded-t-[50%] border border-white/[0.08] bg-white/[0.03]" />
                  <span className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/15 bg-black/20 shadow-[0_18px_42px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm transition-transform duration-300 group-hover:-translate-y-1">
                    <item.icon
                      size={34}
                      strokeWidth={1.5}
                      className="text-white"
                      aria-hidden="true"
                    />
                  </span>
                  <span className="absolute bottom-3 left-4 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4d9de0]" />
                    GT systems
                  </span>
                </GTIntakeTrigger>
                <div className="p-5">
                  <GTIntakeTrigger
                    entry={`service_title_${index + 1}`}
                    className="inline-flex text-left"
                  >
                    <span
                      role="heading"
                      aria-level={3}
                      className="text-xl font-semibold tracking-[-0.04em]"
                    >
                      {item.title}
                    </span>
                  </GTIntakeTrigger>
                  <p className="mt-2 min-h-[72px] text-sm leading-6 text-[#b3b3b3]">
                    {item.description}
                  </p>
                  <GTIntakeTrigger
                    entry={`service_details_${index + 1}`}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white underline decoration-white/35 underline-offset-4 transition-colors hover:decoration-white"
                  >
                    Details <ArrowUpRight size={15} aria-hidden="true" />
                  </GTIntakeTrigger>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section
          id="approach"
          className="grid scroll-mt-8 gap-10 py-16 md:grid-cols-2 md:items-center md:py-24"
        >
          <div className="max-w-xl">
            <h2 className="text-5xl font-semibold leading-[0.98] tracking-[-0.07em] sm:text-6xl">
              We connect search, websites, and lead intake so your business can
              turn more interest into customers.
            </h2>
          </div>
          <div>
            <p className="max-w-lg text-base leading-7 text-[#b3b3b3]">
              No black boxes or borrowed playbooks. Start with your business
              goals, make the path from search to first conversation easier,
              then improve the system with clear signals and careful iteration.
            </p>
            <GTIntakeTrigger
              entry="approach"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-medium text-black transition-colors hover:bg-[#e7e7e7]"
            >
              Start a conversation <ArrowUpRight size={15} />
            </GTIntakeTrigger>
          </div>
        </section>

        <section
          id="pricing"
          className="scroll-mt-8 border-t border-white/15 py-16 md:py-24"
        >
          <div className="mb-10 max-w-2xl">
            <p className="text-sm font-medium text-[#aaa]">GT plans</p>
            <h2 className="mt-3 text-4xl font-semibold leading-[1] tracking-[-0.06em] sm:text-5xl">
              Choose how much GT takes on.
            </h2>
            <p className="mt-4 text-base leading-7 text-[#b3b3b3]">
              Start with a stronger website, then add the systems and ongoing
              work that fit your business.
            </p>
          </div>

          <div className="grid items-stretch gap-4 lg:grid-cols-3">
            {plans.map((plan) => (
              <article
                key={plan.name}
                className={`relative flex h-full flex-col rounded-2xl p-6 sm:p-7 ${
                  plan.featured
                    ? "bg-white text-black"
                    : "bg-[#191919] text-white ring-1 ring-white/10"
                }`}
              >
                {plan.featured && (
                  <span className="absolute right-5 top-5 rounded-full bg-[#00529b] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white">
                    Most popular
                  </span>
                )}
                <div>
                  <h3 className="text-xl font-semibold tracking-[-0.04em]">
                    {plan.name}
                  </h3>
                  <p
                    className={`mt-2 min-h-12 max-w-xs text-sm leading-5 ${
                      plan.featured ? "text-black/65" : "text-[#aaa]"
                    }`}
                  >
                    {plan.description}
                  </p>
                </div>
                <div className="mt-7 border-t border-current/10 pt-5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-semibold tracking-[-0.07em]">
                      {plan.price}
                    </span>
                    <span
                      className={`text-xs ${
                        plan.featured ? "text-black/55" : "text-[#999]"
                      }`}
                    >
                      {plan.cadence}
                    </span>
                  </div>
                  <p
                    className={`mt-1 text-xs ${
                      plan.featured ? "text-black/60" : "text-[#999]"
                    }`}
                  >
                    {plan.setup}
                  </p>
                </div>
                <ul className="mt-7 flex-1 space-y-3.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3 text-sm"
                    >
                      <Check
                        size={16}
                        className={`mt-0.5 shrink-0 ${
                          plan.featured ? "text-[#00529b]" : "text-[#74a9d5]"
                        }`}
                        aria-hidden="true"
                      />
                      <span
                        className={
                          plan.featured ? "text-black/80" : "text-[#d1d1d1]"
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <GTIntakeTrigger
                  entry={`pricing_${plan.name.toLowerCase()}`}
                  className={`mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-black text-white hover:bg-[#252525]"
                      : "bg-white text-black hover:bg-[#e7e7e7]"
                  }`}
                >
                  {plan.action} <ArrowUpRight size={16} aria-hidden="true" />
                </GTIntakeTrigger>
              </article>
            ))}
          </div>
          <p className="mt-5 max-w-4xl text-xs leading-5 text-[#888]">
            Plans are starting scopes and can be tailored to your business.
            Advertising spend, third-party software, call and text usage, and
            on-site video production are priced separately when needed.
          </p>
        </section>

        <footer className="flex items-center justify-between border-t border-white/15 py-6 text-sm text-[#999]">
          <Link href="/" className="transition-colors hover:text-white">
            ← Daniel Graviet
          </Link>
          <span className="font-medium text-white">
            GT / Graviet Technologies
          </span>
        </footer>
      </div>
      <GTIntakeLauncher />
    </div>
  );
}
