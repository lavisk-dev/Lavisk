import Link from "next/link";
import { Reveal } from "@/components/shared/reveal";
import { BlogCard } from "@/components/blog/blog-card";
import { ArrowRight } from "lucide-react";
import type { BlogPost } from "@/lib/types";

interface JournalSectionProps {
  posts: BlogPost[];
}

export function JournalSection({ posts }: JournalSectionProps) {
  if (posts.length === 0) return null;
  const [featured, ...rest] = posts;
  const secondary = rest.slice(0, 2);

  return (
    <section
      id="journal"
      aria-labelledby="journal-heading"
      className="mt-16 rounded-[34px] bg-white/70 px-6 py-14 shadow-soft backdrop-blur md:mt-24 md:px-14 md:py-20"
    >
      <Reveal className="mb-10 flex flex-col items-start justify-between gap-4 md:mb-14 md:flex-row md:items-end">
        <div>
          <div className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-brand">
            The Journal
          </div>
          <h2
            id="journal-heading"
            className="max-w-2xl font-display text-[clamp(28px,3.5vw,44px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink"
          >
            Field notes on giving — <span className="italic text-brand">and giving well.</span>
          </h2>
        </div>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 rounded-full border border-brand/30 px-5 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand/5"
        >
          Read all articles <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Reveal delay={0.05} className="md:col-span-2">
          <BlogCard post={featured} featured />
        </Reveal>
        <div className="grid gap-6">
          {secondary.map((post, i) => (
            <Reveal key={post.id} delay={0.1 + i * 0.06}>
              <BlogCard post={post} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
