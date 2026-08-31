import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  BadgeCheck,
  FileStack,
  Map as MapIcon,
  ShieldAlert,
  Upload,
  UserCheck,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ConfidenceMeter, RiskBadge, StatusBadge } from "@/components/indicators";
import { AppShell } from "@/components/app-shell";
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
import { buildStats, getAllRecords } from "@/lib/records";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Land Record AI" },
      {
        name: "description",
        content:
          "Live overview of digitized land records: verification status, detected anomalies, risk distribution and recent alerts.",
      },
      { property: "og:title", content: "Land Record AI Dashboard" },
      {
        property: "og:description",
        content: "Land record digitization, validation and officer verification portal.",
      },
    ],
  }),
  component: Dashboard,
});

const PIE_COLORS = ["var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)"];

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: typeof FileStack;
  tone: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className={`rounded-md p-2.5 ${tone}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none text-foreground">{value}</p>
          <p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: records = [], isLoading } = useQuery({
    queryKey: ["records"],
    queryFn: getAllRecords,
  });
  const stats = buildStats(records);
  const recent = records.slice(0, 6);
  const alerts = records
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.risk_score - a.risk_score)
    .slice(0, 5);

  return (
    <AppShell
      title="Dashboard"
      subtitle="Intelligent Land Record Digitization & Validation System — demo dataset (Wagholi / Haveli, Pune)"
      actions={
        <>
          <Button asChild>
            <Link to="/upload">
              <Upload className="mr-2 h-4 w-4" /> Quick Upload
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/gis">
              <MapIcon className="mr-2 h-4 w-4" /> GIS Map
            </Link>
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Land Records"
          value={stats.total}
          icon={FileStack}
          tone="bg-primary/10 text-primary"
        />
        <StatCard
          label="Successfully Verified"
          value={stats.verified}
          icon={BadgeCheck}
          tone="bg-success/15 text-success"
        />
        <StatCard
          label="Requiring Review"
          value={stats.reviewRequired}
          icon={ShieldAlert}
          tone="bg-warning/20 text-warning"
        />
        <StatCard
          label="Detected Anomalies"
          value={stats.anomalies}
          icon={AlertTriangle}
          tone="bg-destructive/12 text-destructive"
        />
        <StatCard
          label="Officer Approved"
          value={stats.approved}
          icon={UserCheck}
          tone="bg-info/15 text-info"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Verified vs Review Required</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.verifiedVsReview}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                >
                  {stats.verifiedVsReview.map((entry, index) => (
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
            <CardTitle className="text-sm">Risk Score Distribution</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byRisk}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-chart-1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Records by Processing Status</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.byStatus}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" fontSize={11} />
                <YAxis allowDecimals={false} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-chart-5)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Anomaly Types Detected</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.anomalyTypes} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" allowDecimals={false} fontSize={11} />
                <YAxis type="category" dataKey="name" width={110} fontSize={11} />
                <Tooltip />
                <Bar dataKey="value" fill="var(--color-chart-3)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm">Recent Records</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/records">View all</Link>
            </Button>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Owner</TableHead>
                  <TableHead>Survey No.</TableHead>
                  <TableHead>Village</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      Loading records…
                    </TableCell>
                  </TableRow>
                ) : (
                  recent.map((record) => (
                    <TableRow key={record.id} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Link to="/records/$id" params={{ id: record.id }} className="hover:underline">
                          {record.owner ?? "—"}
                        </Link>
                      </TableCell>
                      <TableCell>{record.survey_no ?? "—"}</TableCell>
                      <TableCell>{record.village ?? "—"}</TableCell>
                      <TableCell className="w-36">
                        <ConfidenceMeter value={record.confidence} compact />
                      </TableCell>
                      <TableCell>
                        <RiskBadge value={record.risk_score} />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={record.verification_status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Recent Alerts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.length === 0 && (
              <p className="text-sm text-muted-foreground">No open anomalies.</p>
            )}
            {alerts.map((record) => (
              <Link
                key={record.id}
                to="/records/$id"
                params={{ id: record.id }}
                className="block rounded-md border border-border bg-muted/40 p-3 transition-colors hover:border-primary/40"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">
                    {record.owner ?? "Unknown"} · {record.survey_no ?? "—"}
                  </span>
                  <RiskBadge value={record.risk_score} />
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                  {record.flags[0] ?? record.issue}
                </p>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
