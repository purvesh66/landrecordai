import { useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  CheckCircle2,
  FileStack,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { processDocument, type ProcessResult } from "@/lib/upload.functions";
import { cn } from "@/lib/utils";

const ACCEPTED = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 8 * 1024 * 1024;

type QueueState = "queued" | "processing" | "completed" | "failed";

type QueueItem = {
  key: string;
  file: File;
  state: QueueState;
  progress: number;
  error?: string;
  result?: ProcessResult;
};

function validateFile(file: File): string | null {
  const extension = `.${file.name.toLowerCase().split(".").pop()}`;
  if (!ACCEPTED.includes(extension)) {
    return "Unsupported format — only PDF, JPG, JPEG and PNG documents are accepted.";
  }
  if (file.size === 0) return "The file is empty and cannot be processed.";
  if (file.size > MAX_BYTES) return "The file is larger than the 8 MB limit.";
  return null;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(new Error("The file could not be read from your device."));
    reader.readAsDataURL(file);
  });
}

const STATE_STYLES: Record<QueueState, string> = {
  queued: "bg-muted text-muted-foreground",
  processing: "bg-primary/10 text-primary",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/10 text-destructive",
};

const STATE_LABELS: Record<QueueState, string> = {
  queued: "In queue",
  processing: "Processing",
  completed: "Completed",
  failed: "Failed",
};

/**
 * Bulk mode reuses the exact same server pipeline as the single upload —
 * validation, secure storage, OCR, extraction, validation, scoring and audit
 * logging all happen in `processDocument`. Files run one at a time so a slow
 * OCR call never starves the others, and a failure never stops the queue.
 */
export function BulkUpload() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const process = useServerFn(processDocument);

  const total = items.length;
  const completed = items.filter((item) => item.state === "completed").length;
  const failed = items.filter((item) => item.state === "failed").length;
  const queued = items.filter((item) => item.state !== "completed" && item.state !== "failed").length;

  function update(key: string, patch: Partial<QueueItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  async function runOne(item: QueueItem) {
    update(item.key, { state: "processing", progress: 15, error: undefined });
    try {
      const base64 = await fileToBase64(item.file);
      update(item.key, { progress: 45 });
      const result = await process({
        data: {
          filename: item.file.name,
          mimeType: item.file.type || "application/pdf",
          base64,
        },
      });
      update(item.key, { state: "completed", progress: 100, result });
      return true;
    } catch (error) {
      update(item.key, {
        state: "failed",
        progress: 100,
        error:
          error instanceof Error && error.message
            ? error.message
            : "The document could not be processed. Please try a clearer scan.",
      });
      return false;
    }
  }

  async function runQueue(pending: QueueItem[]) {
    if (pending.length === 0) return;
    setRunning(true);
    let ok = 0;
    let bad = 0;
    for (const item of pending) {
      // Sequential on purpose: keeps OCR throughput stable and progress honest.
      // eslint-disable-next-line no-await-in-loop
      const success = await runOne(item);
      if (success) ok += 1;
      else bad += 1;
    }
    setRunning(false);
    void queryClient.invalidateQueries();
    toast[bad === 0 ? "success" : "message"](
      `Bulk processing finished — ${ok} added to the register, ${bad} failed.`,
    );
  }

  function addFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const accepted: QueueItem[] = [];
    const rejected: string[] = [];

    Array.from(fileList).forEach((file, index) => {
      const error = validateFile(file);
      const key = `${file.name}-${file.size}-${Date.now()}-${index}`;
      if (error) {
        rejected.push(file.name);
        accepted.push({ key, file, state: "failed", progress: 100, error });
      } else {
        accepted.push({ key, file, state: "queued", progress: 0 });
      }
    });

    setItems((current) => [...current, ...accepted]);
    if (rejected.length > 0) {
      toast.error(`${rejected.length} file(s) were rejected before processing: ${rejected.join(", ")}`);
    }
    void runQueue(accepted.filter((item) => item.state === "queued"));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Select multiple documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
            className={cn(
              "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
            )}
          >
            <FileStack className="mb-3 h-10 w-10 text-primary" />
            <p className="text-sm font-medium">Drag &amp; drop a batch of land documents</p>
            <p className="mt-1 text-xs text-muted-foreground">
              PDF, JPG, JPEG or PNG · up to 8 MB each · processed one after another
            </p>
            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPTED.join(",")}
              className="hidden"
              onChange={(event) => {
                addFiles(event.target.files);
                event.target.value = "";
              }}
            />
            <Button className="mt-4" variant="outline" onClick={() => inputRef.current?.click()}>
              <UploadCloud className="mr-2 h-4 w-4" /> Choose files
            </Button>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: "Total", value: total },
              { label: "Completed", value: completed },
              { label: "Failed", value: failed },
              { label: "In queue", value: queued },
            ].map((stat) => (
              <div key={stat.label} className="rounded-md border border-border px-3 py-2 text-center">
                <p className="text-lg font-semibold">{stat.value}</p>
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 w-full"
              disabled={running}
              onClick={() => setItems([])}
            >
              Clear the list
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Processing queue</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center">
              <FileStack className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
              <p className="text-sm font-medium">No documents queued yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Add a batch on the left — each document runs through the same OCR, extraction,
                validation, scoring and audit pipeline as a single upload.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li key={item.key} className="rounded-md border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{item.file.name}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {(item.file.size / 1024).toFixed(0)} KB
                      </p>
                    </div>
                    <span
                      className={cn(
                        "flex items-center gap-1 rounded px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                        STATE_STYLES[item.state],
                      )}
                    >
                      {item.state === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
                      {item.state === "completed" && <CheckCircle2 className="h-3 w-3" />}
                      {item.state === "failed" && <AlertCircle className="h-3 w-3" />}
                      {STATE_LABELS[item.state]}
                    </span>
                  </div>

                  {item.state !== "queued" && (
                    <Progress
                      value={item.progress}
                      className="mt-2 h-1.5"
                      indicatorClassName={
                        item.state === "failed"
                          ? "bg-destructive"
                          : item.state === "completed"
                            ? "bg-success"
                            : "bg-primary"
                      }
                    />
                  )}

                  {item.state === "completed" && item.result && (
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        Owner:{" "}
                        <span className="font-medium text-foreground">
                          {item.result.fields.owner ?? "Not found"}
                        </span>
                      </span>
                      <span>Confidence {item.result.confidence.overall}%</span>
                      <span>Risk {item.result.risk.score}/100</span>
                      <span>{item.result.status}</span>
                      <Button asChild size="sm" variant="outline" className="ml-auto">
                        <Link to="/records/$id" params={{ id: item.result.recordId }}>
                          View record
                        </Link>
                      </Button>
                    </div>
                  )}

                  {item.state === "failed" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <p className="text-xs text-destructive">{item.error}</p>
                      <div className="ml-auto flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={running || Boolean(validateFile(item.file))}
                          onClick={() => void runQueue([item])}
                        >
                          <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Retry
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            setItems((current) => current.filter((row) => row.key !== item.key))
                          }
                        >
                          <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove
                        </Button>
                      </div>
                    </div>
                  )}

                  {item.state === "queued" && (
                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          setItems((current) => current.filter((row) => row.key !== item.key))
                        }
                      >
                        <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Remove from queue
                      </Button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
