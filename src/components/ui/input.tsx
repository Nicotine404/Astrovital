import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors outline-none placeholder:text-muted-foreground/70",
        "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

function NativeSelect({ className, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-md border border-input bg-popover px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30",
        className
      )}
      {...props}
    />
  );
}

export { Input, NativeSelect };
