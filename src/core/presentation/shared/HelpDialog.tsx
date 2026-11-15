"use client";

import type * as React from "react";
import { CircleHelp } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/core/presentation/ui/dialog";
import { cn } from "@/core/utils/cn";

/** Small "?" button that opens a guide. Content-agnostic: features pass the sections. */
export function HelpDialog({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Guía: ${title}`}
          className={cn(
            "inline-grid size-5 shrink-0 cursor-pointer place-items-center rounded-full text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50",
            className
          )}
        >
          <CircleHelp className="size-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="space-y-4 text-[13.5px] leading-relaxed">{children}</div>
      </DialogContent>
    </Dialog>
  );
}

/** One labelled block inside a HelpDialog. */
export function HelpSection({ icon: Icon, heading, children }: { icon?: React.ElementType; heading: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-1">
      <h3 className="flex items-center gap-1.5 text-[12px] font-medium tracking-wide text-muted-foreground uppercase">
        {Icon && <Icon className="size-3.5" />}
        {heading}
      </h3>
      <div>{children}</div>
    </section>
  );
}
