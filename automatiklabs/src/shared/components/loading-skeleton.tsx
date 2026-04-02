import { cn } from "@/shared/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "list" | "page" | "post" | "inline";
  className?: string;
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[2px] bg-bg-hover",
        className
      )}
    />
  );
}

function PostSkeleton() {
  return (
    <div className="border-b border-border py-5">
      <div className="mb-3 flex items-center gap-[10px]">
        <SkeletonBar className="h-8 w-8 shrink-0" />
        <div className="flex-1">
          <SkeletonBar className="mb-1 h-3.5 w-32" />
          <SkeletonBar className="h-3 w-20" />
        </div>
      </div>
      <SkeletonBar className="mb-2 h-3.5 w-full" />
      <SkeletonBar className="mb-2 h-3.5 w-4/5" />
      <SkeletonBar className="h-3.5 w-3/5" />
      <div className="mt-3 flex gap-3">
        <SkeletonBar className="h-6 w-14" />
        <SkeletonBar className="h-6 w-14" />
        <SkeletonBar className="h-6 w-14" />
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-[2px] border-2 border-border bg-bg-raised p-4">
      <SkeletonBar className="mb-2 h-3 w-16" />
      <SkeletonBar className="mb-2 h-4 w-40" />
      <SkeletonBar className="mb-3 h-3 w-full" />
      <SkeletonBar className="h-3 w-3/4" />
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-2 py-[6px]">
          <SkeletonBar className="h-4 w-6" />
          <SkeletonBar className="h-6 w-6 shrink-0" />
          <SkeletonBar className="h-3.5 w-24 flex-1" />
          <SkeletonBar className="h-3 w-12" />
        </div>
      ))}
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="w-full max-w-[680px] px-5 py-5">
      <SkeletonBar className="mb-4 h-6 w-48" />
      <div className="mb-6 flex gap-4">
        <SkeletonBar className="h-8 w-20" />
        <SkeletonBar className="h-8 w-20" />
        <SkeletonBar className="h-8 w-20" />
      </div>
      <PostSkeleton />
      <PostSkeleton />
      <PostSkeleton />
    </div>
  );
}

function InlineSkeleton() {
  return <SkeletonBar className="inline-block h-3.5 w-20" />;
}

export function LoadingSkeleton({
  variant = "post",
  className,
}: LoadingSkeletonProps) {
  const skeletons: Record<string, React.ReactNode> = {
    card: <CardSkeleton />,
    list: <ListSkeleton />,
    page: <PageSkeleton />,
    post: (
      <>
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </>
    ),
    inline: <InlineSkeleton />,
  };

  return <div className={className}>{skeletons[variant]}</div>;
}

export default LoadingSkeleton;
