import type { NewsletterWithMeta } from "../types";
import { NewsletterCard } from "./newsletter-card";
import { EmptyState } from "@/shared/components/empty-state";

interface NewsletterArchiveProps {
  newsletters: NewsletterWithMeta[];
}

export function NewsletterArchive({ newsletters }: NewsletterArchiveProps) {
  if (newsletters.length === 0) {
    return (
      <EmptyState
        title="Nenhuma edicao publicada"
        description="As edicoes da newsletter aparecerao aqui assim que forem enviadas."
      />
    );
  }

  return (
    <div className="space-y-3">
      {newsletters.map((newsletter) => (
        <NewsletterCard key={newsletter.id} newsletter={newsletter} />
      ))}
    </div>
  );
}

export default NewsletterArchive;
