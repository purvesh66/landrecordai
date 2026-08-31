import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AppShell } from "@/components/app-shell";
import { RiskBadge, StatusBadge } from "@/components/indicators";
import { OfficerActions } from "@/components/officer-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { nameSimilarity } from "@/lib/pipeline/fuzzy";
import { FIELD_LABELS, type LandRecord } from "@/lib/pipeline/types";
import { getAllRecords } from "@/lib/records";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  a: z.string().optional(),
  b: z.string().optional(),
});

export const Route = createFileRoute("/compare")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Side-by-Side Record Comparison — Land Record AI" },
      {
        name: "description",
        content:
          "Compare two land records field by field with match/mismatch badges, a plain-language discrepancy summary and officer actions.",
      },
      { property: "og:title", content: "Side-by-Side Record Comparison" },
      {
        property: "og:description",
        content: "Field-by-field AI comparison of two land records for officer verification.",
      },
    ],
  }),
  component: ComparePage,
});

type FieldKey = keyof typeof FIELD_LABELS;
const FIELD_KEYS = Object.keys(FIELD_LABELS) as FieldKey[];

function valueOf(record: LandRecord | undefined, key: FieldKey): string {
  if (!record) return "—";
  const value = record[key as keyof LandRecord];
  if (value == null) return "Missing";
  if (key === "area") return `${Number(value).toFixed(2)} ha`;
  return String(value);
}

function compareField(a: LandRecord, b: LandRecord, key: FieldKey) {
  if (key === "owner") {
    const match = nameSimilarity(a.owner, b.owner);
    return {
      match: match.score >= 95,
      note:
        match.score >= 95
          ? `Owner names are identical (${match.score}% similarity).`
          : `Owner name similarity is only ${match.score}% — ${match.label}.`,
    };
  }
  if (key === "area") {
    const diff = Math.abs((a.area ?? 0) - (b.area ?? 0));
    return {
      match: diff < 0.01,
      note:
        diff < 0.01
          ? "Land area is identical in both records."
          : `Land area differs by ${diff.toFixed(2)} hectares.`,
    };
  }
  const av = a[key as keyof LandRecord];
  const bv = b[key as keyof LandRecord];
  const match = String(av ?? "").trim().toLowerCase() === String(bv ?? "").trim().toLowerCase();
  return {
    match,
    note: match
      ? `${FIELD_LABELS[key]} matches in both records.`
      : `${FIELD_LABELS[key]} differs: "${av ?? "Missing"}" vs "${bv ?? "Missing"}".`,
  };
}

function ComparePage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { data: records = [] } = useQuery({ queryKey: ["records"], queryFn: getAllRecords });

  const a = records.find((r) => r.id === search.a);
  const b = records.find((r) => r.id === search.b);

  const rows =
    a && b
      ? FIELD_KEYS.map((key) => ({ key, ...compareField(a, b, key) }))
      : [];
  const mismatches = rows.filter((row) => !row.match);

  const picker = (side: "a" | "b", value: string | undefined) => (
    <Select
      value={value ?? ""}
      onValueChange={(next) =>
        navigate({ search: (prev) => ({ ...prev, [side]: next }), replace: true })
      }
    >
      <SelectTrigger>
        <SelectValue placeholder={`Select record ${side.toUpperCase()}`} />
      </SelectTrigger>
      <SelectContent>
        {records.map((record) => (
          <SelectItem key={record.id} value={record.id}>
            {record.owner ?? "Unknown"} · Survey {record.survey_no ?? "—"} ·{" "}
            {record.village ?? "—"}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return (
    <AppShell
      title="Side-by-Side Comparison"
      subtitle="Pick two records to run a field-by-field comparison and record an officer decision."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Record A</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {picker("a", search.a)}
            {a && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={a.verification_status} />
                <RiskBadge value={a.risk_score} />
                <span className="text-muted-foreground">Confidence {a.confidence}%</span>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Record B</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {picker("b", search.b)}
            {b && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge status={b.verification_status} />
                <RiskBadge value={b.risk_score} />
                <span className="text-muted-foreground">Confidence {b.confidence}%</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {!a || !b ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Select a record on both sides to see the comparison.
        </p>
      ) : (
        <>
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Field-by-Field Comparison</CardTitle>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-3">Field</th>
                    <th className="py-2 pr-3">Record A</th>
                    <th className="py-2 pr-3">Record B</th>
                    <th className="py-2">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr
                      key={row.key}
                      className={cn(
                        "border-b border-border/60",
                        !row.match && "bg-destructive/5",
                      )}
                    >
                      <td className="py-2 pr-3 text-muted-foreground">{FIELD_LABELS[row.key]}</td>
                      <td className={cn("py-2 pr-3", !row.match && "font-medium text-destructive")}>
                        {valueOf(a, row.key)}
                      </td>
                      <td className={cn("py-2 pr-3", !row.match && "font-medium text-destructive")}>
                        {valueOf(b, row.key)}
                      </td>
                      <td className="py-2">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-semibold",
                            row.match
                              ? "bg-success/15 text-success"
                              : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {row.match ? "✓ MATCH" : "⚠ MISMATCH"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Discrepancy Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {mismatches.length === 0 ? (
                  <p className="text-sm">
                    All nine compared fields match. These two records describe the same parcel and
                    owner — a likely duplicate entry in the register.
                  </p>
                ) : (
                  <ol className="list-decimal space-y-2 pl-5 text-sm">
                    {mismatches.map((row) => (
                      <li key={row.key}>{row.note}</li>
                    ))}
                  </ol>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Officer Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Record A — {a.owner ?? "Unknown"}
                  </p>
                  <OfficerActions recordId={a.id} size="sm" />
                </div>
                <div className="border-t border-border pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Record B — {b.owner ?? "Unknown"}
                  </p>
                  <OfficerActions recordId={b.id} size="sm" />
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </AppShell>
  );
}
