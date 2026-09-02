import { useQueryClient } from "@tanstack/react-query";
import { FileDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getAuditEvents } from "@/lib/audit";
import { getAllRecords, getDecisions, getRecordById } from "@/lib/records";

/** Downloads a professional per-record verification report as a real PDF file. */
export function ExportReportButton({
  recordId,
  size = "default",
  variant = "default",
  label = "Export Verification Report (PDF)",
}: {
  recordId: string;
  size?: "sm" | "default";
  variant?: "default" | "outline";
  label?: string;
}) {
  const [busy, setBusy] = useState(false);
  const queryClient = useQueryClient();

  async function download() {
    setBusy(true);
    try {
      const [record, decisions, events, all] = await Promise.all([
        queryClient.fetchQuery({ queryKey: ["record", recordId], queryFn: () => getRecordById(recordId) }),
        queryClient.fetchQuery({ queryKey: ["decisions", recordId], queryFn: () => getDecisions(recordId) }),
        queryClient.fetchQuery({ queryKey: ["audit", recordId], queryFn: () => getAuditEvents(recordId) }),
        queryClient.fetchQuery({ queryKey: ["records"], queryFn: getAllRecords }),
      ]);
      if (!record) throw new Error("This record could not be loaded.");

      const { generateVerificationReport } = await import("@/lib/report-pdf");
      const related = all.filter(
        (other) => other.id !== record.id && other.survey_no && other.survey_no === record.survey_no,
      );
      const filename = generateVerificationReport({ record, decisions, events, related });
      toast.success(`Report downloaded: ${filename}`);
    } catch (error) {
      toast.error(
        error instanceof Error && error.message
          ? error.message
          : "The verification report could not be generated. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button size={size} variant={variant} onClick={() => void download()} disabled={busy}>
      {busy ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="mr-2 h-4 w-4" />
      )}
      {busy ? "Preparing PDF…" : label}
    </Button>
  );
}
