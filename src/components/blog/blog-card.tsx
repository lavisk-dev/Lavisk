import Link from "next/link";
import Image from "next/image";
import { Clock } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { BlogPost } from "@/lib/types";

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

export function BlogCard({ post, featured = false }: BlogCardProps) {
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-soft transition-all duration-500 hover:-translate-y-1 hover:shadow-card"
    >
      <div
        className="relative aspect-[16/10] w-full overflow-hidden"
        style={{
          background: `linear-gradient(150deg,${post.coverColorFrom},${post.coverColorTo})`,
        }}
      >
        {post.coverImageUrl ? (
          <Image
            src={post.coverImageUrl}
            alt={post.title}
            fill
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-[80px] transition-transform duration-700 group-hover:scale-110 md:text-[110px]">
            <span aria-hidden>{post.coverEmoji}</span>
          </div>
        )}
        <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-brand backdrop-blur">
          {post.category}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        <h3
          className={
            featured
              ? "font-display text-2xl font-bold leading-tight text-ink md:text-3xl"
              : "font-display text-lg font-bold leading-snug text-ink md:text-xl"
          }
        >
          {post.title}
        </h3>
        <p className="line-clamp-2 text-sm text-muted md:text-base">{post.excerpt}</p>
        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted">
          <span className="font-semibold text-ink">{post.authorName}</span>
          <span className="flex items-center gap-3">
            <span>{formatDate(post.publishedAt)}</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {post.readingMinutes} min
            </span>
          </span>
        </div>
      </div>
    </Link>
  );
}
