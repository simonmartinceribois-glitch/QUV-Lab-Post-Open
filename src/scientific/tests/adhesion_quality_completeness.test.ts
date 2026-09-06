/**
 * QUV-Lab — Adhesion Quality Completeness Tests (AQC-01 à AQC-15)
 * Validation de la complétude d'adhésion : obligatoire à T0 et C12, ignorée de C1 à C11.
 */

import { assessAdhesionQuality } from '../adhesionEngine';
import { isFamilyScheduledForStage, getActiveFamiliesForStage } from '../panelUtils';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface AdhesionQualityCompletenessTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runAdhesionQualityCompletenessTests(): {
  results: AdhesionQualityCompletenessTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: AdhesionQualityCompletenessTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  const families = ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'];

  // AQC-01 : T0 inclut ADHESION dans ses familles actives
  {
    const st0 = { cycleIndex: 0, scheduledExposureHours: 0 };
    const act = getActiveFamiliesForStage(families, st0);
    const hasAdh = act.includes('ADHESION');
    record('AQC-01', 'T0 inclut ADHESION dans getActiveFamiliesForStage', hasAdh, 'true', String(hasAdh));
  }

  // AQC-02 : C12 inclut ADHESION dans ses familles actives
  {
    const st12 = { cycleIndex: 12, scheduledExposureHours: 2016 };
    const act = getActiveFamiliesForStage(families, st12);
    const hasAdh = act.includes('ADHESION');
    record('AQC-02', 'C12 inclut ADHESION dans getActiveFamiliesForStage', hasAdh, 'true', String(hasAdh));
  }

  // AQC-03 à AQC-11 : C1 à C9 excluent ADHESION des familles actives
  for (let c = 1; c <= 9; c++) {
    const st = { cycleIndex: c, scheduledExposureHours: c * 168 };
    const act = getActiveFamiliesForStage(families, st);
    const hasAdh = act.includes('ADHESION');
    const pad = String(2 + c).padStart(2, '0');
    record(
      `AQC-${pad}`,
      `Jalon C${c} exclut formellement ADHESION des familles actives`,
      !hasAdh,
      'false',
      String(hasAdh)
    );
  }

  // AQC-12 : C10 et C11 excluent ADHESION
  {
    const st10 = { cycleIndex: 10, scheduledExposureHours: 1680 };
    const st11 = { cycleIndex: 11, scheduledExposureHours: 1848 };
    const act10 = getActiveFamiliesForStage(families, st10);
    const act11 = getActiveFamiliesForStage(families, st11);
    const ok = !act10.includes('ADHESION') && !act11.includes('ADHESION');
    record('AQC-12', 'Jalons C10 et C11 excluent ADHESION des familles actives', ok, 'false pour C10 et C11', `C10=${act10.includes('ADHESION')}, C11=${act11.includes('ADHESION')}`);
  }

  // AQC-13 : assessAdhesionQuality avec 2 mesures complètes = 100% complétude
  {
    const rawComplete = {
      adhesionClass: 1 as any,
      measurements: [
        { measurementIndex: 1, adhesionClass: 1 as any },
        { measurementIndex: 2, adhesionClass: 1 as any }
      ]
    };
    const qual = assessAdhesionQuality(rawComplete, { standardRecommendedCount: 2, configuredCount: 2 } as any, ruleSet);
    const ok = qual.completenessPercent === 100 && qual.status === 'CONFORMANT';
    record('AQC-13', 'Saisie 2 mesures complète = 100% et statut CONFORMANT', ok, '100% CONFORMANT', `${qual.completenessPercent}% ${qual.status}`);
  }

  // AQC-14 : assessAdhesionQuality avec 1 mesure sur 2 = 50% complétude
  {
    const rawPartial = {
      adhesionClass: 1 as any,
      measurements: [{ measurementIndex: 1, adhesionClass: 1 as any }]
    };
    const qual = assessAdhesionQuality(rawPartial, { standardRecommendedCount: 2, configuredCount: 2 } as any, ruleSet);
    const ok = qual.completenessPercent === 50 && qual.missingCount === 1;
    record('AQC-14', 'Saisie 1 mesure sur 2 attendues = 50% et 1 manquante', ok, '50% missingCount=1', `${qual.completenessPercent}% missing=${qual.missingCount}`);
  }

  // AQC-15 : assessAdhesionQuality vide = 0% complétude
  {
    const rawEmpty = { adhesionClass: null as any, measurements: [] };
    const qual = assessAdhesionQuality(rawEmpty, { standardRecommendedCount: 2, configuredCount: 2 } as any, ruleSet);
    const ok = qual.completenessPercent === 0 && qual.actualCount === 0;
    record('AQC-15', 'Saisie vide = 0% complétude et actualCount=0', ok, '0% actualCount=0', `${qual.completenessPercent}% actualCount=${qual.actualCount}`);
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
