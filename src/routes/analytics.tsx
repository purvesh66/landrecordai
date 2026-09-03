import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, BadgeCheck, FileStack, Gauge, ShieldAlert, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { ConfidenceMeter, RiskBadge, StatusBadge } from "@/components/indicators";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ANOMALY_CATEGORIES,
  categoriesOf,
  categoryLabel,
  useI18n,
  type AnomalyCategory,
  type TranslationKey,
} from "@/lib/i18n";
import type { LandRecord, OfficerDecision } from "@/lib/pipeline/types";
import { getAllDecisions, getAllRecords } from "@/lib/records";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "Validation Intelligence — Land Record AI" },
      {
        name: "description",
        content:
          "Filterable analytics of land record validation outcomes and rule-based mismatch categories over time for Pune district and Wagholi village.",
      },
      { property: "og:title", content: "Validation Intelligence Dashboard" },
      {
        property: "og:description",
        content:
          "Validation outcomes, mismatch categories, confidence bands, risk spread and officer performance for digitized land records.",
      },
    ],
  }),
  component: AnalyticsPage,
});

type Scope = "all" | "pune" | "wagholi";
type Band = "all" | "high" | "medium" | "low";
type Granularity = "day" | "week" | "month";

const UNASSIGNED = "__unassigned__";

const STATUSES = ["Verified", "Approved", "Review Required", "Rejected", "Pending"] as const;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function bucketKey(iso: string, granularity: Granularity): string {
  const date = new Date(iso);
  if (granularity === "month") return iso.slice(0, 7);
  if (granularity === "week") {
    const day = new Date(date);
    const weekday = (day.getUTCDay() + 6) % 7;
    day.setUTCDate(day.getUTCDate() - weekday);
    return isoDay(day);
  }
  return iso.slice(0, 10);
}

/** Officer identity is derived from the most recent recorded officer decision. */
function officerOf(recordId: string, decisions: OfficerDecision[]): string | null {
  const latest = decisions
    .filter((d) => d.record_id === recordId)
    .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))[0];
  return latest?.officer_name ?? null;
}

function AnalyticsPage() {
  const { t } = useI18n();
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: getAllRecords,
  });
  const { data: decisions = [] } = useQuery({
    queryKey: ["decisions"],
    queryFn: getAllDecisions,
  });

  const [scope, setScope] = useState<Scope>("all");
  const [officer, setOfficer] = useState<string>("all");
  const [band, setBand] = useState<Band>("all");
  const [anomaly, setAnomaly] = useState<AnomalyCategory | "all">("all");
  const [status, setStatus] = useState<string>("all");
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  const officerNames = useMemo(
    () => [...new Set(decisions.map((d) => d.officer_name))].sort(),
    [decisions],
  );

  const enriched = useMemo(
    () =>
      records.map((record) => ({
        record,
        officer: officerOf(record.id, decisions),
        categories: categoriesOf(record.flags),
        day: record.created_at.slice(0, 10),
      })),
    [records, decisions],
  );

  const filtered = useMemo(
    () =>
      enriched.filter(({ record, officer: who, categories, day }) => {
        if (scope === "pune" && record.district !== "Pune") return false;
        if (scope === "wagholi" && record.village !== "Wagholi") return false;
        if (officer === UNASSIGNED && who !== null) return false;
        if (officer !== "all" && officer !== UNASSIGNED && who !== officer) return false;
        if (band === "high" && record.confidence < 90) return false;
        if (band === "medium" && (record.confidence < 70 || record.confidence >= 90)) return false;
        if (band === "low" && record.confidence >= 70) return false;
        if (anomaly !== "all" && !categories.includes(anomaly)) return false;
        if (status !== "all" && record.verification_status !== status) return false;
        if (from && day < from) return false;
        if (to && day > to) return false;
        return true;
      }),
    [enriched, scope, officer, band, anomaly, status, from, to],
  );

  const rows = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => +new Date(b.record.created_at) - +new Date(a.record.created_at),
      ),
    [filtered],
  );

  const kpis = useMemo(() => {
    const list = filtered.map((f) => f.record);
    const total = list.length;
    const verified = list.filter((r) =>
      ["Verified", "Approved"].includes(r.verification_status),
    ).length;
    const review = list.filter((r) => r.verification_status === "Review Required").length;
    const rejected = list.filter((r) => r.verification_status === "Rejected").length;
    const flagged = list.filter((r) => r.flags.length > 0).length;
    const mismatches = filtered.reduce((sum, f) => sum + f.categories.length, 0);
    const avg = (pick: (r: LandRecord) => number) =>
      total === 0 ? 0 : Math.round(list.reduce((sum, r) => sum + pick(r), 0) / total);
    return {
      total,
      verified,
      review,
      rejected,
      anomalyRate: total === 0 ? 0 : Math.round((flagged / total) * 100),
      avgConfidence: avg((r) => r.confidence),
      avgRisk: avg((r) => r.risk_score),
      mismatches,
    };
  }, [filtered]);

  const timeSeries = useMemo(() => {
    const buckets = new Map<
      string,
      { name: string; verified: number; review: number; rejected: number; anomalies: number }
    >();
    for (const { record, day } of filtered) {
      const key = bucketKey(day, granularity);
      const entry =
        buckets.get(key) ??
        { name: key, verified: 0, review: 0, rejected: 0, anomalies: 0 };
      if (["Verified", "Approved"].includes(record.verification_status)) entry.verified += 1;
      if (record.verification_status === "Review Required") entry.review += 1;
      if (record.verification_status === "Rejected") entry.rejected += 1;
      if (record.flags.length > 0) entry.anomalies += 1;
      buckets.set(key, entry);
    }
    return [...buckets.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered, granularity]);

  const mismatchData = useMemo(
    () =>
      ANOMALY_CATEGORIES.map((category) => ({
        category,
        name: categoryLabel(t, category),
        value: filtered.filter((f) => f.categories.includes(category)).length,
      })),
    [filtered, t],
  );

  const bandData = useMemo(() => {
    const list = filtered.map((f) => f.record);
    return [
      { name: t("an.confHigh"), value: list.filter((r) => r.confidence >= 90).length },
      {
        name: t("an.confMedium"),
        value: list.filter((r) => r.confidence >= 70 && r.confidence < 90).length,
      },
      { name: t("an.confLow"), value: list.filter((r) => r.confidence < 70).length },
    ];
  }, [filtered, t]);

  const riskData = useMemo(() => {
    const list = filtered.map((f) => f.record);
    return [
      { name: t("risk.LOW RISK"), value: list.filter((r) => r.risk_score < 30).length },
      {
        name: t("risk.MEDIUM RISK"),
        value: list.filter((r) => r.risk_score >= 30 && r.risk_score < 60).length,
      },
      { name: t("risk.HIGH RISK"), value: list.filter((r) => r.risk_score >= 60).length },
    ];
  }, [filtered, t]);

  const officerData = useMemo(() => {
    const map = new Map<
      string,
      { name: string; reviewed: number; approved: number; rejected: number; pending: number }
    >();
    for (const { record, officer: who } of filtered) {
      const name = who ?? t("an.unassigned");
      const entry =
        map.get(name) ?? { name, reviewed: 0, approved: 0, rejected: 0, pending: 0 };
      entry.reviewed += 1;
      if (["Approved", "Verified"].includes(record.verification_status)) entry.approved += 1;
      else if (record.verification_status === "Rejected") entry.rejected += 1;
      else entry.pending += 1;
      map.set(name, entry);
    }
    return [...map.values()].sort((a, b) => b.reviewed - a.reviewed);
  }, [filtered, t]);

  const resetFilters = () => {
    setScope("all");
    setOfficer("all");
    setBand("all");
    setAnomaly("all");
    setStatus("all");
    setGranularity("week");
    setFrom("");
    setTo("");
  };

  const PIE_COLORS = ["var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

  return (
    <AppShell title={t("an.title")} subtitle={t("an.subtitle")}>
      <p className="mb-4 rounded-md border border-info/30 bg-info/10 px-3 py-2 text-xs text-foreground">
        {t("an.demoNote")}
      </p>

      {/* ---------------- Filter bar ---------------- */}
      <Card className="mb-5">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm">{t("an.filters")}</CardTitle>
          <Button variant="ghost" size="sm" onClick={resetFilters}>
            {t("common.reset")}
          </Button>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.scope")}</Label>
            <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("an.scopeAll")}</SelectItem>
                <SelectItem value="pune">{t("an.scopePune")}</SelectItem>
                <SelectItem value="wagholi">{t("an.scopeWagholi")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.officer")}</Label>
            <Select value={officer} onValueChange={setOfficer}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("an.allOfficers")}</SelectItem>
                <SelectItem value={UNASSIGNED}>{t("an.unassigned")}</SelectItem>
                {officerNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.confBand")}</Label>
            <Select value={band} onValueChange={(v) => setBand(v as Band)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                <SelectItem value="high">{t("an.confHigh")}</SelectItem>
                <SelectItem value="medium">{t("an.confMedium")}</SelectItem>
                <SelectItem value="low">{t("an.confLow")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.anomalyType")}</Label>
            <Select value={anomaly} onValueChange={(v) => setAnomaly(v as AnomalyCategory | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {ANOMALY_CATEGORIES.map((category) => (
                  <SelectItem key={category} value={category}>
                    {categoryLabel(t, category)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.statusFilter")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.all")}</SelectItem>
                {STATUSES.map((value) => (
                  <SelectItem key={value} value={value}>
                    {t(`status.${value}` as TranslationKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="from">
              {t("an.from")}
            </Label>
            <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs" htmlFor="to">
              {t("an.to")}
            </Label>
            <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">{t("an.granularity")}</Label>
            <Select value={granularity} onValueChange={(v) => setGranularity(v as Granularity)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">{t("an.daily")}</SelectItem>
                <SelectItem value="week">{t("an.weekly")}</SelectItem>
                <SelectItem value="month">{t("an.monthly")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <p className="mb-4 text-xs text-muted-foreground">
        {t("an.filteredNote", { count: kpis.total })}
      </p>

      {/* ---------------- KPIs ---------------- */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label={t("an.kpiTotal")} value={String(kpis.total)} icon={FileStack} tone="bg-primary/10 text-primary" />
        <Kpi label={t("an.kpiVerified")} value={String(kpis.verified)} icon={BadgeCheck} tone="bg-success/15 text-success" />
        <Kpi label={t("an.kpiReview")} value={String(kpis.review)} icon={ShieldAlert} tone="bg-warning/20 text-warning" />
        <Kpi label={t("an.kpiRejected")} value={String(kpis.rejected)} icon={XCircle} tone="bg-destructive/12 text-destructive" />
        <Kpi label={t("an.kpiAnomalyRate")} value={`${kpis.anomalyRate}%`} icon={AlertTriangle} tone="bg-destructive/12 text-destructive" />
        <Kpi label={t("an.kpiAvgConf")} value={`${kpis.avgConfidence}%`} icon={Gauge} tone="bg-info/15 text-info" />
        <Kpi label={t("an.kpiAvgRisk")} value={`${kpis.avgRisk}/100`} icon={Gauge} tone="bg-warning/20 text-warning" />
        <Kpi label={t("an.kpiMismatch")} value={String(kpis.mismatches)} icon={AlertTriangle} tone="bg-primary/10 text-primary" />
      </div>

      {/* ---------------- Charts ---------------- */}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("an.chartTime")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="verified" name={t("an.kpiVerified")} stroke="var(--color-chart-2)" strokeWidth={2} />
                <Line type="monotone" dataKey="review" name={t("an.kpiReview")} stroke="var(--color-chart-3)" strokeWidth={2} />
                <Line type="monotone" dataKey="rejected" name={t("an.kpiRejected")} stroke="var(--color-chart-4)" strokeWidth={2} />
                <Line type="monotone" dataKey="anomalies" name={t("an.anomalies")} stroke="var(--color-chart-1)" strokeWidth={2} strokeDasharray="4 3" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("an.chartMismatch")}</CardTitle>
            <p className="text-xs text-muted-foreground">{t("an.chartMismatchHint")}</p>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mismatchData} layout="vertical" margin={{ left: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={130} fontSize={11} />
                <Tooltip />
                <Bar
                  dataKey="value"
                  name={t("an.records")}
                  radius={[0, 4, 4, 0]}
                  cursor="pointer"
                  onClick={(entry: { category?: AnomalyCategory }) =>
                    setAnomaly((current) =>
                      entry.category && current === entry.category ? "all" : (entry.category ?? "all"),
                    )
                  }
                >
                  {mismatchData.map((entry) => (
                    <Cell
                      key={entry.category}
                      fill={
                        anomaly === entry.category
                          ? "var(--color-chart-1)"
                          : "var(--color-chart-3)"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("an.chartConf")}</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bandData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {bandData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("an.chartRisk")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" name={t("an.records")} fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{t("an.chartOfficer")}</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={officerData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={10} interval={0} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Legend />
                <Bar dataKey="approved" name={t("an.approved")} stackId="a" fill="var(--color-chart-2)" />
                <Bar dataKey="rejected" name={t("an.rejected")} stackId="a" fill="var(--color-chart-4)" />
                <Bar dataKey="pending" name={t("an.pending")} stackId="a" fill="var(--color-chart-3)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* ---------------- Detailed table ---------------- */}
      <Card className="mt-5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{t("an.tableTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : rows.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <p className="text-sm font-medium text-foreground">{t("an.emptyTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">{t("an.emptyBody")}</p>
              <Button className="mt-4" variant="outline" size="sm" onClick={resetFilters}>
                {t("common.reset")}
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("common.recordId")}</TableHead>
                  <TableHead>{t("common.owner")}</TableHead>
                  <TableHead>{t("common.surveyNo")}</TableHead>
                  <TableHead>{t("common.location")}</TableHead>
                  <TableHead>{t("an.anomalyCategory")}</TableHead>
                  <TableHead>{t("common.confidence")}</TableHead>
                  <TableHead>{t("common.risk")}</TableHead>
                  <TableHead>{t("common.officer")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead>{t("common.timestamp")}</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map(({ record, officer: who, categories }) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-mono text-xs">
                      {record.id.replace(/-/g, "").slice(0, 8).toUpperCase()}
                    </TableCell>
                    <TableCell className="font-medium">
                      {record.owner ?? t("common.unknownOwner")}
                    </TableCell>
                    <TableCell>{record.survey_no ?? t("common.none")}</TableCell>
                    <TableCell className="text-xs">
                      {[record.village, record.taluka, record.district]
                        .filter(Boolean)
                        .join(", ") || t("common.none")}
                    </TableCell>
                    <TableCell>
                      {categories.length === 0 ? (
                        <span className="text-xs text-muted-foreground">{t("an.clean")}</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {categories.map((category) => (
                            <Badge key={category} variant="outline" className="text-[10px]">
                              {categoryLabel(t, category)}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="w-32">
                      <ConfidenceMeter value={record.confidence} compact />
                    </TableCell>
                    <TableCell>
                      <RiskBadge value={record.risk_score} />
                    </TableCell>
                    <TableCell className="text-xs">{who ?? t("an.unassigned")}</TableCell>
                    <TableCell>
                      <StatusBadge status={record.verification_status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                      {new Date(record.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/records/$id" params={{ id: record.id }}>
                          {t("common.open")}
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm">
                        <Link to="/compare">{t("common.compare")}</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof FileStack;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className={`rounded-md p-2 ${tone}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 truncate text-[11px] uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
