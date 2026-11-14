import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/status";
import type { Status } from "@/lib/data/types";

export function StatusBadge({ status, label, className }: { status: Status; label?: string; className?: string }) {
  const meta = STATUS_META[status];
  const Icon = meta.icon;
  return (
    <Badge variant={status} className={className}>
      <Icon aria-hidden />
      {label ?? meta.label}
    </Badge>
  );
}

export function StatusDot({ status, pulse = false }: { status: Status; pulse?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <span className="relative inline-flex size-2 shrink-0">
      {pulse && <span className={`absolute inline-flex size-full animate-ping rounded-full opacity-60 ${meta.bg}`} />}
      <span className={`relative inline-flex size-2 rounded-full ${meta.bg}`} />
    </span>
  );
}
