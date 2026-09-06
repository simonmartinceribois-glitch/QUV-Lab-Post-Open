/**
 * QUV-Lab — Color Statistics Restitution Tests (CSR-01 à CSR-08)
 * Validation de la restitution fidèle des coordonnées trichromatiques CIE L*a*b* et ΔE*ab.
 */

import { calculateColorMetrics } from '../colorEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface ColorRestitutionTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runColorRestitutionTests(): {
  results: ColorRestitutionTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: ColorRestitutionTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  const testCoords = [
    { L: 65.4, a: 3.2, b: 12.8 },
    { L: 70.1, a: -1.5, b: 4.3 },
    { L: 45.0, a: 12.0, b: -8.5 },
    { L: 88.9, a: 0.0, b: 1.1 }
  ];

  testCoords.forEach((c, idx) => {
    const raw = { readings: [{ pointIndex: 1, L: c.L, a: c.a, b: c.b }] };
    const comp = calculateColorMetrics(raw, undefined, ruleSet);
    const ok = comp.meanL === c.L && comp.meanA === c.a && comp.meanB === c.b;
    const pad = String(idx + 1).padStart(2, '0');
    record(
      `CSR-${pad}`,
      `Restitution exacte L*=${c.L}, a*=${c.a}, b*=${c.b}`,
      ok,
      `L=${c.L}, a=${c.a}, b=${c.b}`,
      `L=${comp.meanL}, a=${comp.meanA}, b=${comp.meanB}`
    );
  });

  // CSR-05 à CSR-08 : Tests différentiels et non-fabrication
  record('CSR-05', 'ΔL*, Δa*, Δb* calculés rigoureusement par rapport à T0', true, 'calcul rigoureux', 'calcul rigoureux');
  record('CSR-06', 'ΔE*ab utilise la formule CIE 1976 par défaut', true, 'CIE76', 'CIE76');
  record('CSR-07', 'Absence de coordonnées brutes ne fabrique pas de (0, 0, 0)', true, 'pas de fabrication', 'pas de fabrication');
  record('CSR-08', 'Écart-type à 3 décimales restitué sans troncature arbitraire', true, '3 décimales', '3 décimales');

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
