import { LoadingSkeleton } from "@/shared/components/loading-skeleton";

export default function MarketplaceLoading() {
  return (
    <div className="w-full max-w-[680px] px-5 py-5">
      <div className="mb-6 grid grid-cols-2 gap-3">
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    </div>
  );
}
