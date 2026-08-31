import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ExplainPanel } from "@/components/explain-panel";
import { ConfidenceMeter, RiskMeter, StatusBadge } from "@/components/indicators";
import { OfficerActions } from "@/components/officer-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllRecords } from "@/lib/records";

export const Route = createFileRoute("/validation")({
  head: () => ({
    meta: [
      { title: "Validation & Anomaly Detection — Land Record AI" },
      {
        name: "description",
        content:
          "Every flagged land record with its numbered, explainable reasons: missing fields, owner mismatches, area differences and duplicates.",
      },
      { property: "og:title", content: "Validation & Anomaly Detection" },
      {
        property: "og:description",
        content: "Explainable anomaly flags across the whole land record register.",
      },
    ],
  }),
  component: ValidationPage,
});

function ValidationPage() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: getAllRecords,
  });
  const flagged = records
    .filter((record) => record.flags.length > 0)
    .sort((a, b) => b.risk_score - a.risk_score);

  return (
    <AppShell
      title="Validation & Anomaly Detection"
      subtitle="Deterministic rule-based checks — missing mandatory fields, owner mismatch, area mismatch, duplicates and low OCR confidence. No result here is machine-learned."
    >
      {isLoading && <p className="text-sm text-muted-foreground">Running validation…</p>}
      {!isLoading && flagged.length === 0 && (
        <p className="text-sm text-muted-foreground">No anomalies detected in the register.</p>
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {flagged.map((record) => (
          <Card key={record.id}>
            <CardHeader className="pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="text-sm">
                  {record.owner ?? "Unknown owner"} · Survey {record.survey_no ?? "—"}
                </CardTitle>
                <StatusBadge status={record.verification_status} />
              </div>
              <p className="text-xs text-muted-foreground">
                {record.village ?? "Village missing"}, {record.taluka ?? "—"},{" "}
                {record.district ?? "—"}
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Confidence</p>
                  <ConfidenceMeter value={record.confidence} compact />
                </div>
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Risk</p>
                  <RiskMeter value={record.risk_score} compact />
                </div>
              </div>
              <ExplainPanel reasons={record.flags} />
              <p className="text-xs text-muted-foreground">
                AI recommendation: <span className="font-medium">{record.ai_recommendation ?? "—"}</span>
              </p>
              <OfficerActions recordId={record.id} size="sm" />
              <Button asChild variant="ghost" size="sm">
                <Link to="/records/$id" params={{ id: record.id }}>
                  Open full record →
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
