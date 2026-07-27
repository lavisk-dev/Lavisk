import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Reveal } from "@/components/shared/reveal";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  hideBack?: boolean;
}

export function PageHeader({ eyebrow, title, subtitle, hideBack }: PageHeaderProps) {
  return (
    <Reveal className="pt-28 md:pt-32">
      {!hideBack && (
        <Link
          href="/"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm font-medium text-muted transition hover:text-brand"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to home
        </Link>
      )}
      {eyebrow && (
        <div className="mb-2 text-sm font-semibold uppercase tracking-[0.28em] text-brand">
          {eyebrow}
        </div>
      )}
      <h1 className="font-display text-[clamp(36px,5vw,60px)] font-extrabold leading-[1.02] tracking-[-0.03em] text-ink">
        {title}
      </h1>
      {subtitle && <p className="mt-4 max-w-xl text-lg text-muted">{subtitle}</p>}
    </Reveal>
  );
}
