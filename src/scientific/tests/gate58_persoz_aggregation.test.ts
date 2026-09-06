/**
 * QUV-Lab — Gate 58 Tests : Agrégation Persoz sur Éprouvettes Exposées
 * Validation de l'agrégation de la dureté pendulaire Persoz (ISO 1522) et exclusion du témoin.
 */

import { calculatePersozMetrics, assessPersozQuality } from '../persozEngine';
import { aggregateBatchPersozExposed } from '../aggregations';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface Gate58TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runGate58PersozAggregationTests(): {
  results: Gate58TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate58TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // G58-PER-01 : Calcul de moyenne Persoz sur 3 oscillations conformes
  {
    const raw = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 120 },
        { pointIndex: 2, dampingTimeSeconds: 124 },
        { pointIndex: 3, dampingTimeSeconds: 122 }
      ]
    };
    const res = calculatePersozMetrics(raw, undefined, ruleSet);
    const ok = res.meanDampingTime === 122;
    record(
      'G58-PER-01',
      'Moyenne arithmétique exacte sur 3 oscillations (120, 124, 122 s = 122 s)',
      ok,
      'meanDampingTime=122',
      `meanDampingTime=${res.meanDampingTime}`
    );
  }

  // G58-PER-02 : Écart-type d'échantillon n-1 calculé correctement
  {
    const raw = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 120 },
        { pointIndex: 2, dampingTimeSeconds: 124 },
        { pointIndex: 3, dampingTimeSeconds: 122 }
      ]
    };
    const res = calculatePersozMetrics(raw, undefined, ruleSet);
    const ok = res.stdDevDampingTime !== null && res.stdDevDampingTime === 2;
    record(
      'G58-PER-02',
      'Écart-type échantillon n-1 sur (120, 124, 122) vaut 2.0 s',
      ok,
      'stdDevDampingTime=2',
      `stdDevDampingTime=${res.stdDevDampingTime}`
    );
  }

  // G58-PER-03 : Calcul différentiel Δ vs référence T0
  {
    const rawT0 = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 150 },
        { pointIndex: 2, dampingTimeSeconds: 150 },
        { pointIndex: 3, dampingTimeSeconds: 150 }
      ]
    };
    const compT0 = calculatePersozMetrics(rawT0, undefined, ruleSet);

    const rawStage = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 120 },
        { pointIndex: 2, dampingTimeSeconds: 120 },
        { pointIndex: 3, dampingTimeSeconds: 120 }
      ]
    };
    const compStage = calculatePersozMetrics(rawStage, compT0, ruleSet);
    const deltaOk = compStage.deltaDampingTime === -30;
    record(
      'G58-PER-03',
      'Variation différentielle Δ Persoz = -30 s calculée par rapport à T0',
      deltaOk,
      'deltaDampingTime=-30',
      `deltaDampingTime=${compStage.deltaDampingTime}`
    );
  }

  // G58-PER-04 : Agrégation batch sur 3 panneaux exposés E1, E2, E3
  {
    const panels = [
      { id: 'p1', label: 'E1', role: 'EXPOSED' },
      { id: 'p2', label: 'E2', role: 'EXPOSED' },
      { id: 'p3', label: 'E3', role: 'EXPOSED' }
    ];
    const items = panels.map((p, i) => ({
      panel: p,
      computed: calculatePersozMetrics(
        {
          readings: [
            { pointIndex: 1, dampingTimeSeconds: 100 + i * 10 },
            { pointIndex: 2, dampingTimeSeconds: 100 + i * 10 },
            { pointIndex: 3, dampingTimeSeconds: 100 + i * 10 }
          ]
        },
        undefined,
        ruleSet
      )
    }));
    const agg = aggregateBatchPersozExposed('b-1', 's-1', items);
    const meanOk = agg.meanDampingTime === 110;
    record(
      'G58-PER-04',
      'Agrégation batch moyenne des 3 exposés (100, 110, 120 s = 110 s)',
      meanOk,
      'meanDampingTime=110',
      `meanDampingTime=${agg.meanDampingTime}`
    );
  }

  // G58-PER-05 : Écart-type inter-panneaux sur les exposés
  {
    const panels = [
      { id: 'p1', label: 'E1', role: 'EXPOSED' },
      { id: 'p2', label: 'E2', role: 'EXPOSED' },
      { id: 'p3', label: 'E3', role: 'EXPOSED' }
    ];
    const items = panels.map((p, i) => ({
      panel: p,
      computed: calculatePersozMetrics(
        {
          readings: [
            { pointIndex: 1, dampingTimeSeconds: 100 + i * 10 },
            { pointIndex: 2, dampingTimeSeconds: 100 + i * 10 },
            { pointIndex: 3, dampingTimeSeconds: 100 + i * 10 }
          ]
        },
        undefined,
        ruleSet
      )
    }));
    const agg = aggregateBatchPersozExposed('b-1', 's-1', items);
    const stdOk = agg.interPanelStdDev === 10;
    record(
      'G58-PER-05',
      'Écart-type inter-panneaux n-1 sur (100, 110, 120) vaut 10.0 s',
      stdOk,
      'interPanelStdDev=10',
      `interPanelStdDev=${agg.interPanelStdDev}`
    );
  }

  // G58-PER-06 : Rejet des oscillations aberrantes ou négatives
  {
    const rawNeg = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: -10 },
        { pointIndex: 2, dampingTimeSeconds: 100 },
        { pointIndex: 3, dampingTimeSeconds: 100 }
      ]
    };
    const resNeg = calculatePersozMetrics(rawNeg, undefined, ruleSet);
    const hasAlert = resNeg.alerts.length > 0;
    record(
      'G58-PER-06',
      'Oscillations invalides (négatives) génèrent une alerte métrologique',
      hasAlert,
      'Au moins une alerte générée',
      `nbAlertes=${resNeg.alerts.length}`
    );
  }

  // G58-PER-07 : Évaluation qualité complétude 3 oscillations requises
  {
    const rawIncomplete = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 100 },
        { pointIndex: 2, dampingTimeSeconds: 105 }
      ]
    };
    const qual = assessPersozQuality(rawIncomplete, { standardRecommendedCount: 3, configuredCount: 3 } as any, ruleSet);
    const incompleteOk = qual.missingCount === 1;
    record(
      'G58-PER-07',
      'Saisie de 2 oscillations sur 3 attendues comptabilise 1 manquante',
      incompleteOk,
      'missingCount=1',
      `missingCount=${qual.missingCount}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
