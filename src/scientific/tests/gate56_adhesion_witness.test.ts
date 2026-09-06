/**
 * QUV-Lab — Gate 5.6 Tests : Référence T0 Adhésion Témoin
 * Validation du témoin T comme référence d'adhésion initiale et de son exclusion des exposés.
 */

import { isWitnessPanel, isExposedPanel, getWitnessPanel } from '../panelUtils';
import { calculateAdhesionMetrics, ISO2409_CLASSES } from '../adhesionEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface Gate56TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runGate56AdhesionWitnessTests(): {
  results: Gate56TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate56TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // G56-W01 : Témoin T est correctement identifié comme WITNESS
  {
    const witness = { id: 'p-t', label: 'T', roleCode: 'T', role: 'WITNESS' };
    const isW = isWitnessPanel(witness);
    const isExp = isExposedPanel(witness);
    record(
      'G56-W01',
      'Témoin T est identifié comme witness et exclu des exposés',
      isW && !isExp,
      'isWitness=true, isExposed=false',
      `isWitness=${isW}, isExposed=${isExp}`
    );
  }

  // G56-W02 : Mesure d\'adhésion initiale T0 sur Témoin T valide
  {
    const rawAdh = {
      adhesionClass: 0 as const,
      gridSpacingMm: 2,
      coatingThicknessMicrons: 50,
      elapsedTimeHours: 0,
      measurements: [
        { measurementIndex: 1, adhesionClass: 0 as const },
        { measurementIndex: 2, adhesionClass: 0 as const }
      ]
    };
    const res = calculateAdhesionMetrics(rawAdh, undefined, ruleSet);
    const valid = res.adhesionClass === 0 && res.individualResults.length === 2;
    record(
      'G56-W02',
      'Mesure adhésion initiale T0 sur Témoin T calcule Classe 0 sans altération',
      valid,
      'adhesionClass=0, 2 mesures',
      `adhesionClass=${res.adhesionClass}, count=${res.individualResults.length}`
    );
  }

  // G56-W03 : Témoin T utilisé comme référence initiale T0 pour calcul de ΔClasse
  {
    const rawT0 = {
      adhesionClass: 0 as const,
      gridSpacingMm: 2,
      measurements: [{ measurementIndex: 1, adhesionClass: 0 as const }]
    };
    const refT0 = calculateAdhesionMetrics(rawT0, undefined, ruleSet);

    const rawC12 = {
      adhesionClass: 2 as const,
      gridSpacingMm: 2,
      measurements: [{ measurementIndex: 1, adhesionClass: 2 as const }]
    };
    const resC12 = calculateAdhesionMetrics(rawC12, refT0, ruleSet);
    const deltaOk = resC12.deltaAdhesionClass === 2;
    record(
      'G56-W03',
      'Référence T0 témoin permet le calcul différentiel exact de ΔClasse au jalon final',
      deltaOk,
      'deltaAdhesionClass=2',
      `deltaAdhesionClass=${resC12.deltaAdhesionClass}`
    );
  }

  // G56-W04 : Classement NF EN ISO 2409 conforme pour la référence
  {
    const classInfo = ISO2409_CLASSES[0];
    const ok = classInfo && classInfo.rating === 0 && classInfo.affectedAreaPercent === '0 %';
    record(
      'G56-W04',
      'Référentiel ISO 2409 Classe 0 correspond à 0 % décollement',
      !!ok,
      'rating=0, affectedAreaPercent=0 %',
      `rating=${classInfo?.rating}, area=${classInfo?.affectedAreaPercent}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
