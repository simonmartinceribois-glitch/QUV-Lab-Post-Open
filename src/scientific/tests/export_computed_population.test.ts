/**
 * QUV-Lab — Export Computed Population Tests (ECP-01 à ECP-15)
 * Validation du verrouillage de la population admissible pour l'export CSV COMPUTED.
 */

import { isComputedExportAdmissible } from '../../services/reportGenerator';

export interface ExportComputedPopulationTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runExportComputedPopulationTests(): {
  results: ExportComputedPopulationTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: ExportComputedPopulationTestResult[] = [];

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  const witness = { label: 'T', role: 'WITNESS' };
  const exposedE1 = { label: 'E1', role: 'EXPOSED' };
  const exposedE2 = { label: 'E2', role: 'EXPOSED' };
  const exposedE3 = { label: 'E3', role: 'EXPOSED' };

  // ECP-01 à ECP-03 : PERSOZ admissible uniquement sur E1/E2/E3, interdit sur T
  {
    const st0 = { cycleIndex: 0 };
    const st6 = { cycleIndex: 6 };
    record('ECP-01', 'PERSOZ admissible sur E1 à T0', isComputedExportAdmissible('PERSOZ', exposedE1, st0), 'true', 'true');
    record('ECP-02', 'PERSOZ admissible sur E2 à C6', isComputedExportAdmissible('PERSOZ', exposedE2, st6), 'true', 'true');
    record('ECP-03', 'PERSOZ strictement INTERDIT sur Témoin T à T0', !isComputedExportAdmissible('PERSOZ', witness, st0), 'false', 'false');
  }

  // ECP-04 à ECP-07 : COLOR admissible sur E1/E2/E3, exclu sur T des stats exposées
  {
    const st0 = { cycleIndex: 0 };
    record('ECP-04', 'COLOR admissible sur E1', isComputedExportAdmissible('COLOR', exposedE1, st0), 'true', 'true');
    record('ECP-05', 'COLOR admissible sur E2', isComputedExportAdmissible('COLOR', exposedE2, st0), 'true', 'true');
    record('ECP-06', 'COLOR admissible sur E3', isComputedExportAdmissible('COLOR', exposedE3, st0), 'true', 'true');
    record('ECP-07', 'COLOR exclu pour témoin T des stats exposées', !isComputedExportAdmissible('COLOR', witness, st0), 'false', 'false');
  }

  // ECP-08 à ECP-11 : GLOSS admissible sur E1/E2/E3, exclu sur T
  {
    const st6 = { cycleIndex: 6 };
    record('ECP-08', 'GLOSS admissible sur E1', isComputedExportAdmissible('GLOSS', exposedE1, st6), 'true', 'true');
    record('ECP-09', 'GLOSS admissible sur E2', isComputedExportAdmissible('GLOSS', exposedE2, st6), 'true', 'true');
    record('ECP-10', 'GLOSS admissible sur E3', isComputedExportAdmissible('GLOSS', exposedE3, st6), 'true', 'true');
    record('ECP-11', 'GLOSS exclu pour témoin T', !isComputedExportAdmissible('GLOSS', witness, st6), 'false', 'false');
  }

  // ECP-12 à ECP-15 : ADHESION admissible à T0 et C12, rejeté de C1 à C11
  {
    const st0 = { cycleIndex: 0 };
    const st6 = { cycleIndex: 6 };
    const st12 = { cycleIndex: 12 };
    record('ECP-12', 'ADHESION admissible à T0 sur témoin', isComputedExportAdmissible('ADHESION', witness, st0), 'true', 'true');
    record('ECP-13', 'ADHESION admissible à C12 sur E1', isComputedExportAdmissible('ADHESION', exposedE1, st12), 'true', 'true');
    record('ECP-14', 'ADHESION rejeté à C6 sur E1', !isComputedExportAdmissible('ADHESION', exposedE1, st6), 'false', 'false');
    record('ECP-15', 'ADHESION rejeté à C6 sur témoin T', !isComputedExportAdmissible('ADHESION', witness, st6), 'false', 'false');
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
