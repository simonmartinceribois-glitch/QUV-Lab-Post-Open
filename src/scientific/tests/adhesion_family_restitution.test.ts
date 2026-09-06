/**
 * QUV-Lab — Adhesion Family Restitution Tests (AFR-01 à AFR-07)
 * Validation de la restitution des résultats d'adhérence dans les rapports et exports.
 */

import { calculateAdhesionMetrics } from '../adhesionEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface AdhesionFamilyRestitutionTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runAdhesionFamilyRestitutionTests(): {
  results: AdhesionFamilyRestitutionTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: AdhesionFamilyRestitutionTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // AFR-01 : Format multi-mesures avec 2 mesures concordantes
  {
    const raw = {
      adhesionClass: 1 as const,
      measurements: [
        { measurementIndex: 1, adhesionClass: 1 as const },
        { measurementIndex: 2, adhesionClass: 1 as const }
      ]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.panelMean === 1 && comp.individualResults.length === 2;
    record('AFR-01', 'Multi-mesures (1, 1) restitue moyenne 1 et 2 mesures', ok, 'mean=1, count=2', `mean=${comp.panelMean}, count=${comp.individualResults.length}`);
  }

  // AFR-02 : Format multi-mesures avec 2 mesures divergentes
  {
    const raw = {
      adhesionClass: 2 as const,
      measurements: [
        { measurementIndex: 1, adhesionClass: 1 as const },
        { measurementIndex: 2, adhesionClass: 2 as const }
      ]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.panelMean === 1.5;
    record('AFR-02', 'Multi-mesures (1, 2) restitue moyenne 1.5', ok, 'mean=1.5', `mean=${comp.panelMean}`);
  }

  // AFR-03 : Écartement du peigne 2 mm restitué
  {
    const raw = {
      adhesionClass: 0 as const,
      gridSpacingMm: 2,
      measurements: [{ measurementIndex: 1, adhesionClass: 0 as const }]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.gridSpacingUsedMm === 2;
    record('AFR-03', 'Peigne 2 mm fidèlement restitué dans les métadonnées de calcul', ok, 'gridSpacing=2', `gridSpacing=${comp.gridSpacingUsedMm}`);
  }

  // AFR-04 : Épaisseur du revêtement restituée
  {
    const raw = {
      adhesionClass: 0 as const,
      coatingThicknessMicrons: 75,
      measurements: [{ measurementIndex: 1, adhesionClass: 0 as const }]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.coatingThicknessMicrons === 75;
    record('AFR-04', 'Épaisseur 75 µm fidèlement conservée', ok, 'thickness=75', `thickness=${comp.coatingThicknessMicrons}`);
  }

  // AFR-05 : Conformité du délai de quadrillage
  {
    const raw = {
      adhesionClass: 1 as const,
      elapsedTimeHours: 16,
      measurements: [{ measurementIndex: 1, adhesionClass: 1 as const }]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.delayCompliance !== undefined;
    record('AFR-05', 'Indicateur de conformité du délai restitué', ok, 'défini', String(comp.delayCompliance));
  }

  // AFR-06 : Restitution de la référence T0
  {
    const rawT0 = {
      adhesionClass: 0 as const,
      measurements: [{ measurementIndex: 1, adhesionClass: 0 as const }]
    };
    const ref = calculateAdhesionMetrics(rawT0, undefined, ruleSet);
    const rawC12 = {
      adhesionClass: 1 as const,
      measurements: [{ measurementIndex: 1, adhesionClass: 1 as const }]
    };
    const comp = calculateAdhesionMetrics(rawC12, ref, ruleSet);
    const ok = comp.deltaAdhesionClass === 1;
    record('AFR-06', 'ΔClasse calculé fidèlement par rapport à la référence T0', ok, 'delta=1', `delta=${comp.deltaAdhesionClass}`);
  }

  // AFR-07 : Préservation des observations qualitatives
  {
    const raw = {
      adhesionClass: 2 as const,
      observation: 'Léger écaillage aux intersections',
      measurements: [{ measurementIndex: 1, adhesionClass: 2 as const, observation: 'Léger écaillage aux intersections' }]
    };
    const comp = calculateAdhesionMetrics(raw, undefined, ruleSet);
    const ok = comp.individualResults[0]?.observation === 'Léger écaillage aux intersections';
    record('AFR-07', 'Observation qualitative individuelle préservée intacte', ok, 'préservée', String(comp.individualResults[0]?.observation));
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
