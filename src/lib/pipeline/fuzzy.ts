/**
 * MODULE: Fuzzy name matching (rule-based string similarity).
 *
 * Implements a RapidFuzz-equivalent similarity for Indian owner names:
 *   - normalized Levenshtein ratio
 *   - token-set ratio (word order independent)
 *   - initial expansion ("R. Patil" ~ "Rahul Patil")
 *
 * This is deterministic string maths, NOT machine learning.
 *
 * FUTURE AI: swap this file for a phonetic/embedding matcher (IndicNLP
 * transliteration + sentence-embedding cosine similarity) by keeping the
 * `nameSimilarity` signature intact.
 */

export type NameMatch = {
  /** 0-100 similarity percentage. */
  score: number;
  /** Never auto-declares identity - "Potential Match" needs a human. */
  label: "Likely Same Person" | "Potential Match" | "Different Persons";
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9. ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Classic Levenshtein edit distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1]! + 1, prev[j]! + 1, prev[j - 1]! + cost);
    }
    prev = curr;
  }
  return prev[b.length]!;
}

/** Normalized similarity ratio, 0-100. */
export function ratio(a: string, b: string): number {
  const max = Math.max(a.length, b.length);
  if (max === 0) return 100;
  return ((max - levenshtein(a, b)) / max) * 100;
}

/** Word-order independent comparison of the two token sets. */
function tokenSetRatio(a: string, b: string): number {
  const ta = a.split(" ").filter(Boolean).sort();
  const tb = b.split(" ").filter(Boolean).sort();
  return ratio(ta.join(" "), tb.join(" "));
}

/** Handles abbreviated first names such as "R. Patil" vs "Rahul Patil". */
function initialAwareRatio(a: string, b: string): number {
  const ta = a.replace(/\./g, "").split(" ").filter(Boolean);
  const tb = b.replace(/\./g, "").split(" ").filter(Boolean);
  if (!ta.length || !tb.length) return 0;
  const surnameScore = ratio(ta[ta.length - 1]!, tb[tb.length - 1]!);
  const headA = ta[0]!;
  const headB = tb[0]!;
  const isAbbrev = headA.length === 1 || headB.length === 1;
  if (!isAbbrev) return 0;
  const initialsMatch = headA[0] === headB[0];
  // An abbreviated match is deliberately capped: it can never be conclusive.
  return initialsMatch ? Math.min(80, surnameScore * 0.85 + 10) : surnameScore * 0.4;
}

export function nameSimilarity(nameA: string | null, nameB: string | null): NameMatch {
  if (!nameA || !nameB) return { score: 0, label: "Different Persons" };
  const a = normalize(nameA);
  const b = normalize(nameB);
  const score = Math.round(
    Math.max(ratio(a, b), tokenSetRatio(a, b), initialAwareRatio(a, b)),
  );
  const label: NameMatch["label"] =
    score >= 92 ? "Likely Same Person" : score >= 70 ? "Potential Match" : "Different Persons";
  return { score, label };
}
