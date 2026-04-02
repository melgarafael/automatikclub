import { cn } from "@/shared/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-[2px] bg-bg-hover", className)}
      {...props}
    />
  )
}

export { Skeleton }
