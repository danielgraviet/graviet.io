import type { Metadata } from "next";
import type { CSSProperties } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getBusinessSite, getBusinessSiteSlugs } from "@/lib/business-sites";

export const dynamicParams = false;

export async function generateStaticParams() {
  return (await getBusinessSiteSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) return { title: "Business website preview", robots: { index: false, follow: false } };

  return {
    title: `${site.name} | Website Preview`,
    description: site.intro,
    robots: { index: false, follow: false },
  };
}

function telephoneHref(phone?: string) {
  return phone ? `tel:${phone.replace(/[^+\d]/g, "")}` : undefined;
}

export default async function BusinessDemoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const site = await getBusinessSite(slug);
  if (!site) notFound();

  const accent = site.accentColor || "#176b58";
  const phoneHref = telephoneHref(site.phone);

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#1f2925]" style={{ "--business-accent": accent } as CSSProperties}>
      <div className="bg-[#202722] px-4 py-2 text-center font-sans text-xs text-white/80">
        Website concept prepared for {site.name} · Preview only
      </div>
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-5 md:px-8">
        <a href="#home" className="font-sans text-lg font-bold tracking-tight" style={{ color: accent }}>{site.name}</a>
        <nav className="hidden gap-7 font-sans text-sm text-[#52605a] md:flex">
          <a href="#services" className="hover:text-black">Services</a>
          {site.hours?.length ? <a href="#hours" className="hover:text-black">Hours</a> : null}
          <a href="#contact" className="hover:text-black">Contact</a>
        </nav>
        {phoneHref ? <a href={phoneHref} className="rounded-full px-5 py-2.5 font-sans text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Call {site.phone}</a> : null}
      </header>

      <section id="home" className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1fr_0.88fr] md:px-8 md:pb-28 md:pt-16">
        <div>
          <p className="mb-5 font-sans text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>{site.category}</p>
          <h1 className="max-w-2xl text-5xl leading-[1.04] tracking-tight md:text-7xl">{site.headline}</h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#59645e]">{site.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {phoneHref ? <a href={phoneHref} className="rounded-full px-6 py-3 font-sans text-sm font-semibold text-white" style={{ backgroundColor: accent }}>Call {site.name}</a> : null}
            {site.googleMapsUrl ? <a href={site.googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-full border border-[#d8ddd8] px-6 py-3 font-sans text-sm font-semibold">Get directions</a> : null}
          </div>
        </div>
        <div className="relative min-h-[300px] overflow-hidden rounded-[2rem] bg-[#e5e9e2] md:min-h-[460px]">
          {site.heroImage ? <Image src={site.heroImage} alt={`${site.name}`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 45vw" /> : <div className="flex h-full min-h-[300px] items-end p-8 md:min-h-[460px]"><span className="max-w-xs text-3xl leading-tight text-[#718078]">A welcoming place, right in your neighborhood.</span></div>}
        </div>
      </section>

      {site.highlights?.length ? <section className="border-y border-[#e6e8e2] bg-white"><div className="mx-auto grid max-w-6xl gap-5 px-5 py-8 font-sans text-sm font-medium text-[#52605a] sm:grid-cols-3 md:px-8">{site.highlights.map((item) => <p key={item} className="text-center">{item}</p>)}</div></section> : null}

      <section id="services" className="mx-auto max-w-6xl px-5 py-20 md:px-8 md:py-28">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em]" style={{ color: accent }}>What we do</p>
        <h2 className="mt-3 text-4xl tracking-tight md:text-5xl">How we can help</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {site.services.map((service, index) => <article key={service.name} className="rounded-3xl border border-[#e6e8e2] bg-white p-7 md:p-9">
            <span className="font-sans text-xs font-bold" style={{ color: accent }}>0{index + 1}</span>
            <h3 className="mt-4 text-2xl">{service.name}</h3>
            {service.description ? <p className="mt-3 max-w-lg leading-7 text-[#647069]">{service.description}</p> : null}
          </article>)}
        </div>
      </section>

      <section id="contact" className="bg-[#202722] text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:px-8 md:py-20">
          <div><p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/55">Visit or get in touch</p><h2 className="mt-4 text-4xl tracking-tight md:text-5xl">We’re here to help.</h2>
            <div className="mt-8 space-y-3 font-sans text-sm text-white/75">
              {site.address ? <p>{site.address}</p> : null}
              {site.phone ? <p><a href={phoneHref}>{site.phone}</a></p> : null}
              {site.email ? <p><a href={`mailto:${site.email}`}>{site.email}</a></p> : null}
            </div>
          </div>
          <div id="hours" className="md:justify-self-end md:min-w-72"><h3 className="font-sans text-sm font-semibold">Hours</h3>
            {site.hours?.length ? <ul className="mt-4 space-y-2 font-sans text-sm text-white/70">{site.hours.map((hour) => <li key={hour}>{hour}</li>)}</ul> : <p className="mt-4 font-sans text-sm text-white/60">Call for current hours.</p>}
            {site.googleMapsUrl ? <a href={site.googleMapsUrl} target="_blank" rel="noreferrer" className="mt-7 inline-flex rounded-full bg-white px-5 py-3 font-sans text-sm font-semibold text-[#202722]">Open in Maps</a> : null}
          </div>
        </div>
        <footer className="border-t border-white/10 px-5 py-5 text-center font-sans text-xs text-white/45">{site.name} · Website concept by Daniel Graviet</footer>
      </section>
    </main>
  );
}
