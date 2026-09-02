/**
 * Data access layer for land records. All queries are parameterized through
 * the Supabase client (no string-concatenated SQL anywhere in the app).
 */
import { supabase } from "@/integrations/supabase/client";

import { logAuditEvent } from "./audit";
import type { LandRecord, OfficerDecision } from "./pipeline/types";

function toRecord(row: Record<string, unknown>): LandRecord {
  return {
    ...(row as unknown as LandRecord),
    area: row["area"] == null ? null : Number(row["area"]),
    confidence: Number(row["confidence"] ?? 0),
    risk_score: Number(row["risk_score"] ?? 0),
    flags: Array.isArray(row["flags"]) ? (row["flags"] as string[]) : [],
  };
}

export async function getAllRecords(): Promise<LandRecord[]> {
  const { data, error } = await supabase
    .from("land_records")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toRecord);
}

export async function getRecordById(id: string): Promise<LandRecord | null> {
  const { data, error } = await supabase.from("land_records").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toRecord(data) : null;
}

/** Search by owner name, survey number, village or district. */
export async function searchRecords(term: string): Promise<LandRecord[]> {
  const clean = term.trim().replace(/[%,()]/g, "");
  if (!clean) return getAllRecords();
  const { data, error } = await supabase
    .from("land_records")
    .select("*")
    .or(
      [
        `owner.ilike.%${clean}%`,
        `survey_no.ilike.%${clean}%`,
        `village.ilike.%${clean}%`,
        `district.ilike.%${clean}%`,
      ].join(","),
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toRecord);
}

export async function getDecisions(recordId: string): Promise<OfficerDecision[]> {
  const { data, error } = await supabase
    .from("officer_decisions")
    .select("*")
    .eq("record_id", recordId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OfficerDecision[];
}

export async function getAllDecisions(): Promise<OfficerDecision[]> {
  const { data, error } = await supabase
    .from("officer_decisions")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as OfficerDecision[];
}

export type Decision = "Approve" | "Request Manual Review" | "Reject";

const DECISION_TO_STATUS: Record<Decision, string> = {
  Approve: "Approved",
  "Request Manual Review": "Review Required",
  Reject: "Rejected",
};

/** Human-in-the-loop: records are only ever approved by an officer. */
export async function recordOfficerDecision(
  recordId: string,
  decision: Decision,
  notes?: string,
  officerName = "Demo Officer",
): Promise<void> {
  const previous = await getRecordById(recordId);

  const { error: decisionError } = await supabase.from("officer_decisions").insert({
    record_id: recordId,
    decision,
    notes: notes?.trim() || null,
    officer_name: officerName,
  });
  if (decisionError) throw new Error(decisionError.message);

  const { error } = await supabase
    .from("land_records")
    .update({ verification_status: DECISION_TO_STATUS[decision] })
    .eq("id", recordId);
  if (error) throw new Error(error.message);

  await logAuditEvent({
    record_id: recordId,
    event_type: "officer",
    title: `Officer decision: ${decision}`,
    detail:
      notes?.trim() ||
      `${officerName} recorded the decision "${decision}", overriding or confirming the AI recommendation "${previous?.ai_recommendation ?? "None"}".`,
    actor: officerName,
    before_value: previous?.verification_status ?? null,
    after_value: DECISION_TO_STATUS[decision],
    confidence: previous?.confidence ?? null,
    risk_score: previous?.risk_score ?? null,
  });
}

export type DashboardStats = {
  total: number;
  verified: number;
  reviewRequired: number;
  anomalies: number;
  approved: number;
  rejected: number;
  highRisk: number;
  byStatus: { name: string; value: number }[];
  byRisk: { name: string; value: number }[];
  anomalyTypes: { name: string; value: number }[];
  verifiedVsReview: { name: string; value: number }[];
};

const ANOMALY_MATCHERS: { name: string; test: RegExp }[] = [
  { name: "Missing field", test: /mandatory field/i },
  { name: "Owner mismatch", test: /owner name similarity|registered to/i },
  { name: "Area mismatch", test: /area differs/i },
  { name: "Duplicate", test: /duplicate/i },
  { name: "Low OCR confidence", test: /ocr confidence/i },
];

export function buildStats(records: LandRecord[]): DashboardStats {
  const verified = records.filter((r) => r.verification_status === "Verified").length;
  const approved = records.filter((r) => r.verification_status === "Approved").length;
  const rejected = records.filter((r) => r.verification_status === "Rejected").length;
  const reviewRequired = records.filter((r) => r.verification_status === "Review Required").length;
  const anomalies = records.filter((r) => r.flags.length > 0).length;
  const highRisk = records.filter((r) => r.risk_score >= 60).length;

  const statusCounts = new Map<string, number>();
  for (const r of records) statusCounts.set(r.status, (statusCounts.get(r.status) ?? 0) + 1);

  const anomalyCounts = ANOMALY_MATCHERS.map(({ name, test }) => ({
    name,
    value: records.reduce((sum, r) => sum + (r.flags.some((f) => test.test(f)) ? 1 : 0), 0),
  })).filter((entry) => entry.value > 0);

  return {
    total: records.length,
    verified,
    reviewRequired,
    anomalies,
    approved,
    rejected,
    highRisk,
    byStatus: [...statusCounts].map(([name, value]) => ({ name, value })),
    byRisk: [
      { name: "Low (0-29)", value: records.filter((r) => r.risk_score < 30).length },
      { name: "Medium (30-59)", value: records.filter((r) => r.risk_score >= 30 && r.risk_score < 60).length },
      { name: "High (60+)", value: highRisk },
    ],
    anomalyTypes: anomalyCounts,
    verifiedVsReview: [
      { name: "Verified / Approved", value: verified + approved },
      { name: "Review Required", value: reviewRequired },
      { name: "Rejected", value: rejected },
    ],
  };
}
