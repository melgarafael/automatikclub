import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/utils"

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-[2px] border border-transparent px-[6px] py-[2px] font-mono text-[10px] font-medium whitespace-nowrap tracking-[0.03em] transition-[color,box-shadow] duration-[80ms] [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "bg-blue-dim text-blue",
        admin:
          "bg-[rgba(240,160,48,0.12)] text-amber",
        contrib:
          "bg-cyan-dim text-cyan",
        mod:
          "bg-[rgba(61,220,132,0.12)] text-green",
        ai:
          "bg-violet-dim text-violet border-[rgba(155,114,255,0.2)]",
        pro:
          "bg-blue-dim text-blue",
        destructive:
          "bg-[rgba(239,83,80,0.12)] text-red",
        outline:
          "border-border text-text-2",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
