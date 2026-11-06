import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SEO_PAGES, seoPage } from "@/lib/seo";

export const dynamicParams = false;
export const generateStaticParams = () => SEO_PAGES.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const p = seoPage((await params).slug);
  return p ? { title: `${p.title} · Umless`, description: p.intro, alternates: { canonical: `/${p.slug}` } } : {};
}

export default async function SeoLanding({ params }: { params: Promise<{ slug: string }> }) {
  const p = seoPage((await params).slug);
  if (!p) notFound();
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: p.faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      <h1>{p.h1}</h1>
      <p className="lead">{p.intro}</p>
      <div className="row" style={{ margin: "28px 0" }}>
        <a className="btn" href="/um-score">Try it free</a>
        <a className="btn ghost" href="/#pricing">Pricing</a>
      </div>
      <div className="ba">
        <div><span className="tag">Before</span><video src="/demo/before.mp4" controls preload="metadata" /></div>
        <div><span className="tag hot">After</span><video src="/demo/after-cut.mp4" controls preload="metadata" /></div>
      </div>
      <h2>Why this is a pain</h2>
      <p className="muted">{p.pain}</p>
      <h2>How it works</h2>
      <div className="grid">
        {p.steps.map(([t, d], i) => (
          <div key={t} className="card"><span className="tag">{i + 1}</span><h3 style={{ marginTop: 8 }}>{t}</h3><p className="muted">{d}</p></div>
        ))}
      </div>
      <h2>Questions</h2>
      {p.faq.map(([q, a]) => (
        <details key={q}><summary>{q}</summary><p className="muted">{a}</p></details>
      ))}
      <h2>More tools</h2>
      <ul>
        {SEO_PAGES.filter((x) => x.slug !== p.slug).map((x) => (
          <li key={x.slug}><a href={`/${x.slug}`}>{x.h1}</a></li>
        ))}
      </ul>
    </>
  );
}
