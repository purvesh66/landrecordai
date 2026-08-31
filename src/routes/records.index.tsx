import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { ConfidenceMeter, RiskBadge, StatusBadge } from "@/components/indicators";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAllRecords } from "@/lib/records";

export const Route = createFileRoute("/records/")({
  head: () => ({
    meta: [
      { title: "Land Records Register — Land Record AI" },
      {
        name: "description",
        content:
          "Search and filter digitized land records by owner, survey number, village or district and by verification status.",
      },
      { property: "og:title", content: "Land Records Register" },
      {
        property: "og:description",
        content: "Searchable register of digitized land records with confidence and risk scores.",
      },
    ],
  }),
  component: RecordsPage,
});

const FILTERS = [
  "All",
  "Verified",
  "Review Required",
  "High Risk",
  "Approved",
  "Rejected",
] as const;

function RecordsPage() {
  const [term, setTerm] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: getAllRecords,
  });

  const filtered = useMemo(() => {
    const needle = term.trim().toLowerCase();
    return records.filter((record) => {
      const matchesTerm =
        !needle ||
        [record.owner, record.survey_no, record.village, record.district]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(needle));
      const matchesFilter =
        filter === "All"
          ? true
          : filter === "High Risk"
            ? record.risk_score >= 60
            : record.verification_status === filter;
      return matchesTerm && matchesFilter;
    });
  }, [records, term, filter]);

  return (
    <AppShell
      title="Land Records"
      subtitle={`${records.length} records in the register · demo dataset`}
      actions={
        <Button asChild variant="outline">
          <Link to="/compare">Compare two records</Link>
        </Button>
      }
    >
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-64 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                placeholder="Search by owner name, survey number, village or district…"
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={filter === option ? "default" : "outline"}
                  onClick={() => setFilter(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Survey No.</TableHead>
                  <TableHead>Area (ha)</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>District</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Verification</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground">
                      Loading records…
                    </TableCell>
                  </TableRow>
                )}
                {!isLoading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-muted-foreground">
                      No records match this search.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.owner ?? "—"}</TableCell>
                    <TableCell>{record.survey_no ?? "—"}</TableCell>
                    <TableCell>{record.area?.toFixed(2) ?? "—"}</TableCell>
                    <TableCell>{record.village ?? <span className="text-destructive">Missing</span>}</TableCell>
                    <TableCell>{record.district ?? "—"}</TableCell>
                    <TableCell className="w-36">
                      <ConfidenceMeter value={record.confidence} compact />
                    </TableCell>
                    <TableCell>
                      <RiskBadge value={record.risk_score} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={record.verification_status} />
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="ghost">
                        <Link to="/records/$id" params={{ id: record.id }}>
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </AppShell>
  );
}
