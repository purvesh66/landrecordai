import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { confidenceLabel, riskLabel } from "@/lib/pipeline/scoring";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Verified: "bg-success/15 text-success border-success/30",
    Approved: "bg-success/15 text-success border-success/30",
    "Review Required": "bg-warning/20 text-warning-foreground border-warning/40",
    "High Risk": "bg-destructive/12 text-destructive border-destructive/30",
    Rejected: "bg-destructive/12 text-destructive border-destructive/30",
    Pending: "bg-muted text-muted-foreground border-border",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", map[status] ?? map["Pending"])}>
      {status}
    </Badge>
  );
}

export function ConfidenceMeter({ value, compact }: { value: number; compact?: boolean }) {
  const label = confidenceLabel(value);
  const tone =
    value >= 90 ? "bg-success" : value >= 70 ? "bg-warning" : "bg-destructive";
  return (
    <div className={cn("w-full", compact ? "min-w-28" : "space-y-1.5")}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{Math.round(value)}%</span>
        {!compact && <span className="text-muted-foreground">{label}</span>}
      </div>
      <Progress value={value} className="h-2" indicatorClassName={tone} />
      {compact && <span className="text-[10px] text-muted-foreground">{label}</span>}
    </div>
  );
}

export function RiskMeter({ value, compact }: { value: number; compact?: boolean }) {
  const label = riskLabel(value);
  const tone =
    value >= 60 ? "bg-destructive" : value >= 30 ? "bg-warning" : "bg-success";
  return (
    <div className={cn("w-full", compact ? "min-w-28" : "space-y-1.5")}>
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-foreground">{Math.round(value)}/100</span>
        <span className="text-muted-foreground">{label}</span>
      </div>
      <Progress value={value} className="h-2" indicatorClassName={tone} />
    </div>
  );
}

export function RiskBadge({ value }: { value: number }) {
  const label = riskLabel(value);
  const tone =
    value >= 60
      ? "bg-destructive/12 text-destructive border-destructive/30"
      : value >= 30
        ? "bg-warning/20 text-warning-foreground border-warning/40"
        : "bg-success/15 text-success border-success/30";
  return (
    <Badge variant="outline" className={cn("font-medium", tone)}>
      {label}
    </Badge>
  );
}
