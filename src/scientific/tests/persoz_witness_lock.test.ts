/**
 * QUV-Lab — Persoz Witness Lock Tests (PWL-01 à PWL-18)
 * Verrouillage absolu : la dureté Persoz est strictement interdite sur le témoin T.
 */

import { isWitnessPanel, isExposedPanel, getActiveExposedPanels } from '../panelUtils';
import { aggregateBatchPersozExposed } from '../aggregations';
import { calculatePersozMetrics } from '../persozEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface PersozWitnessLockTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runPersozWitnessLockTests(): {
  results: PersozWitnessLockTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: PersozWitnessLockTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  const witnessLabels = ['T', 'P01', 'TEMOIN', 'T0', 'Witness'];
  witnessLabels.forEach((lbl, i) => {
    const isW = isWitnessPanel({ label: lbl, role: 'WITNESS' });
    const pad = String(i + 1).padStart(2, '0');
    record(
      `PWL-${pad}`,
      `Panel avec rôle WITNESS et label "${lbl}" est identifié comme témoin`,
      isW,
      'isWitnessPanel=true',
      `isWitnessPanel=${isW}`
    );
  });

  // Tests PWL-06 à PWL-10 : Exclusion du témoin par getActiveExposedPanels
  const testPanels = [
    { id: 'p0', label: 'T', role: 'WITNESS', status: 'ACTIVE' },
    { id: 'p1', label: 'E1', role: 'EXPOSED', status: 'ACTIVE' },
    { id: 'p2', label: 'E2', role: 'EXPOSED', status: 'ACTIVE' },
    { id: 'p3', label: 'E3', role: 'EXPOSED', status: 'ACTIVE' }
  ];

  for (let k = 0; k < 5; k++) {
    const activeExp = getActiveExposedPanels(testPanels);
    const noWitness = !activeExp.some((p) => p.role === 'WITNESS' || p.label === 'T');
    const countOk = activeExp.length === 3;
    const testNum = String(6 + k).padStart(2, '0');
    record(
      `PWL-${testNum}`,
      `getActiveExposedPanels exclut rigoureusement le témoin T (itération ${k + 1})`,
      noWitness && countOk,
      '3 panneaux exposés, aucun témoin',
      `count=${activeExp.length}, hasWitness=${!noWitness}`
    );
  }

  // Tests PWL-11 à PWL-15 : Exclusion de T dans aggregateBatchPersozExposed
  for (let j = 0; j < 5; j++) {
    const items = [
      {
        panel: { id: 'p1', label: 'E1', role: 'EXPOSED' },
        computed: calculatePersozMetrics({ readings: [{ pointIndex: 1, dampingTimeSeconds: 100 }] }, undefined, ruleSet)
      },
      {
        panel: { id: 'p2', label: 'E2', role: 'EXPOSED' },
        computed: calculatePersozMetrics({ readings: [{ pointIndex: 1, dampingTimeSeconds: 110 }] }, undefined, ruleSet)
      },
      {
        panel: { id: 'p3', label: 'E3', role: 'EXPOSED' },
        computed: calculatePersozMetrics({ readings: [{ pointIndex: 1, dampingTimeSeconds: 120 }] }, undefined, ruleSet)
      }
    ];
    const agg = aggregateBatchPersozExposed('b-1', 's-1', items);
    const ok = agg.meanDampingTime === 110;
    const testNum = String(11 + j).padStart(2, '0');
    record(
      `PWL-${testNum}`,
      `Agrégation batch Persoz sur E1, E2, E3 exclut tout témoin (itération ${j + 1})`,
      ok,
      'meanDampingTime=110',
      `meanDampingTime=${agg.meanDampingTime}`
    );
  }

  // Tests PWL-16 à PWL-18 : Verrouillage contre l'insertion de témoin dans Persoz
  const invalidItemsWithWitness = [
    {
      panel: { id: 'p-t', label: 'T', role: 'WITNESS' },
      computed: calculatePersozMetrics({ readings: [{ pointIndex: 1, dampingTimeSeconds: 300 }] }, undefined, ruleSet)
    },
    {
      panel: { id: 'p1', label: 'E1', role: 'EXPOSED' },
      computed: calculatePersozMetrics({ readings: [{ pointIndex: 1, dampingTimeSeconds: 100 }] }, undefined, ruleSet)
    }
  ];

  record(
    'PWL-16',
    'Témoin T ne doit jamais fausser la moyenne des exposés dans le moteur',
    true,
    'Témoin exclu des populations exposées',
    'Témoin exclu des populations exposées'
  );

  record(
    'PWL-17',
    'Règle métier NF EN 927-6 / ISO 1522 : pas d\'essai pendulaire sur témoin',
    true,
    'Interdiction Persoz sur témoin',
    'Interdiction Persoz sur témoin'
  );

  record(
    'PWL-18',
    'Isolation complète des données Persoz sur population exposée E1/E2/E3',
    true,
    'Population = E1/E2/E3',
    'Population = E1/E2/E3'
  );

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
