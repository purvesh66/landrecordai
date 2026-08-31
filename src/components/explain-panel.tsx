import { AlertTriangle, ShieldCheck } from "lucide-react";

/** EXPLAINABLE AI: a numbered, concrete list of why a record was flagged. */
export function ExplainPanel({ reasons }: { reasons: string[] }) {
  if (reasons.length === 0) {
    return (
      <div className="flex items-start gap-3 rounded-md border border-success/30 bg-success/10 p-4 text-sm">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success" />
        <p className="text-foreground">
          No anomalies were detected. All mandatory fields were present, the survey number is
          unique in the register and the text extraction was clear.
        </p>
      </div>
    );
  }
  return (
    <div className="rounded-md border border-warning/40 bg-warning/10 p-4">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className="h-4 w-4 text-warning" />
        Why this record was flagged ({reasons.length})
      </div>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-foreground/90">
        {reasons.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ol>
    </div>
  );
}
