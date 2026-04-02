import { LoadingSkeleton } from "@/shared/components/loading-skeleton";

export default function NewsletterLoading() {
  return (
    <div className="w-full max-w-[680px] px-5 py-5">
      <LoadingSkeleton variant="card" />
    </div>
  );
}
