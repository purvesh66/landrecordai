import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Loader2, Play } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useI18n, type TranslationKey } from "@/lib/i18n";
import { SAMPLE_DOCUMENTS, type SampleDocument } from "@/lib/pipeline/samples";
import { processSampleDocument, type ProcessResult } from "@/lib/upload.functions";

/**
 * Demo scenario library. Each card runs the real pipeline (extraction →
 * validation → scoring → audit) against a bundled transcription, so the
 * created record is a genuine register entry, clearly labelled as a sample.
 */
export function SampleDocuments({
  onProcessed,
  onAddToQueue,
}: {
  onProcessed?: (result: ProcessResult) => void;
  onAddToQueue?: (sample: SampleDocument) => void;
}) {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const run = useServerFn(processSampleDocument);
  const [busy, setBusy] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (id: string) => run({ data: { sampleId: id } }),
    onSuccess: (result, id) => {
      setBusy(null);
      toast.success(t("sample.done", { name: t(`sample.${id}.name` as TranslationKey) }));
      void queryClient.invalidateQueries();
      onProcessed?.(result);
    },
    onError: (error: Error) => {
      setBusy(null);
      toast.error(error.message || t("sample.failed"));
    },
  });

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm">
          <FlaskConical className="h-4 w-4 text-primary" />
          {t("sample.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-xs leading-relaxed text-muted-foreground">{t("sample.subtitle")}</p>
        {onAddToQueue && (
          <Button
            variant="secondary"
            size="sm"
            className="mb-4"
            onClick={() => {
              SAMPLE_DOCUMENTS.forEach((sample) => onAddToQueue(sample));
              toast.success(t("sample.added", { name: t("sample.addAll") }));
            }}
          >
            {t("sample.addAll")}
          </Button>
        )}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {SAMPLE_DOCUMENTS.map((sample) => (
            <div
              key={sample.id}
              className="flex flex-col justify-between rounded-md border border-border bg-muted/30 p-3"
            >
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    {t("common.demoSample")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {t("sample.ocrScore")}: {sample.ocrConfidence}%
                  </span>
                </div>
                <p className="text-sm font-medium">
                  {t(`sample.${sample.id}.name` as TranslationKey)}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {t(`sample.${sample.id}.desc` as TranslationKey)}
                </p>
              </div>
              <div className="mt-3 flex gap-2">
                {onAddToQueue ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      onAddToQueue(sample);
                      toast.success(
                        t("sample.added", {
                          name: t(`sample.${sample.id}.name` as TranslationKey),
                        }),
                      );
                    }}
                  >
                    {t("sample.add")}
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="w-full"
                    disabled={mutation.isPending}
                    onClick={() => {
                      setBusy(sample.id);
                      mutation.mutate(sample.id);
                    }}
                  >
                    {busy === sample.id ? (
                      <>
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                        {t("sample.running")}
                      </>
                    ) : (
                      <>
                        <Play className="mr-1.5 h-3.5 w-3.5" />
                        {t("sample.run")}
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
