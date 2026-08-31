/**
 * MODULE: Information Extraction (rule-based / regex).
 *
 * Runs strictly AFTER the OCR module and never talks to it directly - it only
 * consumes raw text, so the OCR engine can be replaced without touching this.
 *
 * FUTURE AI: replace `extractFields` with a fine-tuned NER model (IndicBERT /
 * LayoutLMv3 document understanding) that returns the same ExtractedFields
 * shape plus per-field probabilities.
 */

import type { ExtractedFields } from "./types";
import { MANDATORY_FIELDS } from "./types";

type Pattern = { field: keyof ExtractedFields; regexes: RegExp[] };

const PATTERNS: Pattern[] = [
  {
    field: "owner",
    regexes: [
      /(?:owner(?:\s*name)?|khatedar|holder|मालक)\s*[:\-]\s*([A-Za-z.\s]{3,60})/i,
      /(?:name\s+of\s+(?:the\s+)?(?:owner|holder))\s*[:\-]\s*([A-Za-z.\s]{3,60})/i,
    ],
  },
  {
    field: "survey_no",
    regexes: [
      /(?:survey|s\.?\s?no|khasra|khata|gat)\s*(?:number|no\.?)?\s*[:\-]\s*([0-9]+(?:\s*\/\s*[0-9A-Za-z]+)*)/i,
    ],
  },
  {
    field: "area",
    regexes: [
      /(?:area|क्षेत्र)\s*[:\-]?\s*([0-9]+(?:\.[0-9]+)?)\s*(?:ha|hect|hectare|hectares)/i,
      /([0-9]+(?:\.[0-9]+)?)\s*(?:ha\b|hectares?)/i,
    ],
  },
  { field: "village", regexes: [/(?:village|gaon|गाव)\s*[:\-]\s*([A-Za-z\s]{2,40})/i] },
  { field: "taluka", regexes: [/(?:taluka|tehsil|taluk)\s*[:\-]\s*([A-Za-z\s]{2,40})/i] },
  { field: "district", regexes: [/(?:district|zilla|jilha)\s*[:\-]\s*([A-Za-z\s]{2,40})/i] },
  {
    field: "land_type",
    regexes: [
      /(?:land\s*type|classification|use)\s*[:\-]\s*([A-Za-z\-\s]{3,30})/i,
      /\b(agricultural|non-agricultural|residential|commercial|industrial|barren)\b/i,
    ],
  },
  {
    field: "mutation_no",
    regexes: [/(?:mutation|ferfar)\s*(?:entry\s*)?(?:number|no\.?)?\s*[:\-]\s*([A-Za-z0-9\-\/]{3,30})/i],
  },
  {
    field: "registration_no",
    regexes: [
      /(?:registration|regd?|document)\s*(?:number|no\.?)?\s*[:\-]\s*([A-Za-z0-9\-\/]{3,30})/i,
    ],
  },
];

const STOP_AT = /\s*(?:\||\n|;|,\s*(?:village|taluka|district|survey|area|owner|mutation|registration))/i;

function clean(raw: string): string {
  return raw.split(STOP_AT)[0]!.replace(/\s+/g, " ").trim().replace(/[.\-|]+$/, "").trim();
}

export function extractFields(ocrText: string): ExtractedFields {
  const text = ocrText.replace(/\r/g, "");
  const out: ExtractedFields = {
    owner: null,
    survey_no: null,
    area: null,
    village: null,
    taluka: null,
    district: null,
    land_type: null,
    mutation_no: null,
    registration_no: null,
  };

  for (const { field, regexes } of PATTERNS) {
    for (const re of regexes) {
      const match = text.match(re);
      if (!match?.[1]) continue;
      const value = clean(match[1]);
      if (!value) continue;
      if (field === "area") {
        const num = Number.parseFloat(value);
        if (Number.isFinite(num)) out.area = num;
      } else if (field === "survey_no") {
        out.survey_no = value.replace(/\s*\/\s*/g, "/").toUpperCase();
      } else if (field === "land_type") {
        out.land_type = value.replace(/\b\w/g, (c) => c.toUpperCase());
      } else {
        (out[field] as string | null) = value.replace(/\b\w/g, (c) => c.toUpperCase());
      }
      break;
    }
  }
  return out;
}

/** 0-100: share of mandatory fields the regex layer managed to recover. */
export function extractionConfidence(fields: ExtractedFields): number {
  const found = MANDATORY_FIELDS.filter((f) => {
    const v = fields[f];
    return v !== null && v !== undefined && String(v).length > 0;
  }).length;
  return Math.round((found / MANDATORY_FIELDS.length) * 100);
}

export function missingFields(fields: ExtractedFields): (keyof ExtractedFields)[] {
  return MANDATORY_FIELDS.filter((f) => {
    const v = fields[f];
    return v === null || v === undefined || String(v).length === 0;
  });
}
