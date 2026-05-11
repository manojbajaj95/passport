import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border bg-clip-padding text-[14px] font-bmw-display font-bold uppercase tracking-[1.5px] whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "border-transparent bg-foreground text-background hover:bg-foreground/90",
        outline:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        secondary:
          "border-transparent bg-surface-card text-foreground hover:bg-surface-card/80",
        ghost:
          "border-transparent hover:bg-surface-elevated hover:text-foreground",
        destructive:
          "border-transparent bg-m-red text-foreground hover:bg-m-red/80",
        link: "border-transparent text-foreground underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-12 px-8 gap-2",
        xs: "h-8 px-4 gap-1.5 text-xs",
        sm: "h-10 px-6 gap-2 text-[12px]",
        lg: "h-14 px-10 gap-2",
        icon: "size-12 rounded-full", // Exception for icon buttons
        "icon-xs": "size-8 rounded-full",
        "icon-sm": "size-10 rounded-full",
        "icon-lg": "size-14 rounded-full",
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
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
