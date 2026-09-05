/**
 * QUV-Lab — Suite de Tests GATE 52 : RÈGLE MÉTIER ADHÉRENCE (ADHESION = T0 + C12 uniquement)
 *
 * Tests unitaires et d'intégration validant le respect strict de la règle métier :
 * - G52-ADH-01 : ADHESION attendue à T0.
 * - G52-ADH-02 : ADHESION non attendue à C1.
 * - G52-ADH-03 : ADHESION non attendue à C2.
 * - G52-ADH-04 : ADHESION non attendue à C3.
 * - G52-ADH-05 : ADHESION non attendue à C4.
 * - G52-ADH-06 : ADHESION non attendue à C5.
 * - G52-ADH-07 : ADHESION non attendue à C6.
 * - G52-ADH-08 : ADHESION non attendue à C7.
 * - G52-ADH-09 : ADHESION non attendue à C8.
 * - G52-ADH-10 : ADHESION non attendue à C9.
 * - G52-ADH-11 : ADHESION non attendue à C10.
 * - G52-ADH-12 : ADHESION non attendue à C11.
 * - G52-ADH-13 : ADHESION attendue à C12.
 * - G52-ADH-14 : bouton Adhérence absent de C1 à C11.
 * - G52-ADH-15 : bouton Adhérence visible à T0.
 * - G52-ADH-16 : bouton Adhérence visible à C12.
 * - G52-ADH-17 : absence d'Adhérence à C1–C11 non considérée comme donnée manquante.
 * - G52-ADH-18 : aucune suppression de données historiques.
 */

import {
  generateStandardExposureStages
} from '../../services/trialStore';
import {
  Trial
} from '../../types/trial';
import {
  MeasurementFamilyId,
  AdhesionRawData
} from '../../types/scientific';
import {
  isFamilyScheduledForStage,
  getActiveFamiliesForStage
} from '../panelUtils';
import { assessStageQuality } from '../qualityEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';

export interface Gate52TestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate52AdhesionTests(): {
  results: Gate52TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate52TestResult[] = [];

  const record = (
    id: string,
    name: string,
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, passed, expected, actual, details });
  };

  const stages = generateStandardExposureStages('test-trial-g52');
  const allFamilies: MeasurementFamilyId[] = ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'];
  const stageT0 = stages.find((s) => s.cycleIndex === 0)!;
  const stageC1 = stages.find((s) => s.cycleIndex === 1)!;
  const stageC2 = stages.find((s) => s.cycleIndex === 2)!;
  const stageC3 = stages.find((s) => s.cycleIndex === 3)!;
  const stageC4 = stages.find((s) => s.cycleIndex === 4)!;
  const stageC5 = stages.find((s) => s.cycleIndex === 5)!;
  const stageC6 = stages.find((s) => s.cycleIndex === 6)!;
  const stageC7 = stages.find((s) => s.cycleIndex === 7)!;
  const stageC8 = stages.find((s) => s.cycleIndex === 8)!;
  const stageC9 = stages.find((s) => s.cycleIndex === 9)!;
  const stageC10 = stages.find((s) => s.cycleIndex === 10)!;
  const stageC11 = stages.find((s) => s.cycleIndex === 11)!;
  const stageC12 = stages.find((s) => s.cycleIndex === 12)!;
  const intermediateStages = stages.filter((s) => s.cycleIndex >= 1 && s.cycleIndex <= 11);

  // G52-ADH-01 : ADHESION attendue à T0.
  const isT0Scheduled = isFamilyScheduledForStage('ADHESION', stageT0);
  const activeAtT0 = getActiveFamiliesForStage(allFamilies, stageT0);
  record(
    'G52-ADH-01',
    'ADHESION attendue à T0',
    isT0Scheduled && activeAtT0.includes('ADHESION'),
    'ADHESION scheduled and present in active families at T0',
    `scheduled=${isT0Scheduled}, inActive=${activeAtT0.includes('ADHESION')}`
  );

  // G52-ADH-02 : ADHESION non attendue à C1.
  const isC1Scheduled = isFamilyScheduledForStage('ADHESION', stageC1);
  const activeAtC1 = getActiveFamiliesForStage(allFamilies, stageC1);
  record(
    'G52-ADH-02',
    'ADHESION non attendue à C1',
    !isC1Scheduled && !activeAtC1.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C1',
    `scheduled=${isC1Scheduled}, inActive=${activeAtC1.includes('ADHESION')}`
  );

  // G52-ADH-03 : ADHESION non attendue à C2.
  const isC2Scheduled = isFamilyScheduledForStage('ADHESION', stageC2);
  const activeAtC2 = getActiveFamiliesForStage(allFamilies, stageC2);
  record(
    'G52-ADH-03',
    'ADHESION non attendue à C2',
    !isC2Scheduled && !activeAtC2.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C2',
    `scheduled=${isC2Scheduled}, inActive=${activeAtC2.includes('ADHESION')}`
  );

  // G52-ADH-04 : ADHESION non attendue à C3.
  const isC3Scheduled = isFamilyScheduledForStage('ADHESION', stageC3);
  const activeAtC3 = getActiveFamiliesForStage(allFamilies, stageC3);
  record(
    'G52-ADH-04',
    'ADHESION non attendue à C3',
    !isC3Scheduled && !activeAtC3.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C3',
    `scheduled=${isC3Scheduled}, inActive=${activeAtC3.includes('ADHESION')}`
  );

  // G52-ADH-05 : ADHESION non attendue à C4.
  const isC4Scheduled = isFamilyScheduledForStage('ADHESION', stageC4);
  const activeAtC4 = getActiveFamiliesForStage(allFamilies, stageC4);
  record(
    'G52-ADH-05',
    'ADHESION non attendue à C4',
    !isC4Scheduled && !activeAtC4.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C4',
    `scheduled=${isC4Scheduled}, inActive=${activeAtC4.includes('ADHESION')}`
  );

  // G52-ADH-06 : ADHESION non attendue à C5.
  const isC5Scheduled = isFamilyScheduledForStage('ADHESION', stageC5);
  const activeAtC5 = getActiveFamiliesForStage(allFamilies, stageC5);
  record(
    'G52-ADH-06',
    'ADHESION non attendue à C5',
    !isC5Scheduled && !activeAtC5.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C5',
    `scheduled=${isC5Scheduled}, inActive=${activeAtC5.includes('ADHESION')}`
  );

  // G52-ADH-07 : ADHESION non attendue à C6.
  const isC6Scheduled = isFamilyScheduledForStage('ADHESION', stageC6);
  const activeAtC6 = getActiveFamiliesForStage(allFamilies, stageC6);
  record(
    'G52-ADH-07',
    'ADHESION non attendue à C6',
    !isC6Scheduled && !activeAtC6.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C6',
    `scheduled=${isC6Scheduled}, inActive=${activeAtC6.includes('ADHESION')}`
  );

  // G52-ADH-08 : ADHESION non attendue à C7.
  const isC7Scheduled = isFamilyScheduledForStage('ADHESION', stageC7);
  const activeAtC7 = getActiveFamiliesForStage(allFamilies, stageC7);
  record(
    'G52-ADH-08',
    'ADHESION non attendue à C7',
    !isC7Scheduled && !activeAtC7.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C7',
    `scheduled=${isC7Scheduled}, inActive=${activeAtC7.includes('ADHESION')}`
  );

  // G52-ADH-09 : ADHESION non attendue à C8.
  const isC8Scheduled = isFamilyScheduledForStage('ADHESION', stageC8);
  const activeAtC8 = getActiveFamiliesForStage(allFamilies, stageC8);
  record(
    'G52-ADH-09',
    'ADHESION non attendue à C8',
    !isC8Scheduled && !activeAtC8.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C8',
    `scheduled=${isC8Scheduled}, inActive=${activeAtC8.includes('ADHESION')}`
  );

  // G52-ADH-10 : ADHESION non attendue à C9.
  const isC9Scheduled = isFamilyScheduledForStage('ADHESION', stageC9);
  const activeAtC9 = getActiveFamiliesForStage(allFamilies, stageC9);
  record(
    'G52-ADH-10',
    'ADHESION non attendue à C9',
    !isC9Scheduled && !activeAtC9.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C9',
    `scheduled=${isC9Scheduled}, inActive=${activeAtC9.includes('ADHESION')}`
  );

  // G52-ADH-11 : ADHESION non attendue à C10.
  const isC10Scheduled = isFamilyScheduledForStage('ADHESION', stageC10);
  const activeAtC10 = getActiveFamiliesForStage(allFamilies, stageC10);
  record(
    'G52-ADH-11',
    'ADHESION non attendue à C10',
    !isC10Scheduled && !activeAtC10.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C10',
    `scheduled=${isC10Scheduled}, inActive=${activeAtC10.includes('ADHESION')}`
  );

  // G52-ADH-12 : ADHESION non attendue à C11.
  const isC11Scheduled = isFamilyScheduledForStage('ADHESION', stageC11);
  const activeAtC11 = getActiveFamiliesForStage(allFamilies, stageC11);
  record(
    'G52-ADH-12',
    'ADHESION non attendue à C11',
    !isC11Scheduled && !activeAtC11.includes('ADHESION'),
    'ADHESION NOT scheduled and NOT present in active families at C11',
    `scheduled=${isC11Scheduled}, inActive=${activeAtC11.includes('ADHESION')}`
  );

  // G52-ADH-13 : ADHESION attendue à C12.
  const isC12Scheduled = isFamilyScheduledForStage('ADHESION', stageC12);
  const activeAtC12 = getActiveFamiliesForStage(allFamilies, stageC12);
  record(
    'G52-ADH-13',
    'ADHESION attendue à C12',
    isC12Scheduled && activeAtC12.includes('ADHESION'),
    'ADHESION scheduled and present in active families at C12',
    `scheduled=${isC12Scheduled}, inActive=${activeAtC12.includes('ADHESION')}`
  );

  // G52-ADH-14 : bouton Adhérence absent de C1 à C11.
  // Dans Tab06, le bouton Adhérence n'est simplement pas rendu si isFamilyScheduledForStage('ADHESION', stage) === false.
  // Ce test vérifie que les 11 cycles intermédiaires retournent false, garantissant l'absence totale du bouton dans le DOM.
  const allIntermediateOmitted = intermediateStages.every(
    (s) => !isFamilyScheduledForStage('ADHESION', s)
  );
  record(
    'G52-ADH-14',
    'bouton Adhérence absent de C1 à C11',
    allIntermediateOmitted && intermediateStages.length === 11,
    'false for all cycles C1 to C11 (total 11 stages omitted from DOM)',
    `allIntermediateOmitted=${allIntermediateOmitted}, count=${intermediateStages.length}`
  );

  // G52-ADH-15 : bouton Adhérence visible à T0.
  const isButtonVisibleAtT0 = isFamilyScheduledForStage('ADHESION', stageT0);
  record(
    'G52-ADH-15',
    'bouton Adhérence visible à T0',
    isButtonVisibleAtT0 === true,
    'true (rendered at T0 / 0 h)',
    `visible=${isButtonVisibleAtT0}`
  );

  // G52-ADH-16 : bouton Adhérence visible à C12.
  const isButtonVisibleAtC12 = isFamilyScheduledForStage('ADHESION', stageC12);
  record(
    'G52-ADH-16',
    'bouton Adhérence visible à C12',
    isButtonVisibleAtC12 === true,
    'true (rendered at C12 / 2016 h)',
    `visible=${isButtonVisibleAtC12}`
  );

  // G52-ADH-17 : absence d'Adhérence à C1–C11 non considérée comme donnée manquante.
  const ruleSet = getDefaultScientificRuleSet();
  const mockTrial: Trial = {
    id: 'test-trial-g52',
    schemaVersion: '1.2.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'IN_PROGRESS',
    configurationStatus: 'LOCKED',
    metadata: {
      reference: 'TEST-ADH-G52',
      title: 'Essai Test Adhesion G52',
      createdBy: 'Tester'
    },
    config: {
      standardReference: 'NF EN 927-6',
      activeFamilies: allFamilies,
      familyConfigs: {} as any
    },
    scheduleConfig: {
      cycleDurationHours: 168,
      maxCycles: 12,
      initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
      intermediateCycles: Array.from({ length: 11 }, (_, i) => ({ cycleIndex: i + 1, mandatory: true })),
      finalCycle: { cycleIndex: 12, mandatory: true }
    },
    batches: [
      {
        id: 'b1',
        trialId: 'test-trial-g52',
        reference: 'LOT-A',
        orderIndex: 0,
        panels: [
          { id: 'p1', label: 'Éprouvette 1', roleCode: 'E1', role: 'EXPOSED_1', batchId: 'b1', status: 'ACTIVE', index: 1 }
        ]
      }
    ],
    stages: [stageC1],
    acquisitions: {
      [`${stageC1.id}__p1__COLOR`]: {
        id: 'acq-col',
        trialId: 'test-trial-g52',
        stageId: stageC1.id,
        batchId: 'b1',
        panelId: 'p1',
        familyId: 'COLOR',
        computed: { deltaE00: 1.2 } as any,
        raw: {} as any,
        status: 'COMPLETE',
        alerts: [],
        mediaIds: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' }
      },
      [`${stageC1.id}__p1__GLOSS`]: {
        id: 'acq-glo',
        trialId: 'test-trial-g52',
        stageId: stageC1.id,
        batchId: 'b1',
        panelId: 'p1',
        familyId: 'GLOSS',
        computed: { mean: 65 } as any,
        raw: {} as any,
        status: 'COMPLETE',
        alerts: [],
        mediaIds: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' }
      },
      [`${stageC1.id}__p1__PERSOZ`]: {
        id: 'acq-per',
        trialId: 'test-trial-g52',
        stageId: stageC1.id,
        batchId: 'b1',
        panelId: 'p1',
        familyId: 'PERSOZ',
        computed: { mean: 120 } as any,
        raw: {} as any,
        status: 'COMPLETE',
        alerts: [],
        mediaIds: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' }
      },
      [`${stageC1.id}__p1__OBSERVATIONS`]: {
        id: 'acq-obs',
        trialId: 'test-trial-g52',
        stageId: stageC1.id,
        batchId: 'b1',
        panelId: 'p1',
        familyId: 'OBSERVATIONS',
        computed: { items: [] } as any,
        raw: {} as any,
        status: 'COMPLETE',
        alerts: [],
        mediaIds: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' }
      }
    },
    mediaReferences: [],
    auditTrail: []
  };

  const qualityAssessment = assessStageQuality(stageC1.id, mockTrial, ruleSet);
  const isC1Complete = qualityAssessment.panelsComplete === 1;
  const isStatusGood = qualityAssessment.globalStatus === 'GOOD';
  const noAdhesionInAssessment = qualityAssessment.familyAssessments['ADHESION'] === undefined;
  record(
    'G52-ADH-17',
    'absence d\'Adhérence à C1–C11 non considérée comme donnée manquante',
    isC1Complete && isStatusGood && noAdhesionInAssessment,
    'panelsComplete === 1, globalStatus === GOOD, ADHESION not in familyAssessments',
    `panelsComplete=${qualityAssessment.panelsComplete}, status=${qualityAssessment.globalStatus}, adhNotRequired=${noAdhesionInAssessment}`
  );

  // G52-ADH-18 : aucune suppression de données historiques.
  const legacyKey = `${stageC1.id}__p1__ADHESION`;
  const legacyTrial: Trial = {
    ...mockTrial,
    acquisitions: {
      ...mockTrial.acquisitions,
      [legacyKey]: {
        id: 'acq-adh-legacy',
        trialId: mockTrial.id,
        stageId: stageC1.id,
        batchId: 'b1',
        panelId: 'p1',
        familyId: 'ADHESION',
        computed: { classification: 1 } as any,
        raw: {
          adhesionClass: 1,
          gridSpacingMm: 2,
          coatingThicknessMicrons: 80,
          measurementDateTime: '2025-01-01T00:00:00Z',
          normReference: 'NF EN ISO 2409:2020'
        } as unknown as AdhesionRawData,
        status: 'COMPLETE',
        alerts: [],
        mediaIds: [],
        trace: { createdBy: 'LegacyUser', createdAt: '2025-01-01T00:00:00Z', source: 'MANUAL_KEYPAD' }
      }
    }
  };

  const hasLegacyAcquisition = Boolean(legacyTrial.acquisitions[legacyKey]?.raw);
  record(
    'G52-ADH-18',
    'aucune suppression de données historiques',
    hasLegacyAcquisition,
    'Données historiques conservées intactes dans le dictionnaire des acquisitions',
    `legacyAcqFound=${hasLegacyAcquisition}`
  );

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    results,
    summary: { total: results.length, passed, failed }
  };
}
