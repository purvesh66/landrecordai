import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/app-shell";
import { ExportReportButton } from "@/components/export-report-button";
import { RiskBadge, StatusBadge } from "@/components/indicators";
import { OfficerActions } from "@/components/officer-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllDecisions, getAllRecords } from "@/lib/records";

export const Route = createFileRoute("/verification")({
  head: () => ({
    meta: [
      { title: "Officer Verification Queue — Land Record AI" },
      {
        name: "description",
        content:
          "Human-in-the-loop queue: review AI recommendations, approve, request manual review or reject land records and see the full decision trail.",
      },
      { property: "og:title", content: "Officer Verification Queue" },
      {
        property: "og:description",
        content: "Approve, review or reject flagged land records with a full audit trail.",
      },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  const { data: records = [] } = useQuery({ queryKey: ["records"], queryFn: getAllRecords });
  const { data: decisions = [] } = useQuery({
    queryKey: ["decisions"],
    queryFn: getAllDecisions,
  });
  const queue = records.filter((record) => record.verification_status === "Review Required");
  const recordName = (id: string) => {
    const found = records.find((record) => record.id === id);
    return found ? `${found.owner ?? "Unknown"} · Survey ${found.survey_no ?? "—"}` : "Record";
  };

  return (
    <AppShell
      title="Human-in-the-Loop Verification"
      subtitle="Flagged records are never auto-approved — every status change is an explicit officer decision."
    >
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Pending Queue ({queue.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {queue.length === 0 && (
            <p className="text-sm text-muted-foreground">The verification queue is empty.</p>
          )}
          {queue.map((record) => (
            <div
              key={record.id}
              className="rounded-md border border-border p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {record.owner ?? "Unknown owner"} · Survey {record.survey_no ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {record.village ?? "Village missing"}, {record.district ?? "—"} · Confidence{" "}
                    {record.confidence}%
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <RiskBadge value={record.risk_score} />
                  <StatusBadge status={record.verification_status} />
                </div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                AI recommendation: <span className="font-medium text-foreground">{record.ai_recommendation ?? "—"}</span>
              </p>
              {record.flags[0] && (
                <p className="mt-1 text-xs text-muted-foreground">Top flag: {record.flags[0]}</p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <OfficerActions recordId={record.id} size="sm" />
                <ExportReportButton
                  recordId={record.id}
                  size="sm"
                  variant="outline"
                  label="Export PDF"
                />
                <Button asChild size="sm" variant="ghost">
                  <Link to="/records/$id" params={{ id: record.id }}>
                    View record
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Officer Decision Log</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Record</TableHead>
                <TableHead>Decision</TableHead>
                <TableHead>Officer</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {decisions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    No officer decisions recorded yet.
                  </TableCell>
                </TableRow>
              )}
              {decisions.map((decision) => (
                <TableRow key={decision.id}>
                  <TableCell>
                    <Link
                      to="/records/$id"
                      params={{ id: decision.record_id }}
                      className="text-primary hover:underline"
                    >
                      {recordName(decision.record_id)}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{decision.decision}</TableCell>
                  <TableCell>{decision.officer_name}</TableCell>
                  <TableCell className="max-w-64 truncate text-muted-foreground">
                    {decision.notes ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(decision.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
