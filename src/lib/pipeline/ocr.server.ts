/**
 * MODULE: OCR (server-side, swappable engine).
 *
 * Current engine: Lovable AI vision model, used as a Tesseract-style text
 * dumper. It is told to transcribe only - no interpretation, no extraction.
 * Information extraction happens in a separate module (extraction.ts).
 *
 * FUTURE AI: swap `runOcr` for PaddleOCR / EasyOCR / a multilingual
 * (Marathi + Devanagari) OCR service. Keep the OcrResult contract and nothing
 * downstream needs to change.
 */

import type { OcrResult } from "./types";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const OCR_MODEL = "google/gemini-3.7-flash";

export type OcrInput = {
  filename: string;
  mimeType: string;
  /** Raw base64 (no data: prefix). */
  base64: string;
};

export class OcrError extends Error {}

function detectKind(mimeType: string, filename: string): "image" | "pdf" {
  if (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) return "pdf";
  return "image";
}

/** Rough legibility heuristic used when the engine returns no confidence. */
function estimateConfidence(text: string): number {
  if (!text.trim()) return 0;
  const alnum = (text.match(/[A-Za-z0-9\u0900-\u097F]/g) ?? []).length;
  const density = alnum / Math.max(1, text.length);
  const lengthBonus = Math.min(20, text.length / 40);
  return Math.max(35, Math.min(99, Math.round(density * 80 + lengthBonus)));
}

export async function runOcr(input: OcrInput): Promise<OcrResult> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new OcrError("The document reader is not configured. Please try again later.");

  const documentKind = detectKind(input.mimeType, input.filename);
  const dataUrl = `data:${input.mimeType};base64,${input.base64}`;

  // PDFs go through the file block, images through the image block.
  const contentBlock =
    documentKind === "pdf"
      ? { type: "file", file: { filename: input.filename, file_data: dataUrl } }
      : { type: "image_url", image_url: { url: dataUrl } };

  const body = {
    model: OCR_MODEL,
    messages: [
      {
        role: "system",
        content:
          "You are an OCR engine for Indian land records (7/12 extracts, 8A, mutation entries). " +
          "Transcribe ALL visible text verbatim, line by line, preserving labels and their values. " +
          "Do not summarise, translate, correct or infer anything. " +
          'Reply with strict JSON only: {"text": "<full transcription>", "confidence": <0-100 legibility estimate>}',
      },
      {
        role: "user",
        content: [
          { type: "text", text: "Transcribe every character of this land document." },
          contentBlock,
        ],
      },
    ],
    response_format: { type: "json_object" },
  };

  let response: Response;
  try {
    response = await fetch(GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(body),
    });
  } catch {
    throw new OcrError("Could not reach the document reader. Please try again.");
  }

  if (response.status === 429) {
    throw new OcrError("The document reader is busy right now. Please retry in a few seconds.");
  }
  if (response.status === 402 || response.status === 403) {
    throw new OcrError("AI processing is currently unavailable for this workspace.");
  }
  if (!response.ok) {
    throw new OcrError(
      `The document could not be read (reader returned ${response.status}). Please try a clearer scan.`,
    );
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = payload.choices?.[0]?.message?.content ?? "";

  let text = "";
  let confidence: number | undefined;
  try {
    const parsed = JSON.parse(raw) as { text?: string; confidence?: number };
    text = (parsed.text ?? "").trim();
    if (typeof parsed.confidence === "number") confidence = parsed.confidence;
  } catch {
    text = raw.trim();
  }

  if (!text) {
    throw new OcrError("No readable text was found in this document. Please upload a clearer copy.");
  }

  return {
    text,
    confidence: Math.max(0, Math.min(100, Math.round(confidence ?? estimateConfidence(text)))),
    engine: `lovable-ai-vision (${OCR_MODEL})`,
    documentKind,
  };
}
