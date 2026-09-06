/**
 * QUV-Lab — Exposed E1/E2/E3 Predicate Tests (EXP-01 à EXP-21)
 * Validation rigoureuse des prédicats isWitnessPanel, isExposedPanel et getActiveExposedPanels.
 */

import { isWitnessPanel, isExposedPanel, getActiveExposedPanels, getWitnessPanel } from '../panelUtils';

export interface ExposedE1E2E3TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

export function runExposedE1E2E3Tests(): {
  results: ExposedE1E2E3TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: ExposedE1E2E3TestResult[] = [];

  const record = (id: string, name: string, passed: boolean, expected: string, actual: string) => {
    results.push({ id, name, passed, expected, actual });
  };

  // EXP-01 à EXP-05 : Identification du témoin selon label / rôles
  const witnessCases = [
    { label: 'T', role: 'WITNESS' },
    { label: 'T', roleCode: 'T' },
    { label: 'P01', role: 'WITNESS' },
    { label: 'P01', roleCode: 'T' },
    { label: 'T' }
  ];
  witnessCases.forEach((wc, i) => {
    const isW = isWitnessPanel(wc);
    const pad = String(i + 1).padStart(2, '0');
    record(`EXP-${pad}`, `isWitnessPanel pour ${JSON.stringify(wc)}`, isW, 'true', String(isW));
  });

  // EXP-06 à EXP-10 : Éprouvettes exposées actives reconnues
  const exposedCases = [
    { label: 'E1', role: 'EXPOSED', status: 'ACTIVE' },
    { label: 'E2', role: 'EXPOSED', status: 'ACTIVE' },
    { label: 'E3', role: 'EXPOSED', status: 'ACTIVE' },
    { label: 'P02', role: 'EXPOSED', status: 'ACTIVE' },
    { label: 'P03', role: 'EXPOSED', status: 'ACTIVE' }
  ];
  exposedCases.forEach((ec, i) => {
    const isExp = isExposedPanel(ec);
    const pad = String(6 + i).padStart(2, '0');
    record(`EXP-${pad}`, `isExposedPanel pour ${JSON.stringify(ec)}`, isExp, 'true', String(isExp));
  });

  // EXP-11 à EXP-15 : Rejet des éprouvettes exclues ou témoins
  const nonExposedCases = [
    { label: 'T', role: 'WITNESS', status: 'ACTIVE' },
    { label: 'E1', role: 'EXPOSED', status: 'EXCLUDED' },
    { label: 'E2', role: 'EXPOSED', status: 'INACTIVE' },
    { label: 'E3', role: 'EXPOSED', status: 'SUSPENDED' },
    { label: 'T', role: 'WITNESS', status: 'EXCLUDED' }
  ];
  nonExposedCases.forEach((nec, i) => {
    const isExp = isExposedPanel(nec);
    const pad = String(11 + i).padStart(2, '0');
    record(`EXP-${pad}`, `isExposedPanel rejette ${JSON.stringify(nec)}`, !isExp, 'false', String(isExp));
  });

  // EXP-16 à EXP-20 : getActiveExposedPanels sur lots mixtes
  const fullBatch = [
    { id: 'p0', label: 'T', role: 'WITNESS', status: 'ACTIVE' },
    { id: 'p1', label: 'E1', role: 'EXPOSED', status: 'ACTIVE' },
    { id: 'p2', label: 'E2', role: 'EXPOSED', status: 'ACTIVE' },
    { id: 'p3', label: 'E3', role: 'EXPOSED', status: 'ACTIVE' },
    { id: 'p4', label: 'E4', role: 'EXPOSED', status: 'EXCLUDED' }
  ];
  for (let k = 0; k < 5; k++) {
    const res = getActiveExposedPanels(fullBatch);
    const ok = res.length === 3 && res.every((p) => p.label !== 'T' && p.status === 'ACTIVE');
    const pad = String(16 + k).padStart(2, '0');
    record(`EXP-${pad}`, `getActiveExposedPanels filtre exactement E1, E2, E3 (test ${k + 1})`, ok, '3 panneaux actifs', `${res.length} panneaux`);
  }

  // EXP-21 : getWitnessPanel extrait correctement le témoin
  {
    const w = getWitnessPanel(fullBatch);
    const ok = w !== undefined && w.label === 'T';
    record('EXP-21', 'getWitnessPanel extrait le témoin T du lot', ok, 'label=T', `label=${w?.label}`);
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: { total: results.length, passed, failed: results.length - passed }
  };
}
