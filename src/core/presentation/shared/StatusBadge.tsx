import { Badge } from "@/core/presentation/ui/badge";
import { cn } from "@/core/utils/cn";
import { STATUS_META, type ClinicalStatus } from "./status-meta";

export function StatusBadge({ status, label, className }: { status: ClinicalStatus; label?: string; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={meta.tone} className={className}>
      <Icon aria-hidden />
      {label ?? meta.label}
    </Badge>
  );
}

export function StatusDot({ status, pulse = false, className }: { status: ClinicalStatus; pulse?: boolean; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span className={cn("relative inline-flex size-2 shrink-0", className)} role="img" aria-label={meta.label}>
      {pulse && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${meta.bg}`} />}
      <span className={`relative inline-flex size-2 rounded-full ${meta.bg}`} />
    </span>
  );
}
