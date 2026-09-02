/**
 * Record-level audit trail.
 *
 * Every pipeline stage (OCR, extraction, validation, scoring) and every human
 * action appends an immutable event here. The table is insert-only, so the
 * timeline reads as an explainable system trail rather than mutable state.
 */
import { supabase } from "@/integrations/supabase/client";

export type AuditEventType =
  | "upload"
  | "ocr"
  | "extraction"
  | "validation"
  | "score"
  | "status"
  | "officer";

export type AuditEvent = {
  id: string;
  record_id: string;
  event_type: string;
  title: string;
  detail: string | null;
  actor: string;
  before_value: string | null;
  after_value: string | null;
  confidence: number | null;
  risk_score: number | null;
  created_at: string;
};

export type NewAuditEvent = {
  record_id: string;
  event_type: AuditEventType;
  title: string;
  detail?: string | null;
  actor?: string;
  before_value?: string | null;
  after_value?: string | null;
  confidence?: number | null;
  risk_score?: number | null;
};

function toEvent(row: Record<string, unknown>): AuditEvent {
  return {
    ...(row as unknown as AuditEvent),
    confidence: row["confidence"] == null ? null : Number(row["confidence"]),
    risk_score: row["risk_score"] == null ? null : Number(row["risk_score"]),
  };
}

export async function getAuditEvents(recordId: string): Promise<AuditEvent[]> {
  const { data, error } = await supabase
    .from("audit_events")
    .select("*")
    .eq("record_id", recordId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toEvent);
}

export async function logAuditEvent(event: NewAuditEvent): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    record_id: event.record_id,
    event_type: event.event_type,
    title: event.title,
    detail: event.detail ?? null,
    actor: event.actor ?? "System",
    before_value: event.before_value ?? null,
    after_value: event.after_value ?? null,
    confidence: event.confidence ?? null,
    risk_score: event.risk_score ?? null,
  });
  if (error) throw new Error(error.message);
}

export const AUDIT_LABELS: Record<string, string> = {
  upload: "Document intake",
  ocr: "OCR",
  extraction: "Extraction",
  validation: "Validation",
  score: "Scoring",
  status: "Status change",
  officer: "Officer action",
};
