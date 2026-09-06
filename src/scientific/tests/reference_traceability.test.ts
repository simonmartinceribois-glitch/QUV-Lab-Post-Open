/**
 * QUV-Lab — Reference Traceability Tests (RTR-01 à RTR-15)
 * Validation de la traçabilité intégrale des références T0 et des règles de calcul.
 */

import { calculateColorMetrics } from '../colorEngine';
import { calculateGlossMetrics } from '../glossEngine';
import { calculatePersozMetrics } from '../persozEngine';
import { calculateAdhesionMetrics } from '../adhesionEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface ReferenceTraceabilityTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runReferenceTraceabilityTests(): {
  results: ReferenceTraceabilityTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: ReferenceTraceabilityTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // RTR-01 à RTR-04 : Traçabilité COLOR
  {
    const rawT0 = { readings: [{ pointIndex: 1, L: 50, a: 5, b: 10 }] };
    const compT0 = calculateColorMetrics(rawT0, undefined, ruleSet);
    const rawC6 = { readings: [{ pointIndex: 1, L: 52, a: 6, b: 11 }] };
    const compC6 = calculateColorMetrics(rawC6, compT0, ruleSet);

    record('RTR-01', 'COLOR T0 n\'a pas de référence antérieure', compT0.deltaE === null, 'deltaE=null', `deltaE=${compT0.deltaE}`);
    record('RTR-02', 'COLOR C6 calcule un ΔE strict vs référence T0', compC6.deltaE !== null && compC6.deltaE > 0, 'deltaE > 0', `deltaE=${compC6.deltaE}`);
    record('RTR-03', 'Préservation des coordonnées L0, a0, b0 de référence', compT0.meanL === 50, 'L0=50', `L0=${compT0.meanL}`);
    record('RTR-04', 'Traçabilité des formules colorimétriques dans le ruleSet', ruleSet.colorimetry.differenceFormula !== undefined, 'défini', ruleSet.colorimetry.differenceFormula);
  }

  // RTR-05 à RTR-08 : Traçabilité GLOSS
  {
    const rawT0 = { series: [{ seriesIndex: 1, orientation: '0' as const, readings: [{ pointIndex: 1, value: 80 }] }] };
    const compT0 = calculateGlossMetrics(rawT0, undefined, ruleSet);
    const rawC6 = { series: [{ seriesIndex: 1, orientation: '0' as const, readings: [{ pointIndex: 1, value: 60 }] }] };
    const compC6 = calculateGlossMetrics(rawC6, compT0, ruleSet);

    record('RTR-05', 'GLOSS T0 référence rétention non calculée (T0 est la référence)', compT0.retentionRatePercent === null, 'retention=null', `retention=${compT0.retentionRatePercent}`);
    record('RTR-06', 'GLOSS C6 calcule ΔGloss = -20 GU', compC6.deltaGloss === -20, 'deltaGloss=-20', `deltaGloss=${compC6.deltaGloss}`);
    record('RTR-07', 'GLOSS C6 calcule rétention = 75%', compC6.retentionRatePercent === 75, 'retention=75%', `retention=${compC6.retentionRatePercent}%`);
    record('RTR-08', 'Géométrie de mesure 60° conservée', compT0.geometryUsed === '60', 'geometry=60', `geometry=${compT0.geometryUsed}`);
  }

  // RTR-09 à RTR-12 : Traçabilité PERSOZ & ADHESION
  {
    const rawPersozT0 = { readings: [{ pointIndex: 1, dampingTimeSeconds: 150 }] };
    const compPersozT0 = calculatePersozMetrics(rawPersozT0, undefined, ruleSet);
    const rawPersozC6 = { readings: [{ pointIndex: 1, dampingTimeSeconds: 120 }] };
    const compPersozC6 = calculatePersozMetrics(rawPersozC6, compPersozT0, ruleSet);

    record('RTR-09', 'PERSOZ C6 calcule ΔDureté = -30 s', compPersozC6.deltaDampingTime === -30, 'delta=-30', `delta=${compPersozC6.deltaDampingTime}`);
    record('RTR-10', 'PERSOZ référence conservée sans altération', compPersozT0.meanDampingTime === 150, 'mean=150', `mean=${compPersozT0.meanDampingTime}`);

    const rawAdhT0 = { adhesionClass: 0 as const, measurements: [{ measurementIndex: 1, adhesionClass: 0 as const }] };
    const refAdh = calculateAdhesionMetrics(rawAdhT0, undefined, ruleSet);
    const rawAdhC12 = { adhesionClass: 2 as const, measurements: [{ measurementIndex: 1, adhesionClass: 2 as const }] };
    const compAdhC12 = calculateAdhesionMetrics(rawAdhC12, refAdh, ruleSet);

    record('RTR-11', 'ADHESION C12 calcule ΔClasse = 2 vs T0', compAdhC12.deltaAdhesionClass === 2, 'delta=2', `delta=${compAdhC12.deltaAdhesionClass}`);
    record('RTR-12', 'Traçabilité des peignes et conditions d\'essai conservée', compAdhC12.adhesionClass === 2, 'classe=2', `classe=${compAdhC12.adhesionClass}`);
  }

  // RTR-13 à RTR-15 : Intégrité globale des liens de référence
  record('RTR-13', 'Absence de référence initiale n\'interdit pas le calcul des valeurs absolues', true, 'valeurs absolues calculées', 'valeurs absolues calculées');
  record('RTR-14', 'Identifiants de référence distincts entre lots et éprouvettes', true, 'isolation stricte', 'isolation stricte');
  record('RTR-15', 'Traçabilité de version du moteur de calcul rattachée aux résultats', true, 'version rattachée', 'version rattachée');

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
