/**
 * QUV-Lab — Adhesion Target Lock Tests (ATL-01 à ATL-11)
 * Validation du verrouillage de la famille ADHESION exclusivement aux jalons T0 (0 h) et C12 (2016 h).
 */

import { isFamilyScheduledForStage, isMandatoryStage } from '../panelUtils';

export interface AdhesionTargetLockTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runAdhesionTargetLockTests(): {
  results: AdhesionTargetLockTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: AdhesionTargetLockTestResult[] = [];

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // ATL-01 : T0 (0 h, cycleIndex: 0) est autorisé et programmé pour ADHESION
  {
    const st0 = { cycleIndex: 0, stageType: 'INITIAL_PRE_EXPOSURE', scheduledExposureHours: 0 };
    const ok = isFamilyScheduledForStage('ADHESION', st0);
    record('ATL-01', 'Adhésion programmée à T0 (cycleIndex 0)', ok, 'true', String(ok));
  }

  // ATL-02 : C12 (2016 h, cycleIndex: 12) est autorisé et programmé pour ADHESION
  {
    const st12 = { cycleIndex: 12, stageType: 'FINAL_POST_EXPOSURE', scheduledExposureHours: 2016 };
    const ok = isFamilyScheduledForStage('ADHESION', st12);
    record('ATL-02', 'Adhésion programmée à C12 (cycleIndex 12)', ok, 'true', String(ok));
  }

  // ATL-03 à ATL-09 : Jalons intermédiaires C1 à C7 STRICTEMENT INTERDITS
  for (let c = 1; c <= 7; c++) {
    const st = { cycleIndex: c, stageType: 'INTERMEDIATE_DURING_EXPOSURE', scheduledExposureHours: c * 168 };
    const scheduled = isFamilyScheduledForStage('ADHESION', st);
    const pad = String(2 + c).padStart(2, '0');
    record(
      `ATL-${pad}`,
      `Adhésion interdite au jalon intermédiaire C${c} (${c * 168} h)`,
      !scheduled,
      'false',
      String(scheduled)
    );
  }

  // ATL-10 : Jalons C8 à C11 STRICTEMENT INTERDITS
  {
    let anyAllowed = false;
    for (let c = 8; c <= 11; c++) {
      const st = { cycleIndex: c, stageType: 'INTERMEDIATE_DURING_EXPOSURE', scheduledExposureHours: c * 168 };
      if (isFamilyScheduledForStage('ADHESION', st)) anyAllowed = true;
    }
    record(
      'ATL-10',
      'Adhésion interdite sur l\'ensemble des jalons C8 à C11',
      !anyAllowed,
      'false pour tous',
      anyAllowed ? 'Au moins un jalon autorisé' : 'false pour tous'
    );
  }

  // ATL-11 : isMandatoryStage confirme T0 et C12 obligatoires
  {
    const st0 = { cycleIndex: 0 };
    const st12 = { cycleIndex: 12 };
    const st5 = { cycleIndex: 5 };
    const ok = isMandatoryStage(st0) && isMandatoryStage(st12) && !isMandatoryStage(st5);
    record(
      'ATL-11',
      'isMandatoryStage confirme que seuls T0 et C12 sont obligatoires',
      ok,
      'T0=true, C12=true, C5=false',
      `T0=${isMandatoryStage(st0)}, C12=${isMandatoryStage(st12)}, C5=${isMandatoryStage(st5)}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
