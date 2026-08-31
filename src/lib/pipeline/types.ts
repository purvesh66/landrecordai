/**
 * Shared types for the Land Record AI processing pipeline.
 *
 * PIPELINE: Document -> OCR -> Extraction -> Fuzzy matching -> Validation
 *           -> Confidence -> Risk -> Human verification -> GIS
 *
 * Each stage lives in its own module so it can be swapped independently
 * (see the "FUTURE AI" notes in each file).
 */

export type LandRecord = {
  id: string;
  owner: string | null;
  survey_no: string | null;
  area: number | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  land_type: string | null;
  mutation_no: string | null;
  registration_no: string | null;
  latitude: number | null;
  longitude: number | null;
  document: string | null;
  ocr_text: string | null;
  confidence: number;
  risk_score: number;
  status: string;
  issue: string | null;
  ai_recommendation: string | null;
  flags: string[];
  verification_status: string;
  created_at: string;
};

export type OfficerDecision = {
  id: string;
  record_id: string;
  decision: string;
  officer_name: string;
  notes: string | null;
  created_at: string;
};

/** Fields the extraction module attempts to pull out of the OCR text. */
export type ExtractedFields = {
  owner: string | null;
  survey_no: string | null;
  area: number | null;
  village: string | null;
  taluka: string | null;
  district: string | null;
  land_type: string | null;
  mutation_no: string | null;
  registration_no: string | null;
};

export type OcrResult = {
  /** Raw text as produced by the OCR engine. */
  text: string;
  /** 0-100 estimate of how legible/reliable the extraction was. */
  confidence: number;
  /** Which engine produced this result (rule-based swap point). */
  engine: string;
  /** Detected input kind. */
  documentKind: "image" | "pdf";
};

export type ValidationIssue = {
  code:
    | "MISSING_FIELD"
    | "OWNER_MISMATCH"
    | "AREA_MISMATCH"
    | "DUPLICATE"
    | "LOW_OCR_CONFIDENCE";
  /** Human-readable, specific explanation. Never a generic "anomaly detected". */
  explanation: string;
  /** Related record id, when the issue is a cross-record conflict. */
  relatedRecordId?: string;
  severity: "info" | "warning" | "critical";
};

export type ValidationResult = {
  issues: ValidationIssue[];
  /** 0-100 — how internally consistent the record looks. */
  validationConfidence: number;
};

export type RiskResult = {
  score: number;
  label: "LOW RISK" | "MEDIUM RISK" | "HIGH RISK";
  reasons: string[];
};

export type ConfidenceResult = {
  overall: number;
  label: "High Confidence" | "Medium Confidence" | "Low Confidence";
  breakdown: { ocr: number; extraction: number; validation: number };
};

export const MANDATORY_FIELDS: (keyof ExtractedFields)[] = [
  "owner",
  "survey_no",
  "area",
  "village",
  "taluka",
  "district",
  "land_type",
  "mutation_no",
  "registration_no",
];

export const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  owner: "Owner Name",
  survey_no: "Survey / Khasra Number",
  area: "Land Area (ha)",
  village: "Village",
  taluka: "Taluka / Tehsil",
  district: "District",
  land_type: "Land Type",
  mutation_no: "Mutation Number",
  registration_no: "Registration Number",
};
