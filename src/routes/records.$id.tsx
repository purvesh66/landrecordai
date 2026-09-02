import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ExternalLink } from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AuditTimeline } from "@/components/audit-timeline";
import { ExportReportButton } from "@/components/export-report-button";
import { ExplainPanel } from "@/components/explain-panel";
import { ConfidenceMeter, RiskMeter, StatusBadge } from "@/components/indicators";
import { OfficerActions } from "@/components/officer-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { nameSimilarity } from "@/lib/pipeline/fuzzy";
import { getAllRecords, getDecisions, getRecordById } from "@/lib/records";
import { getDocumentUrl } from "@/lib/upload.functions";

export const Route = createFileRoute("/records/$id")({
  head: () => ({
    meta: [
      { title: "Land Record Detail — Land Record AI" },
      {
        name: "description",
        content:
          "Full record view: OCR text, extracted fields, explainable anomaly flags, confidence, risk score and the officer verification trail.",
      },
      { property: "og:title", content: "Land Record Detail — Land Record AI" },
      {
        property: "og:description",
        content: "Explainable AI flags and officer verification for a single land record.",
      },
    ],
  }),
  component: RecordDetail,
});

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-md border border-border px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={value ? "font-medium" : "font-medium text-destructive"}>
        {value ?? "Missing"}
      </p>
    </div>
  );
}

function RecordDetail() {
  const { id } = Route.useParams();
  const { data: record, isLoading } = useQuery({
    queryKey: ["record", id],
    queryFn: () => getRecordById(id),
  });
  const { data: decisions = [] } = useQuery({
    queryKey: ["decisions", id],
    queryFn: () => getDecisions(id),
  });
  const { data: allRecords = [] } = useQuery({ queryKey: ["records"], queryFn: getAllRecords });
  const signUrl = useServerFn(getDocumentUrl);
  const openDoc = useMutation({
    mutationFn: (path: string) => signUrl({ data: { path } }),
    onSuccess: (url) => {
      if (url) window.open(url, "_blank", "noopener");
    },
  });

  if (isLoading) {
    return (
      <AppShell title="Land Record">
        <p className="text-sm text-muted-foreground">Loading record…</p>
      </AppShell>
    );
  }
  if (!record) {
    return (
      <AppShell title="Record not found">
        <p className="text-sm text-muted-foreground">
          This record no longer exists.{" "}
          <Link to="/records" className="text-primary underline">
            Back to the register
          </Link>
        </p>
      </AppShell>
    );
  }

  const related = allRecords.filter(
    (other) => other.id !== record.id && other.survey_no === record.survey_no,
  );

  return (
    <AppShell
      title={record.owner ?? "Unknown owner"}
      subtitle={`Survey No. ${record.survey_no ?? "—"} · ${record.village ?? "Village missing"}, ${record.taluka ?? "—"}, ${record.district ?? "—"}`}
      actions={
        <>
          <ExportReportButton recordId={record.id} />
          {record.document && (
            <Button
              variant="outline"
              onClick={() => openDoc.mutate(record.document!)}
              disabled={openDoc.isPending}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              {openDoc.isPending ? "Preparing…" : "Open source document"}
            </Button>
          )}
          <Button asChild variant="outline">
            <Link to="/compare" search={{ a: record.id }}>
              Compare with another record
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Extracted Record Fields</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-3">
            <Field label="Owner Name" value={record.owner} />
            <Field label="Survey / Khasra No." value={record.survey_no} />
            <Field label="Land Area (ha)" value={record.area?.toFixed(2) ?? null} />
            <Field label="Village" value={record.village} />
            <Field label="Taluka / Tehsil" value={record.taluka} />
            <Field label="District" value={record.district} />
            <Field label="Land Type" value={record.land_type} />
            <Field label="Mutation Number" value={record.mutation_no} />
            <Field label="Registration Number" value={record.registration_no} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Overall confidence</p>
              <ConfidenceMeter value={record.confidence} />
            </div>
            <div>
              <p className="mb-1 text-xs text-muted-foreground">Anomaly risk score</p>
              <RiskMeter value={record.risk_score} />
            </div>
            <div className="space-y-2 border-t border-border pt-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">AI Recommendation</span>
                <span className="font-medium">{record.ai_recommendation ?? "—"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Officer Decision</span>
                <span className="font-medium">{decisions[0]?.decision ?? "Not yet decided"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Verification Status</span>
                <StatusBadge status={record.verification_status} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Explainable AI — Flag Reasons</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExplainPanel reasons={record.flags} />
            {related.length > 0 && (
              <div className="rounded-md border border-border p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Fuzzy owner-name comparison on survey {record.survey_no}
                </p>
                <ul className="space-y-2 text-sm">
                  {related.map((other) => {
                    const match = nameSimilarity(record.owner, other.owner);
                    return (
                      <li key={other.id} className="flex items-center justify-between gap-3">
                        <Link
                          to="/records/$id"
                          params={{ id: other.id }}
                          className="truncate text-primary hover:underline"
                        >
                          {other.owner ?? "Unknown"}
                        </Link>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {match.score}% · {match.label}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  Similarity is a string-matching estimate only — identity is never auto-declared.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">OCR Text Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
              {record.ocr_text ?? "No OCR text stored for this record."}
            </pre>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Human-in-the-Loop Verification</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <OfficerActions recordId={record.id} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Decision history
            </p>
            {decisions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No officer decision recorded yet.</p>
            ) : (
              <ul className="space-y-2">
                {decisions.map((decision) => (
                  <li
                    key={decision.id}
                    className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{decision.decision}</span>
                      <span className="text-xs text-muted-foreground">
                        {decision.officer_name} · {new Date(decision.created_at).toLocaleString()}
                      </span>
                    </div>
                    {decision.notes && (
                      <p className="mt-1 text-xs text-muted-foreground">{decision.notes}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      <div className="mt-4">
        <AuditTimeline recordId={record.id} />
      </div>
    </AppShell>
  );
}
