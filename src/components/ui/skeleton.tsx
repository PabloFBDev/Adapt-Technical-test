import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "relative overflow-hidden bg-accent rounded-md",
        "after:absolute after:inset-0 after:animate-shimmer",
        "after:bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.08),transparent)]",
        "after:bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
