import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/shared/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[2px] font-body text-[13px] font-medium whitespace-nowrap transition-all duration-[80ms] ease-linear outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-blue text-black border-none hover:shadow-[0_0_0_4px_var(--color-blue-dim)]",
        destructive:
          "bg-red text-white hover:shadow-[0_0_0_4px_rgba(239,83,80,0.15)]",
        outline:
          "border-2 border-border bg-transparent text-text-2 hover:bg-bg-hover hover:text-text-1",
        ghost:
          "border-2 border-border bg-transparent text-text-2 hover:bg-bg-hover hover:text-text-1",
        link: "text-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-[14px] py-[6px]",
        xs: "h-6 gap-1 px-2 text-[11px]",
        sm: "h-8 gap-1.5 px-3",
        lg: "h-10 px-6",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
