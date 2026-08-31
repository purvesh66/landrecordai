/**
 * MODULE: Validation Engine (deterministic rules).
 *
 * Cross-checks one candidate record against the existing register and produces
 * specific, human-readable explanations - never a generic "AI detected anomaly".
 *
 * FUTURE AI: plug an ML anomaly detector (isolation forest / graph-based
 * ownership-conflict detection) in alongside these rules; keep returning
 * ValidationIssue[] so the UI and risk engine stay unchanged.
 */

import { missingFields } from "./extraction";
import { nameSimilarity } from "./fuzzy";
import { FIELD_LABELS, type ExtractedFields, type LandRecord, type ValidationIssue, type ValidationResult } from "./types";

export type Candidate = ExtractedFields & {
  id?: string;
  latitude?: number | null;
  longitude?: number | null;
};

const AREA_TOLERANCE_HA = 0.05;
const DUPLICATE_DISTANCE_M = 200;

function metresBetween(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const lat1 = (aLat * Math.PI) / 180;
  const lat2 = (bLat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
}

function shortRef(record: LandRecord): string {
  return `record "${record.owner ?? "Unknown owner"}" (Survey ${record.survey_no ?? "n/a"})`;
}

export function validateRecord(
  candidate: Candidate,
  others: LandRecord[],
  ocrConfidence: number,
): ValidationResult {
  const issues: ValidationIssue[] = [];

  // 1. Missing mandatory fields
  for (const field of missingFields(candidate)) {
    issues.push({
      code: "MISSING_FIELD",
      explanation: `Mandatory field "${FIELD_LABELS[field]}" could not be found in the document.`,
      severity: "warning",
    });
  }

  // 2/3/4. Cross-record checks against every other record on the same survey no.
  const peers = others.filter(
    (r) =>
      r.id !== candidate.id &&
      r.survey_no &&
      candidate.survey_no &&
      r.survey_no.toUpperCase() === candidate.survey_no.toUpperCase(),
  );

  for (const peer of peers) {
    const match = nameSimilarity(candidate.owner, peer.owner);
    const areaDiff =
      candidate.area != null && peer.area != null
        ? Math.abs(Number(candidate.area) - Number(peer.area))
        : null;

    const sameOwner = match.score >= 92;
    const nearArea = areaDiff != null && areaDiff <= AREA_TOLERANCE_HA;
    const distance =
      candidate.latitude != null &&
      candidate.longitude != null &&
      peer.latitude != null &&
      peer.longitude != null
        ? metresBetween(candidate.latitude, candidate.longitude, peer.latitude, peer.longitude)
        : null;
    const nearLocation = distance == null || distance <= DUPLICATE_DISTANCE_M;

    if (sameOwner && nearArea && nearLocation) {
      issues.push({
        code: "DUPLICATE",
        relatedRecordId: peer.id,
        severity: "critical",
        explanation:
          `Duplicate detected: survey number ${candidate.survey_no} with owner "${candidate.owner}" ` +
          `already exists as ${shortRef(peer)}; areas differ by only ${(areaDiff ?? 0).toFixed(2)} ha` +
          (distance != null ? ` and the plots are ${distance} m apart.` : "."),
      });
      continue;
    }

    if (match.score < 92) {
      issues.push({
        code: "OWNER_MISMATCH",
        relatedRecordId: peer.id,
        severity: match.score < 70 ? "critical" : "warning",
        explanation:
          `Survey number ${candidate.survey_no} is also registered to "${peer.owner}", but this document reads ` +
          `"${candidate.owner}". Owner name similarity is ${match.score}% (${match.label}) - human confirmation required.`,
      });
    }

    if (areaDiff != null && areaDiff > AREA_TOLERANCE_HA) {
      issues.push({
        code: "AREA_MISMATCH",
        relatedRecordId: peer.id,
        severity: areaDiff >= 0.25 ? "critical" : "warning",
        explanation:
          `Land area differs by ${areaDiff.toFixed(2)} hectares from ${shortRef(peer)} ` +
          `(${Number(peer.area).toFixed(2)} ha on file vs ${Number(candidate.area).toFixed(2)} ha in this document).`,
      });
    }
  }

  // 5. OCR reliability feeds the validation layer too.
  if (ocrConfidence < 75) {
    issues.push({
      code: "LOW_OCR_CONFIDENCE",
      severity: "warning",
      explanation: `OCR confidence is ${Math.round(ocrConfidence)}% - extracted values may be unreliable and need manual reading.`,
    });
  }

  const penalty = issues.reduce(
    (sum, i) => sum + (i.severity === "critical" ? 18 : i.severity === "warning" ? 10 : 4),
    0,
  );
  return { issues, validationConfidence: Math.max(0, 100 - penalty) };
}
