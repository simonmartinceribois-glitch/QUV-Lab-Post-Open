/**
 * QUV-Lab — Fonctions Statistiques Pures & Traçables
 * Toutes les fonctions sont déterministes, sans effet de bord, et protègent contre NaN / Inf / div 0.
 */

import { StandardDeviationMethod } from '../types/scientific';

/**
 * Calcule la moyenne arithmétique d'une série de nombres valides.
 * Retourne null si le tableau est vide ou ne contient que des valeurs non exploitables.
 */
export function calculateMean(values: (number | null | undefined)[]): number | null {
  const validValues = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (validValues.length === 0) return null;
  const sum = validValues.reduce((acc, curr) => acc + curr, 0);
  return sum / validValues.length;
}

/**
 * Calcule l'écart-type d'échantillon (SAMPLE : division par n - 1).
 * Recommandé pour les séries d'éprouvettes en métrologie de laboratoire.
 * Retourne null si n < 2.
 */
export function calculateSampleStdDev(values: (number | null | undefined)[]): number | null {
  const validValues = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const n = validValues.length;
  if (n < 2) return null;

  const mean = calculateMean(validValues);
  if (mean === null) return null;

  const sumSquaredDiffs = validValues.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / (n - 1));
}

/**
 * Calcule l'écart-type de population (POPULATION : division par n).
 * Retourne null si n < 1.
 */
export function calculatePopulationStdDev(values: (number | null | undefined)[]): number | null {
  const validValues = values.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const n = validValues.length;
  if (n < 1) return null;

  const mean = calculateMean(validValues);
  if (mean === null) return null;

  const sumSquaredDiffs = validValues.reduce((acc, curr) => acc + Math.pow(curr - mean, 2), 0);
  return Math.sqrt(sumSquaredDiffs / n);
}

/**
 * Calcule l'écart-type selon la méthode configurée dans le référentiel ('SAMPLE' ou 'POPULATION').
 */
export function calculateStdDevByMethod(
  values: (number | null | undefined)[],
  method: StandardDeviationMethod = 'SAMPLE'
): number | null {
  if (method === 'POPULATION') {
    return calculatePopulationStdDev(values);
  }
  return calculateSampleStdDev(values);
}

/**
 * Calcule le coefficient de variation en pourcentage : (stdDev / mean) * 100
 * Retourne null si la moyenne est 0, non définie ou si l'écart-type est null.
 */
export function calculateCoefficientOfVariation(
  values: (number | null | undefined)[],
  method: StandardDeviationMethod = 'SAMPLE'
): number | null {
  const mean = calculateMean(values);
  const stdDev = calculateStdDevByMethod(values, method);

  if (mean === null || stdDev === null || Math.abs(mean) < 1e-9) {
    return null;
  }

  return (stdDev / Math.abs(mean)) * 100;
}

/**
 * Arrondit un nombre avec une précision métrologique donnée (ex: 2 ou 3 décimales).
 */
export function roundMetric(value: number | null | undefined, decimals = 2): number | null {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}
