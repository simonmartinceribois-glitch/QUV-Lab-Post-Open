/**
 * QUV-Lab — Contrôle de Validité Intrinsèque & Détection des Valeurs Suspectes
 * Règle d'or : Une valeur SUSPECT reste conservée dans RAW et n'est jamais détruite.
 */

import {
  ReadingValidity,
  QualityStatus,
  QualityAssessment,
  ScientificRuleSet
} from '../types/scientific';

/**
 * Évalue la validité intrinsèque d'une valeur numérique générale (ou nulle).
 */
export function checkScalarValidity(
  value: number | null | undefined,
  bounds?: { min?: number; max?: number },
  suspectRange?: { minSuspect?: number; maxSuspect?: number }
): ReadingValidity {
  if (value === null || value === undefined) {
    return 'MISSING';
  }

  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) {
    return 'INVALID';
  }

  // Contrôle des bornes physiques strictes
  if (bounds) {
    if (bounds.min !== undefined && value < bounds.min) return 'INVALID';
    if (bounds.max !== undefined && value > bounds.max) return 'INVALID';
  }

  // Contrôle de suspicion métrologique
  if (suspectRange) {
    if (suspectRange.minSuspect !== undefined && value < suspectRange.minSuspect) return 'SUSPECT';
    if (suspectRange.maxSuspect !== undefined && value > suspectRange.maxSuspect) return 'SUSPECT';
  }

  return 'VALID';
}

/**
 * Évalue la validité d'une coordonnée colorimétrique L*, a* ou b*.
 */
export function checkColorCoordinateValidity(
  coord: 'L' | 'a' | 'b',
  value: number | null | undefined,
  ruleSet: ScientificRuleSet
): ReadingValidity {
  if (value === null || value === undefined) return 'MISSING';
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return 'INVALID';

  const bounds = ruleSet.colorimetry.physicalBounds;
  if (coord === 'L') {
    if (value < bounds.minL || value > bounds.maxL) return 'INVALID';
  } else if (coord === 'a') {
    if (value < bounds.minA || value > bounds.maxA) return 'INVALID';
  } else if (coord === 'b') {
    if (value < bounds.minB || value > bounds.maxB) return 'INVALID';
  }

  return 'VALID';
}

/**
 * Évalue la validité d'une mesure de Brillance (GU).
 */
export function checkGlossValidity(value: number | null | undefined): ReadingValidity {
  if (value === null || value === undefined) return 'MISSING';
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return 'INVALID';
  if (value < 0) return 'INVALID'; // Une brillance ne peut pas être négative

  return 'VALID';
}

/**
 * Évalue la validité d'une mesure de Dureté Persoz (secondes / oscillations).
 */
export function checkPersozValidity(value: number | null | undefined): ReadingValidity {
  if (value === null || value === undefined) return 'MISSING';
  if (typeof value !== 'number' || !Number.isFinite(value) || Number.isNaN(value)) return 'INVALID';
  if (value < 0) return 'INVALID'; // Le temps d'amortissement ne peut pas être négatif

  return 'VALID';
}

/**
 * Calcule l'évaluation globale de qualité d'un ensemble de relevés
 */
export function buildQualityAssessment(
  validityStatuses: ReadingValidity[],
  expectedCount: number
): QualityAssessment {
  const actualCount = validityStatuses.filter((s) => s !== 'MISSING').length;
  const validCount = validityStatuses.filter((s) => s === 'VALID').length;
  const suspectCount = validityStatuses.filter((s) => s === 'SUSPECT').length;
  const invalidCount = validityStatuses.filter((s) => s === 'INVALID').length;
  const missingCount = expectedCount - actualCount > 0 ? expectedCount - actualCount : 0;

  const completenessPercent = expectedCount > 0 ? Math.min(100, (validCount / expectedCount) * 100) : 0;
  const warnings: string[] = [];

  let status: QualityStatus = 'GOOD';

  if (invalidCount > 0) {
    status = 'INVALID';
    warnings.push(`${invalidCount} valeur(s) non valide(s) ou hors domaine physique.`);
  } else if (missingCount > 0) {
    status = 'WARNING';
    warnings.push(`${missingCount} mesure(s) manquante(s) par rapport au plan configuré (${actualCount}/${expectedCount}).`);
  } else if (suspectCount > 0) {
    status = 'WARNING';
    warnings.push(`${suspectCount} valeur(s) suspecte(s) détectée(s).`);
  } else if (completenessPercent >= 100) {
    status = 'GOOD';
  } else {
    status = 'ACCEPTABLE';
  }

  return {
    expectedCount,
    actualCount,
    validCount,
    suspectCount,
    invalidCount,
    missingCount,
    completenessPercent,
    status,
    warnings
  };
}
