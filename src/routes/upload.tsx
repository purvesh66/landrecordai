import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { BulkUpload } from "@/components/bulk-upload";
import { ExplainPanel } from "@/components/explain-panel";
import { ConfidenceMeter, RiskMeter, StatusBadge } from "@/components/indicators";
import { OfficerActions } from "@/components/officer-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FIELD_LABELS, type ExtractedFields } from "@/lib/pipeline/types";
import { processDocument, type ProcessResult } from "@/lib/upload.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Land Document — Land Record AI" },
      {
        name: "description",
        content:
          "Upload a 7/12 extract or mutation document (PDF, JPG, PNG) and run OCR, field extraction, validation and risk scoring.",
      },
      { property: "og:title", content: "Upload Land Document — Land Record AI" },
      {
        property: "og:description",
        content: "Digitize a land document and get confidence and anomaly scores instantly.",
      },
    ],
  }),
  component: UploadPage,
});

const ACCEPTED = [".pdf", ".jpg", ".jpeg", ".png"];
const MAX_BYTES = 8 * 1024 * 1024;

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

function validateFile(file: File): string | null {
  const extension = `.${file.name.toLowerCase().split(".").pop()}`;
  if (!ACCEPTED.includes(extension)) {
    return `"${file.name}" is not supported. Please choose a PDF, JPG, JPEG or PNG file.`;
  }
  if (file.size === 0) return "That file is empty. Please select a valid scanned document.";
  if (file.size > MAX_BYTES) return "That file is larger than 8 MB. Please upload a smaller scan.";
  return null;
}

function UploadPage() {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ProcessResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const process = useServerFn(processDocument);

  const mutation = useMutation({
    mutationFn: async (selected: File) => {
      const base64 = await fileToBase64(selected);
      return process({
        data: { filename: selected.name, mimeType: selected.type || "application/pdf", base64 },
      });
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success("Document processed and added to the register.");
      void queryClient.invalidateQueries();
    },
    onError: (error: Error) =>
      toast.error(error.message || "The document could not be processed. Please try again."),
  });

  function accept(selected: File | undefined) {
    if (!selected) return;
    const error = validateFile(selected);
    if (error) {
      toast.error(error);
      return;
    }
    setFile(selected);
    setResult(null);
    mutation.mutate(selected);
  }

  return (
    <AppShell
      title="Upload Land Document"
      subtitle="Supported formats: PDF, JPG, JPEG, PNG · maximum 8 MB per document"
    >
      <Tabs defaultValue="single" className="space-y-6">
        <TabsList>
          <TabsTrigger value="single">Single document</TabsTrigger>
          <TabsTrigger value="bulk">Bulk upload</TabsTrigger>
        </TabsList>
        <TabsContent value="bulk" className="mt-0">
          <BulkUpload />
        </TabsContent>
        <TabsContent value="single" className="mt-0">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">1. Select the scanned document</CardTitle>
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
                accept(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 text-center transition-colors",
                dragging ? "border-primary bg-primary/5" : "border-border bg-muted/30",
              )}
            >
              <UploadCloud className="mb-3 h-10 w-10 text-primary" />
              <p className="text-sm font-medium">Drag &amp; drop the land document here</p>
              <p className="mt-1 text-xs text-muted-foreground">or select it manually</p>
              <input
                ref={inputRef}
                type="file"
                accept={ACCEPTED.join(",")}
                className="hidden"
                onChange={(event) => accept(event.target.files?.[0] ?? undefined)}
              />
              <Button
                className="mt-4"
                variant="outline"
                onClick={() => inputRef.current?.click()}
                disabled={mutation.isPending}
              >
                Choose file
              </Button>
              {file && (
                <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" /> {file.name} ·{" "}
                  {(file.size / 1024).toFixed(0)} KB
                </p>
              )}
            </div>

            {mutation.isPending && (
              <div className="mt-4 flex items-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                Running OCR → extraction → validation → scoring…
              </div>
            )}

            <div className="mt-5 rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Processing pipeline</p>
              <p className="mt-1">
                OCR (vision model, Tesseract-style transcription) → rule-based field extraction →
                fuzzy owner-name matching → validation engine → confidence &amp; weighted risk
                scoring → officer verification. Every stage is a separate, swappable module.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">2. OCR Text Preview</CardTitle>
            </CardHeader>
            <CardContent>
              {result ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Engine: <span className="font-medium text-foreground">{result.ocrEngine}</span>
                    </span>
                    <span>
                      Input:{" "}
                      <span className="font-medium uppercase text-foreground">
                        {result.documentKind}
                      </span>
                    </span>
                    <span>
                      OCR confidence:{" "}
                      <span className="font-medium text-foreground">{result.ocrConfidence}%</span>
                    </span>
                  </div>
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md border border-border bg-muted/50 p-3 font-mono text-xs leading-relaxed">
                    {result.ocrText}
                  </pre>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The raw transcription of your document will appear here.
                </p>
              )}
            </CardContent>
          </Card>

          {result && (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">3. Extracted Fields</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {(Object.keys(FIELD_LABELS) as (keyof ExtractedFields)[]).map((key) => (
                    <div
                      key={key}
                      className="rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                        {FIELD_LABELS[key]}
                      </p>
                      <p
                        className={cn(
                          "font-medium",
                          result.fields[key] == null && "text-destructive",
                        )}
                      >
                        {result.fields[key] == null ? "Not found" : String(result.fields[key])}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">4. Confidence &amp; Risk</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Overall confidence ({result.confidence.label})
                    </p>
                    <ConfidenceMeter value={result.confidence.overall} />
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      OCR {result.confidence.breakdown["ocr"]}% · Extraction{" "}
                      {result.confidence.breakdown["extraction"]}% · Validation{" "}
                      {result.confidence.breakdown["validation"]}%
                    </p>
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Anomaly risk ({result.risk.label})
                    </p>
                    <RiskMeter value={result.risk.score} />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Processing status:</span>
                    <StatusBadge status={result.status} />
                    <span className="text-muted-foreground">AI recommendation:</span>
                    <span className="font-medium">{result.recommendation}</span>
                  </div>
                  <ExplainPanel reasons={result.risk.reasons} />
                  <div className="border-t border-border pt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Officer decision
                    </p>
                    <OfficerActions recordId={result.recordId} size="sm" />
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/records/$id" params={{ id: result.recordId }}>
                      Open full record
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
