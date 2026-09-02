import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronRight,
  FileScan,
  FileText,
  Gavel,
  History,
  ScanLine,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type ComponentType } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AUDIT_LABELS, getAuditEvents, type AuditEvent } from "@/lib/audit";
import { cn } from "@/lib/utils";

const STYLES: Record<
  string,
  { icon: ComponentType<{ className?: string }>; dot: string; chip: string }
> = {
  upload: { icon: FileText, dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  ocr: { icon: ScanLine, dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  extraction: { icon: FileScan, dot: "bg-primary", chip: "bg-primary/10 text-primary" },
  validation: { icon: ShieldCheck, dot: "bg-warning", chip: "bg-warning/15 text-warning-foreground" },
  score: {
    icon: SlidersHorizontal,
    dot: "bg-accent-foreground",
    chip: "bg-muted text-muted-foreground",
  },
  status: { icon: History, dot: "bg-accent-foreground", chip: "bg-muted text-muted-foreground" },
  officer: { icon: Gavel, dot: "bg-success", chip: "bg-success/15 text-success" },
};

function styleFor(type: string) {
  return STYLES[type] ?? STYLES["status"]!;
}

function TimelineRow({ event }: { event: AuditEvent }) {
  const [open, setOpen] = useState(false);
  const style = styleFor(event.event_type);
  const Icon = style.icon;
  const hasDetail = Boolean(
    event.detail || event.before_value || event.after_value || event.confidence != null,
  );

  return (
    <li className="relative pl-10">
      <span
        className={cn(
          "absolute left-[9px] top-1 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-white",
          style.dot,
        )}
      >
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="rounded-md border border-border bg-card px-3 py-2">
        <button
          type="button"
          onClick={() => hasDetail && setOpen((value) => !value)}
          className="flex w-full items-start justify-between gap-3 text-left"
        >
          <span>
            <span className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium">{event.title}</span>
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                  style.chip,
                )}
              >
                {AUDIT_LABELS[event.event_type] ?? event.event_type}
              </span>
            </span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">
              {new Date(event.created_at).toLocaleString()} · {event.actor}
            </span>
          </span>
          {hasDetail &&
            (open ? (
              <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            ))}
        </button>

        {open && hasDetail && (
          <div className="mt-2 space-y-2 border-t border-border pt-2 text-xs text-muted-foreground">
            {event.detail && <p className="leading-relaxed">{event.detail}</p>}
            {(event.before_value || event.after_value) && (
              <p>
                {event.before_value && (
                  <>
                    <span className="font-medium text-foreground">Before:</span>{" "}
                    {event.before_value}
                    {event.after_value ? " → " : ""}
                  </>
                )}
                {event.after_value && (
                  <>
                    <span className="font-medium text-foreground">After:</span> {event.after_value}
                  </>
                )}
              </p>
            )}
            {(event.confidence != null || event.risk_score != null) && (
              <p>
                Snapshot:{" "}
                {event.confidence != null ? `${Math.round(event.confidence)}% confidence` : "—"}
                {event.risk_score != null ? ` · risk ${Math.round(event.risk_score)}/100` : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

export function AuditTimeline({ recordId }: { recordId: string }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["audit", recordId],
    queryFn: () => getAuditEvents(recordId),
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <History className="h-4 w-4 text-primary" /> Audit Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading the record history…</p>
        ) : events.length === 0 ? (
          <div className="rounded-md border border-dashed border-border p-6 text-center">
            <History className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm font-medium">No audit events yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Processing stages and officer actions for this record will be listed here in order.
            </p>
          </div>
        ) : (
          <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[9px] before:top-2 before:w-px before:bg-border">
            {events.map((event) => (
              <TimelineRow key={event.id} event={event} />
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
