/**
 * MODULE: Confidence + Risk / Anomaly scoring (weighted rules).
 *
 * FUTURE AI: replace the fixed weights with a trained classifier calibrated on
 * officer decisions (human feedback loop) - keep the ConfidenceResult /
 * RiskResult shapes so the dashboard needs no change.
 */

import type { ConfidenceResult, RiskResult, ValidationIssue } from "./types";

export function computeConfidence(
  ocr: number,
  extraction: number,
  validation: number,
): ConfidenceResult {
  const overall = Math.round(ocr * 0.35 + extraction * 0.3 + validation * 0.35);
  const label: ConfidenceResult["label"] =
    overall >= 90 ? "High Confidence" : overall >= 70 ? "Medium Confidence" : "Low Confidence";
  return { overall, label, breakdown: { ocr: Math.round(ocr), extraction, validation } };
}

const WEIGHTS: Record<ValidationIssue["code"], number> = {
  MISSING_FIELD: 20,
  OWNER_MISMATCH: 30,
  AREA_MISMATCH: 30,
  DUPLICATE: 25,
  LOW_OCR_CONFIDENCE: 20,
};

/** Weighted anomaly score normalized to 0-100 with the contributing reasons. */
export function computeRisk(issues: ValidationIssue[]): RiskResult {
  const raw = issues.reduce((sum, i) => sum + WEIGHTS[i.code], 0);
  const score = Math.min(100, raw);
  const label: RiskResult["label"] =
    score >= 60 ? "HIGH RISK" : score >= 30 ? "MEDIUM RISK" : "LOW RISK";
  return {
    score,
    label,
    reasons: issues.map((i) => `${i.explanation} (+${WEIGHTS[i.code]} risk points)`),
  };
}

/** AI recommendation - advisory only, an officer always makes the final call. */
export function recommend(confidence: number, risk: number): string {
  if (risk >= 60 || confidence < 70) return "Request Manual Review";
  if (risk >= 30) return "Request Manual Review";
  return "Approve";
}

export function deriveStatus(confidence: number, risk: number): string {
  if (risk >= 60) return "High Risk";
  if (risk > 0 || confidence < 70) return "Review Required";
  return "Verified";
}

export function confidenceLabel(value: number): string {
  return value >= 90 ? "High Confidence" : value >= 70 ? "Medium Confidence" : "Low Confidence";
}

export function riskLabel(value: number): "LOW RISK" | "MEDIUM RISK" | "HIGH RISK" {
  return value >= 60 ? "HIGH RISK" : value >= 30 ? "MEDIUM RISK" : "LOW RISK";
}
