import type { Metadata } from "next";
import { WhyUsSection } from "@/components/home/why-us-section";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { JsonLd } from "@/components/shared/json-ld";
import {
  faqPageSchema,
  breadcrumbSchema,
  jsonLdGraph,
} from "@/lib/seo/schemas";
import { BRAND_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description: `The story behind ${BRAND_NAME} — thoughtfully wrapped gifts, delivered with a little extra love. Delivery, wrapping, gift notes, and returns explained.`,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    title: `About · ${BRAND_NAME}`,
    description: `The story behind ${BRAND_NAME} — thoughtfully wrapped gifts.`,
    url: "/about",
  },
};

// FAQs power a FAQPage JSON-LD block below — the AEO/GEO surface most
// likely to be cited verbatim by AI answer engines.
const FAQS = [
  {
    q: "How fast is delivery?",
    a: "Most orders ship the next business day. At checkout you'll see an estimated arrival window for your address. Same-day delivery is available on selected products in most metro areas when ordered before the daily cut-off.",
  },
  {
    q: "Is gift wrapping really free?",
    a: "Yes, always. Every order is hand-tied and finished with a ribbon at no extra cost — it's the whole point of Lavisk.",
  },
  {
    q: "Can I add a personal note?",
    a: "Yes. There's a gift-note field at checkout, and we tuck a handwritten-style card inside the box before it ships.",
  },
  {
    q: "What's your returns policy?",
    a: "If something isn't right, reach out within 14 days of delivery and we'll make it right with a replacement or a full refund.",
  },
  {
    q: "Does Lavisk offer corporate gifting?",
    a: "Yes. We work with teams on curated multi-tier boxes, personalized notes, and redeem-your-own gift links. Contact the corporate desk via our contact page for a quote.",
  },
  {
    q: "Where does Lavisk deliver?",
    a: "We ship across India nationwide, with same-day delivery in select metros. International shipping is available on selected products at checkout.",
  },
];

export default function AboutPage() {
  const graph = jsonLdGraph([
    faqPageSchema(FAQS.map((f) => ({ question: f.q, answer: f.a }))),
    breadcrumbSchema([
      { name: "Home", href: "/" },
      { name: "About", href: "/about" },
    ]),
  ]);

  return (
    <div className="mx-auto max-w-[1440px] px-5 pb-16 md:px-8">
      <JsonLd data={graph} />
      <PageHeader
        eyebrow="Our story"
        title="Gifts that feel like a hug"
        subtitle={`${BRAND_NAME} started with a simple idea: giving should feel as good as getting. We curate small-batch, beautifully made things and wrap every one by hand.`}
      />

      <Reveal className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
        {[
          {
            title: "Curated, never mass-produced",
            body: "We work with small makers and independent studios, so every gift feels considered — not generic.",
          },
          {
            title: "Wrapped by real hands",
            body: "No machine folds these boxes. Each one is tied, ribboned and finished by our studio team.",
          },
          {
            title: "Delivered with care",
            body: "From the peonies cut that morning to the note tucked inside, the details are the whole gift.",
          },
        ].map((item) => (
          <div key={item.title} className="rounded-[24px] bg-white p-7 shadow-soft">
            <h3 className="font-display text-xl font-bold">{item.title}</h3>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{item.body}</p>
          </div>
        ))}
      </Reveal>

      <WhyUsSection />

      <section id="faq" className="mt-16 scroll-mt-24">
        <Reveal>
          <h2 className="mb-6 font-display text-[clamp(28px,4vw,40px)] font-bold tracking-[-0.03em]">
            Frequently asked
          </h2>
        </Reveal>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {FAQS.map((faq) => (
            <Reveal key={faq.q} className="rounded-[24px] bg-white p-6 shadow-soft">
              <h3 className="font-display text-lg font-bold">{faq.q}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted">{faq.a}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
