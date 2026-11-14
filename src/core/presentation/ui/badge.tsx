import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/core/utils/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] font-medium whitespace-nowrap [&>svg]:size-3 shrink-0",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary/15 text-primary",
        outline: "border-border text-muted-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        nominal: "border-nominal/25 bg-nominal/10 text-nominal",
        caution: "border-caution/25 bg-caution/10 text-caution",
        critical: "border-critical/30 bg-critical/10 text-critical",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

function Badge({ className, variant, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
