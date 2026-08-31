/**
 * Server pipeline entry point: Upload -> OCR -> Extraction -> Validation ->
 * Confidence -> Risk -> persisted record awaiting human verification.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { extractFields, extractionConfidence } from "./pipeline/extraction";
import { computeConfidence, computeRisk, deriveStatus, recommend } from "./pipeline/scoring";
import type { ExtractedFields, LandRecord, ValidationIssue } from "./pipeline/types";
import { validateRecord } from "./pipeline/validation";

const ALLOWED = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
} as const;

const MAX_BYTES = 8 * 1024 * 1024;

const inputSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  base64: z.string().min(1),
});

export type ProcessResult = {
  recordId: string;
  ocrText: string;
  ocrConfidence: number;
  ocrEngine: string;
  documentKind: string;
  fields: ExtractedFields;
  issues: ValidationIssue[];
  confidence: { overall: number; label: string; breakdown: Record<string, number> };
  risk: { score: number; label: string; reasons: string[] };
  status: string;
  recommendation: string;
};

/** Strips directory traversal and unsafe characters from the upload name. */
function secureFilename(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "document";
  return base.replace(/[^A-Za-z0-9._-]/g, "_").slice(0, 120) || "document";
}

/** Demo plots are scattered around Wagholi, Haveli taluka, Pune. */
function demoCoordinates(seed: string): { latitude: number; longitude: number } {
  let hash = 0;
  for (const ch of seed) hash = (hash * 31 + ch.charCodeAt(0)) % 100000;
  return {
    latitude: 18.5804 + ((hash % 100) - 50) / 8000,
    longitude: 73.981 + ((Math.floor(hash / 100) % 100) - 50) / 8000,
  };
}

export const processDocument = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<ProcessResult> => {
    const { runOcr, OcrError } = await import("./pipeline/ocr.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const filename = secureFilename(data.filename);
    const extension = filename.toLowerCase().split(".").pop() ?? "";
    const expected = ALLOWED[data.mimeType as keyof typeof ALLOWED];

    if (!expected || !["pdf", "jpg", "jpeg", "png"].includes(extension)) {
      throw new Error("Unsupported file type. Please upload a PDF, JPG, JPEG or PNG document.");
    }

    let bytes: Uint8Array;
    try {
      const binary = atob(data.base64);
      bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    } catch {
      throw new Error("The file appears to be corrupted and could not be read.");
    }
    if (bytes.byteLength === 0) throw new Error("The selected file is empty.");
    if (bytes.byteLength > MAX_BYTES) throw new Error("File is larger than the 8 MB limit.");

    const storagePath = `uploads/${Date.now()}-${filename}`;
    const upload = await supabaseAdmin.storage
      .from("land-documents")
      .upload(storagePath, bytes, { contentType: data.mimeType, upsert: false });
    if (upload.error) {
      throw new Error("The document could not be stored. Please try uploading again.");
    }

    // --- Stage 1: OCR -------------------------------------------------------
    let ocr;
    try {
      ocr = await runOcr({ filename, mimeType: data.mimeType, base64: data.base64 });
    } catch (error) {
      if (error instanceof OcrError) throw new Error(error.message);
      throw new Error("The document could not be read. Please try a clearer scan.");
    }

    // --- Stage 2: Information extraction ------------------------------------
    const fields = extractFields(ocr.text);
    const extractConf = extractionConfidence(fields);

    // --- Stage 3: Validation against the existing register ------------------
    const { data: existing } = await supabaseAdmin.from("land_records").select("*");
    const others = (existing ?? []) as unknown as LandRecord[];
    const coords = demoCoordinates(filename + (fields.survey_no ?? ""));
    const validation = validateRecord({ ...fields, ...coords }, others, ocr.confidence);

    // --- Stage 4: Confidence + risk ----------------------------------------
    const confidence = computeConfidence(ocr.confidence, extractConf, validation.validationConfidence);
    const risk = computeRisk(validation.issues);
    const status = deriveStatus(confidence.overall, risk.score);
    const recommendation = recommend(confidence.overall, risk.score);

    // --- Stage 5: Persist, awaiting human verification ----------------------
    const insert = await supabaseAdmin
      .from("land_records")
      .insert({
        owner: fields.owner,
        survey_no: fields.survey_no,
        area: fields.area,
        village: fields.village,
        taluka: fields.taluka,
        district: fields.district,
        land_type: fields.land_type,
        mutation_no: fields.mutation_no,
        registration_no: fields.registration_no,
        latitude: coords.latitude,
        longitude: coords.longitude,
        document: storagePath,
        ocr_text: ocr.text,
        confidence: confidence.overall,
        risk_score: risk.score,
        status,
        issue: validation.issues[0]?.explanation ?? null,
        ai_recommendation: recommendation,
        flags: validation.issues.map((i) => i.explanation),
        verification_status: status === "Verified" ? "Verified" : "Review Required",
      })
      .select("id")
      .single();

    if (insert.error || !insert.data) {
      throw new Error("The processed record could not be saved. Please try again.");
    }

    return {
      recordId: insert.data.id,
      ocrText: ocr.text,
      ocrConfidence: ocr.confidence,
      ocrEngine: ocr.engine,
      documentKind: ocr.documentKind,
      fields,
      issues: validation.issues,
      confidence,
      risk,
      status,
      recommendation,
    };
  });

/** Short-lived link so officers can open the stored source document. */
export const getDocumentUrl = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ path: z.string().min(1) }).parse(data))
  .handler(async ({ data }): Promise<string | null> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed } = await supabaseAdmin.storage
      .from("land-documents")
      .createSignedUrl(data.path, 3600);
    return signed?.signedUrl ?? null;
  });
