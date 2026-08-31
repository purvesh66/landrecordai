import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, RotateCcw, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { recordOfficerDecision, type Decision } from "@/lib/records";

/**
 * HUMAN-IN-THE-LOOP: the only place a record's verification status can change.
 * Nothing in the pipeline auto-approves a flagged record.
 */
export function OfficerActions({
  recordId,
  size = "default",
}: {
  recordId: string;
  size?: "sm" | "default";
}) {
  const [pending, setPending] = useState<Decision | null>(null);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (decision: Decision) => recordOfficerDecision(recordId, decision, notes),
    onSuccess: (_data, decision) => {
      toast.success(`Officer decision recorded: ${decision}`);
      setPending(null);
      setNotes("");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) => toast.error(error.message || "Could not save the decision."),
  });

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          size={size}
          className="bg-success text-success-foreground hover:bg-success/90"
          onClick={() => setPending("Approve")}
        >
          <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
        </Button>
        <Button size={size} variant="outline" onClick={() => setPending("Request Manual Review")}>
          <RotateCcw className="mr-2 h-4 w-4" /> Request Manual Review
        </Button>
        <Button size={size} variant="destructive" onClick={() => setPending("Reject")}>
          <XCircle className="mr-2 h-4 w-4" /> Reject
        </Button>
      </div>

      <Dialog open={pending !== null} onOpenChange={(open) => !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm officer decision: {pending}</DialogTitle>
            <DialogDescription>
              This decision is stored with a timestamp and overrides the AI recommendation. The
              record's verification status will be updated immediately.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            maxLength={500}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Optional remarks for the audit trail (max 500 characters)"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              disabled={mutation.isPending}
              onClick={() => pending && mutation.mutate(pending)}
            >
              {mutation.isPending ? "Saving…" : `Confirm ${pending}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
