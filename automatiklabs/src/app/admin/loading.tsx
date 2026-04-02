import { LoadingSkeleton } from "@/shared/components/loading-skeleton";

export default function AdminLoading() {
  return (
    <div className="w-full max-w-[960px] px-5 py-5">
      <LoadingSkeleton variant="page" />
    </div>
  );
}
