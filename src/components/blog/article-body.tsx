import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ArticleBodyProps {
  content: string;
  className?: string;
}

/**
 * Renders the mini-markdown format used in blog-data.ts: `## heading`,
 * `### subheading`, `**bold**`, `_italic_`, and paragraph breaks on
 * blank lines. Kept intentionally tiny — swap for react-markdown if
 * long-form editorial ever needs full markdown support.
 */
export function ArticleBody({ content, className }: ArticleBodyProps) {
  const blocks = content
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-5 text-lg leading-relaxed text-ink/85", className)}>
      {blocks.map((block, i) => {
        if (block.startsWith("### ")) {
          return (
            <h3 key={i} className="mt-8 font-display text-xl font-bold text-ink">
              {block.slice(4)}
            </h3>
          );
        }
        if (block.startsWith("## ")) {
          return (
            <h2 key={i} className="mt-10 font-display text-2xl font-extrabold text-ink md:text-3xl">
              {block.slice(3)}
            </h2>
          );
        }
        if (block.startsWith("- ")) {
          const items = block.split("\n").map((line) => line.replace(/^-\s+/, ""));
          return (
            <ul key={i} className="ml-5 list-disc space-y-1.5 text-ink/85">
              {items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-ink/85">
            {renderInline(block)}
          </p>
        );
      })}
    </div>
  );
}

// Very small inline formatter for **bold** and _italic_ within a paragraph.
function renderInline(text: string) {
  const segments: ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|_([^_]+)_)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index));
    if (match[2]) {
      segments.push(
        <strong key={key++} className="font-bold text-ink">
          {match[2]}
        </strong>
      );
    } else if (match[3]) {
      segments.push(
        <em key={key++} className="italic">
          {match[3]}
        </em>
      );
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  return segments;
}
