import * as React from "react"

import { cn } from "@/shared/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-[2px] border-2 border-border bg-bg-inset px-3 py-1 font-body text-[13px] text-text-1 transition-[color,border-color] duration-[80ms] outline-none placeholder:text-text-3 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "focus-visible:border-blue focus-visible:shadow-[0_0_0_2px_var(--color-blue-dim)]",
        className
      )}
      {...props}
    />
  )
}

export { Input }
