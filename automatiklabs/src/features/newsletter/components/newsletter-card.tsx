import Link from "next/link";
import type { NewsletterWithMeta } from "../types";

interface NewsletterCardProps {
  newsletter: NewsletterWithMeta;
}

export function NewsletterCard({ newsletter }: NewsletterCardProps) {
  const sentDate = newsletter.sent_at
    ? new Date(newsletter.sent_at).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : null;

  // Generate a preview from HTML content
  const preview = newsletter.content_html
    ? newsletter.content_html
        .replace(/<[^>]+>/g, "")
        .slice(0, 160)
        .trim() + "..."
    : null;

  return (
    <Link href={`/newsletter/${newsletter.slug}`} className="group block">
      <article className="rounded-[2px] border-2 border-border bg-bg-raised p-4 transition-all duration-[80ms] group-hover:border-blue group-hover:-translate-y-px group-hover:shadow-[2px_2px_0_rgba(0,0,0,0.4)]">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[16px] font-bold tracking-[-0.03em] text-text-1 group-hover:text-blue">
              {newsletter.title}
            </h3>
            {sentDate && (
              <span className="shrink-0 font-mono text-[11px] text-text-3">
                {sentDate}
              </span>
            )}
          </div>

          {preview && (
            <p className="line-clamp-2 text-[13px] leading-[1.6] text-text-2">
              {preview}
            </p>
          )}

          {newsletter.author_name && (
            <p className="font-mono text-[11px] text-text-3">
              por {newsletter.author_name}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}

export default NewsletterCard;
