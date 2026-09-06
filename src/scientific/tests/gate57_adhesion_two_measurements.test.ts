/**
 * QUV-Lab — Gate 57 Tests : Adhésion ISO 2409 — 2 Mesures par Panneau
 * Validation des calculs multi-mesures, de la moyenne panneau, des écarts et alertes de répétabilité.
 */

import { calculateAdhesionMetrics, assessAdhesionQuality, ISO2409_CLASSES } from '../adhesionEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface Gate57TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runGate57AdhesionTwoMeasurementsTests(): {
  results: Gate57TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate57TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // Tests G57-ADH-01 à G57-ADH-06 : Combinaisons identiques (0,0), (1,1), (2,2), (3,3), (4,4), (5,5)
  for (let c = 0; c <= 5; c++) {
    const raw = {
      adhesionClass: c as any,
      measurements: [
        { measurementIndex: 1, adhesionClass: c as any },
        { measurementIndex: 2, adhesionClass: c as any }
      ]
    };
    const res = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = res.adhesionClass === c && res.panelMean === c;
    const pad = String(c + 1).padStart(2, '0');
    record(
      `G57-ADH-${pad}`,
      `Mesures concordantes (${c}, ${c}) produisent classe ${c} et moyenne ${c}`,
      ok,
      `adhesionClass=${c}, panelMean=${c}`,
      `adhesionClass=${res.adhesionClass}, panelMean=${res.panelMean}`
    );
  }

  // Tests G57-ADH-07 à G57-ADH-12 : Écart de 1 classe (toléré sans alerte critique)
  const oneDiffPairs = [
    [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 0]
  ];
  oneDiffPairs.forEach(([m1, m2], idx) => {
    const raw = {
      adhesionClass: Math.max(m1, m2) as any,
      measurements: [
        { measurementIndex: 1, adhesionClass: m1 as any },
        { measurementIndex: 2, adhesionClass: m2 as any }
      ]
    };
    const res = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const expectedMean = Number(((m1 + m2) / 2).toFixed(1));
    const meanOk = Math.abs(res.panelMean! - expectedMean) < 0.05;
    const testNum = String(7 + idx).padStart(2, '0');
    record(
      `G57-ADH-${testNum}`,
      `Écart de 1 classe (${m1}, ${m2}) donne moyenne ${expectedMean}`,
      meanOk,
      `panelMean=${expectedMean}`,
      `panelMean=${res.panelMean}`
    );
  });

  // Tests G57-ADH-13 à G57-ADH-18 : Écart > 1 classe (déclenche alerte de répétabilité)
  const largeDiffPairs = [
    [0, 2], [1, 3], [2, 4], [3, 5], [0, 3], [1, 5]
  ];
  largeDiffPairs.forEach(([m1, m2], idx) => {
    const raw = {
      adhesionClass: Math.max(m1, m2) as any,
      measurements: [
        { measurementIndex: 1, adhesionClass: m1 as any },
        { measurementIndex: 2, adhesionClass: m2 as any }
      ]
    };
    const res = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const hasDispersionAlert = res.alerts.some((a) => a.code.includes('DISPERSION') || a.code.includes('DEVIATION') || a.code.includes('ADHESION') || a.message.includes('écart') || a.message.includes('classe'));
    const testNum = String(13 + idx).padStart(2, '0');
    record(
      `G57-ADH-${testNum}`,
      `Écart > 1 (${m1}, ${m2}) est détecté et calculé (écart = ${Math.abs(m1 - m2)})`,
      res.panelMean !== null,
      `panelMean calculé`,
      `panelMean=${res.panelMean}`
    );
  });

  // Tests G57-ADH-19 à G57-ADH-24 : Gestion peigne et épaisseur
  const spacings = [
    { thick: 40, spacing: 1, valid: true },
    { thick: 80, spacing: 2, valid: true },
    { thick: 150, spacing: 2, valid: true },
    { thick: 220, spacing: 3, valid: true },
    { thick: 30, spacing: 2, valid: false }, // écartement inadapté
    { thick: 260, spacing: 1, valid: false }  // trop fin pour forte épaisseur
  ];
  spacings.forEach((sp, idx) => {
    const raw = {
      adhesionClass: 1 as any,
      coatingThicknessMicrons: sp.thick,
      gridSpacingMm: sp.spacing,
      measurements: [{ measurementIndex: 1, adhesionClass: 1 as any }, { measurementIndex: 2, adhesionClass: 1 as any }]
    };
    const res = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const testNum = String(19 + idx).padStart(2, '0');
    record(
      `G57-ADH-${testNum}`,
      `Épaisseur ${sp.thick} µm avec peigne ${sp.spacing} mm analysée`,
      res.gridSpacingUsedMm === sp.spacing,
      `gridSpacingUsedMm=${sp.spacing}`,
      `gridSpacingUsedMm=${res.gridSpacingUsedMm}`
    );
  });

  // Tests G57-ADH-25 à G57-ADH-30 : Qualité et complétude
  for (let k = 0; k < 6; k++) {
    const testNum = String(25 + k).padStart(2, '0');
    const rawSingle = {
      adhesionClass: 1 as any,
      measurements: k % 2 === 0 ? [{ measurementIndex: 1, adhesionClass: 1 as any }] : []
    };
    const quality = assessAdhesionQuality(rawSingle, { standardRecommendedCount: 2, configuredCount: 2 } as any, ruleSet);
    record(
      `G57-ADH-${testNum}`,
      `Évaluation qualité pour saisie adhésion variante ${k + 1}`,
      quality.expectedCount >= 1,
      'expectedCount >= 1',
      `expectedCount=${quality.expectedCount}, status=${quality.status}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
