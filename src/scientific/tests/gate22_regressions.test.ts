/**
 * QUV-Lab — Suite de Tests de Régression GATE 2.2
 *
 * Valide rigoureusement les 4 volets de validation GATE 2.2 :
 * - TEST A : Exclusion absolue du Témoin T dans les agrégations de performance
 * - TEST B : Gestion dynamique et non-destructive des jalons C1 à C11 (T0 et C12 obligatoires)
 * - TEST C : Unicité stricte des photographies et remplacement avec archivage historique
 * - TEST D : Isolation stricte du référentiel normatif NF EN 927-6:2018
 */

import {
  isWitnessPanel,
  isExposedPanel,
  getActiveExposedPanels,
  getWitnessPanel,
  isMandatoryStage,
  getActiveStages
} from '../panelUtils';
import { extractTemporalKinetics } from '../analysis/TrendAnalyzer';
import { compareSystemsAtStage } from '../analysis/MultiSystemComparator';
import { generateTechnicalSynthesis } from '../analysis/TechnicalSynthesisGenerator';
import { getDefaultScientificRuleSet } from '../ruleSet';
import { globalTrialStore, generateStandardExposureStages } from '../../services/trialStore';
import { Trial, BatchDefinition, PanelDefinition, ExposureStage } from '../../types/trial';

export interface Gate22TestResult {
  id: string;
  name: string;
  category: 'TEST_A_TEMOIN' | 'TEST_B_JALONS' | 'TEST_C_PHOTOS' | 'TEST_D_ISOLATION';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate22RegressionTests(): {
  results: Gate22TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate22TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (
    id: string,
    name: string,
    category: Gate22TestResult['category'],
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  // Helper pour générer un essai mocké de test
  const createMockTrial = (): Trial => {
    const trialId = `trial-gate22-test-${Date.now()}`;
    const stages = generateStandardExposureStages(trialId);
    const batchId = `${trialId}-b-1`;
    const panels: PanelDefinition[] = [
      { id: `${trialId}-p-1`, label: '1', roleCode: 'E1', role: 'EXPOSED_1', batchId, status: 'ACTIVE', index: 1 },
      { id: `${trialId}-p-2`, label: '2', roleCode: 'E2', role: 'EXPOSED_2', batchId, status: 'ACTIVE', index: 2 },
      { id: `${trialId}-p-3`, label: '3', roleCode: 'E3', role: 'EXPOSED_3', batchId, status: 'ACTIVE', index: 3 },
      { id: `${trialId}-p-T`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId, status: 'ACTIVE', index: 4 }
    ];

    const batches: BatchDefinition[] = [
      {
        id: batchId,
        trialId,
        orderIndex: 0,
        reference: 'LOT-TEST-A',
        productReference: 'Finition Acrylique Pro',
        woodSpecies: 'Pin Sylvestre',
        coatCount: 3,
        panels
      }
    ];

    const trial: Trial = {
      id: trialId,
      schemaVersion: '1.2.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED',
      metadata: {
        reference: 'TEST-GATE-2.2',
        title: 'Essai de validation GATE 2.2',
        createdBy: 'Test Automatisé'
      },
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR', 'GLOSS', 'PERSOZ', 'OBSERVATIONS'],
        familyConfigs: {
          COLOR: { familyId: 'COLOR', enabled: true },
          GLOSS: { familyId: 'GLOSS', enabled: true },
          PERSOZ: { familyId: 'PERSOZ', enabled: true },
          OBSERVATIONS: { familyId: 'OBSERVATIONS', enabled: true }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: Array.from({ length: 11 }, (_, i) => ({ cycleIndex: i + 1, mandatory: true })),
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages,
      batches,
      acquisitions: {},
      mediaReferences: [],
      auditTrail: []
    };

    return trial;
  };

  // ==========================================================================
  // VOLET A : EXCLUSION DU TÉMOIN T DANS LES AGRÉGATIONS
  // ==========================================================================

  // Test A1 : Filtrage des éprouvettes (isWitnessPanel / isExposedPanel / getActiveExposedPanels)
  {
    const mock = createMockTrial();
    const batchPanels = mock.batches[0].panels;
    const exposed = getActiveExposedPanels(batchPanels);
    const witness = getWitnessPanel(batchPanels);

    const passed =
      exposed.length === 3 &&
      exposed.every((p) => p.label !== 'T') &&
      witness !== undefined &&
      witness.label === 'T';

    record(
      'A1',
      'Ségrégation stricte des éprouvettes exposées (E1..E3) et témoin (T)',
      'TEST_A_TEMOIN',
      passed,
      '3 éprouvettes exposées, 1 témoin identifié',
      `${exposed.length} exposées, Témoin: ${witness?.label}`
    );
  }

  // Test A2 : Non-contamination de la cinétique temporelle par le témoin T
  {
    const mock = createMockTrial();
    const stageT0 = mock.stages[0];
    const stageC1 = mock.stages[1];

    // Injecter des données pour T0
    // Exposés E1, E2, E3 : L=50, a=0, b=0, Gloss=60
    ['1', '2', '3'].forEach((lbl, idx) => {
      const pId = `${mock.id}-p-${lbl}`;
      mock.acquisitions[`${stageT0.id}__${pId}__COLOR`] = {
        id: `acq-${idx}`,
        trialId: mock.id,
        stageId: stageT0.id,
        batchId: mock.batches[0].id,
        panelId: pId,
        familyId: 'COLOR',
        raw: { readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }] },
        computed: { meanL: 50, meanA: 0, meanB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
        status: 'COMPLETE',
        alerts: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
        mediaIds: []
      };
      mock.acquisitions[`${stageT0.id}__${pId}__GLOSS`] = {
        id: `acq-g-${idx}`,
        trialId: mock.id,
        stageId: stageT0.id,
        batchId: mock.batches[0].id,
        panelId: pId,
        familyId: 'GLOSS',
        raw: { readings: [{ pointIndex: 1, gloss60: 60 }] },
        computed: { meanGloss: 60, validCount: 1, stdDev: 0, protocolStatus: 'STANDARD' },
        status: 'COMPLETE',
        alerts: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
        mediaIds: []
      };
    });

    // Témoin T à T0 : L=50, Gloss=60
    const pT = `${mock.id}-p-T`;
    mock.acquisitions[`${stageT0.id}__${pT}__COLOR`] = {
      id: 'acq-t0-T',
      trialId: mock.id,
      stageId: stageT0.id,
      batchId: mock.batches[0].id,
      panelId: pT,
      familyId: 'COLOR',
      raw: { readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }] },
      computed: { meanL: 50, meanA: 0, meanB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
      status: 'COMPLETE',
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };
    mock.acquisitions[`${stageT0.id}__${pT}__GLOSS`] = {
      id: 'acq-gt0-T',
      trialId: mock.id,
      stageId: stageT0.id,
      batchId: mock.batches[0].id,
      panelId: pT,
      familyId: 'GLOSS',
      raw: { readings: [{ pointIndex: 1, gloss60: 60 }] },
      computed: { meanGloss: 60, validCount: 1, stdDev: 0, protocolStatus: 'STANDARD' },
      status: 'COMPLETE',
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };

    // Injecter des données pour C1 (168h)
    // E1, E2, E3 subissent un vieillissement : ΔE* = 6.0, Gloss = 30 (50% rétention)
    ['1', '2', '3'].forEach((lbl, idx) => {
      const pId = `${mock.id}-p-${lbl}`;
      mock.acquisitions[`${stageC1.id}__${pId}__COLOR`] = {
        id: `acq-c1-${idx}`,
        trialId: mock.id,
        stageId: stageC1.id,
        batchId: mock.batches[0].id,
        panelId: pId,
        familyId: 'COLOR',
        raw: { readings: [{ pointIndex: 1, L: 56, a: 0, b: 0 }] },
        computed: { meanL: 56, meanA: 0, meanB: 0, deltaE: 6.0, deltaL: 6.0, deltaA: 0, deltaB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
        status: 'COMPLETE',
        alerts: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
        mediaIds: []
      };
      mock.acquisitions[`${stageC1.id}__${pId}__GLOSS`] = {
        id: `acq-gc1-${idx}`,
        trialId: mock.id,
        stageId: stageC1.id,
        batchId: mock.batches[0].id,
        panelId: pId,
        familyId: 'GLOSS',
        raw: { readings: [{ pointIndex: 1, gloss60: 30 }] },
        computed: { meanGloss: 30, deltaGloss: -30, retentionRatePercent: 50, validCount: 1, stdDev: 0, protocolStatus: 'STANDARD' },
        status: 'COMPLETE',
        alerts: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
        mediaIds: []
      };
    });

    // Témoin T conservé à l'obscurité à C1 : NE BOUGE PAS (ΔE* = 0.1, Gloss = 60)
    mock.acquisitions[`${stageC1.id}__${pT}__COLOR`] = {
      id: 'acq-c1-T',
      trialId: mock.id,
      stageId: stageC1.id,
      batchId: mock.batches[0].id,
      panelId: pT,
      familyId: 'COLOR',
      raw: { readings: [{ pointIndex: 1, L: 50.1, a: 0, b: 0 }] },
      computed: { meanL: 50.1, meanA: 0, meanB: 0, deltaE: 0.1, deltaL: 0.1, deltaA: 0, deltaB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
      status: 'COMPLETE',
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };
    mock.acquisitions[`${stageC1.id}__${pT}__GLOSS`] = {
      id: 'acq-gc1-T',
      trialId: mock.id,
      stageId: stageC1.id,
      batchId: mock.batches[0].id,
      panelId: pT,
      familyId: 'GLOSS',
      raw: { readings: [{ pointIndex: 1, gloss60: 60 }] },
      computed: { meanGloss: 60, deltaGloss: 0, retentionRatePercent: 100, validCount: 1, stdDev: 0, protocolStatus: 'STANDARD' },
      status: 'COMPLETE',
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };

    const kinetics = extractTemporalKinetics(mock, mock.batches[0].id);
    const kC1 = kinetics.find((k) => k.exposureHours === 168);

    // Moyenne des exposés attendue : ΔE* = 6.00 (et NON (6+6+6+0.1)/4 = 4.525), Gloss = 30.0 GU (et NON (30+30+30+60)/4 = 37.5 GU), Rétention = 50.0%
    const deltaEPassed = Math.abs((kC1?.meanDeltaE ?? 0) - 6.0) < 0.001;
    const glossPassed = Math.abs((kC1?.meanGloss ?? 0) - 30.0) < 0.001;
    const retentionPassed = Math.abs((kC1?.meanGlossRetentionPercent ?? 0) - 50.0) < 0.001;

    const passed = deltaEPassed && glossPassed && retentionPassed;

    record(
      'A2',
      'Exclusion absolue de T dans extractTemporalKinetics (Moyenne ΔE*=6.00, Gloss=30.0GU, Rétention=50.0%)',
      'TEST_A_TEMOIN',
      passed,
      'meanDeltaE=6.00, meanGloss=30.0, retention=50.0%',
      `meanDeltaE=${kC1?.meanDeltaE}, meanGloss=${kC1?.meanGloss}, retention=${kC1?.meanGlossRetentionPercent}%`
    );
  }

  // Test A3 : MultiSystemComparator exclut T des moyennes
  {
    const mock = createMockTrial();
    const stageC1 = mock.stages[1];
    // Remplir les données comme ci-dessus
    ['1', '2', '3'].forEach((lbl, idx) => {
      const pId = `${mock.id}-p-${lbl}`;
      mock.acquisitions[`${stageC1.id}__${pId}__COLOR`] = {
        id: `acq-c1-${idx}`,
        trialId: mock.id,
        stageId: stageC1.id,
        batchId: mock.batches[0].id,
        panelId: pId,
        familyId: 'COLOR',
        status: 'COMPLETE',
        raw: { readings: [{ pointIndex: 1, L: 56, a: 0, b: 0 }] },
        computed: { meanL: 56, meanA: 0, meanB: 0, deltaE: 8.0, deltaL: 8.0, deltaA: 0, deltaB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
        alerts: [],
        trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
        mediaIds: []
      };
    });
    // Témoin avec deltaE = 0
    mock.acquisitions[`${stageC1.id}__${mock.id}-p-T__COLOR`] = {
      id: 'acq-c1-T',
      trialId: mock.id,
      stageId: stageC1.id,
      batchId: mock.batches[0].id,
      panelId: `${mock.id}-p-T`,
      familyId: 'COLOR',
      status: 'COMPLETE',
      raw: { readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }] },
      computed: { meanL: 50, meanA: 0, meanB: 0, deltaE: 0.0, deltaL: 0.0, deltaA: 0, deltaB: 0, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };

    const comp = compareSystemsAtStage(mock, stageC1.id, ruleSet);
    const item = comp.items[0];
    const passed = item && item.color && Math.abs((item.color.meanDeltaE ?? 0) - 8.0) < 0.001;

    record(
      'A3',
      'MultiSystemComparator calcule la moyenne uniquement sur les éprouvettes exposées',
      'TEST_A_TEMOIN',
      Boolean(passed),
      'item.color.meanDeltaE = 8.00',
      `item.color.meanDeltaE = ${item?.color?.meanDeltaE}`
    );
  }

  // ==========================================================================
  // VOLET B : GESTION DYNAMIQUE ET NON-DESTRUCTIVE DES JALONS C1 À C11
  // ==========================================================================

  // Test B1 : Protection stricte des étapes obligatoires T0 et C12
  {
    const mock = createMockTrial();
    globalTrialStore.saveTrial(mock);

    let t0ErrorCaught = false;
    let c12ErrorCaught = false;

    try {
      globalTrialStore.toggleStageStatus(mock.id, mock.stages[0].id, 'Tester', 'Tentative désactivation T0');
    } catch (e: any) {
      t0ErrorCaught = true;
    }

    try {
      globalTrialStore.toggleStageStatus(mock.id, mock.stages[12].id, 'Tester', 'Tentative désactivation C12');
    } catch (e: any) {
      c12ErrorCaught = true;
    }

    const passed = t0ErrorCaught && c12ErrorCaught;

    record(
      'B1',
      'Verrouillage normatif inviolable de T0 et C12 (désactivation rejetée avec exception)',
      'TEST_B_JALONS',
      passed,
      't0ErrorCaught === true && c12ErrorCaught === true',
      `T0 rejeté: ${t0ErrorCaught}, C12 rejeté: ${c12ErrorCaught}`
    );
  }

  // Test B2 : Interdiction de désactiver un jalon mesuré et gestion non-destructive des jalons vierges
  {
    const mock = createMockTrial();
    const stageC2 = mock.stages[2]; // 336h
    // Ajouter une acquisition sur C2
    mock.acquisitions[`${stageC2.id}__${mock.batches[0].panels[0].id}__COLOR`] = {
      id: 'acq-c2-test',
      trialId: mock.id,
      stageId: stageC2.id,
      batchId: mock.batches[0].id,
      panelId: mock.batches[0].panels[0].id,
      familyId: 'COLOR',
      status: 'COMPLETE',
      raw: { readings: [{ pointIndex: 1, L: 52, a: 1, b: 2 }] },
      computed: { meanL: 52, meanA: 1, meanB: 2, deltaE: 2, deltaL: 2, deltaA: 1, deltaB: 2, validCount: 1, stdDevL: 0, stdDevA: 0, stdDevB: 0, protocolStatus: 'STANDARD' },
      alerts: [],
      trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };
    globalTrialStore.saveTrial(mock);

    // 1. RÈGLE MÉTIER : Un jalon contenant déjà des acquisitions scientifiques NE PEUT PAS être désactivé rétroactivement
    let deactivationRejectedWithException = false;
    let errorMessage = '';
    try {
      globalTrialStore.toggleStageStatus(mock.id, stageC2.id, 'Tester', 'Tentative désactivation avec acquisitions');
    } catch (err: any) {
      deactivationRejectedWithException = true;
      errorMessage = err.message || '';
    }

    // Vérifier que le jalon C2 est resté actif et que ses acquisitions sont préservées
    const trialAfterAttempt = globalTrialStore.getTrial(mock.id);
    const stageC2AfterAttempt = trialAfterAttempt?.stages.find((s) => s.id === stageC2.id);
    const isStageStillActive = stageC2AfterAttempt?.status !== 'INACTIVE';
    const isAcquisitionPreserved = Boolean(trialAfterAttempt?.acquisitions[`${stageC2.id}__${mock.batches[0].panels[0].id}__COLOR`]);

    // 2. Vérifier que sur un essai sans acquisition en configuration EDITABLE, la désactivation et réactivation d'un jalon intermédiaire restent possibles
    const mockVierge = createMockTrial();
    mockVierge.id = `trial-gate22-vierge-${Date.now()}`;
    mockVierge.configurationStatus = 'EDITABLE';
    mockVierge.acquisitions = {};
    globalTrialStore.saveTrial(mockVierge);

    const stageC3 = mockVierge.stages[3];
    globalTrialStore.toggleStageStatus(mockVierge.id, stageC3.id, 'Tester', 'Désactivation jalon vierge');
    let trialAfterC3Deact = globalTrialStore.getTrial(mockVierge.id);
    const stageC3Inactive = trialAfterC3Deact?.stages.find((s) => s.id === stageC3.id)?.status === 'INACTIVE';

    globalTrialStore.toggleStageStatus(mockVierge.id, stageC3.id, 'Tester', 'Réactivation jalon vierge');
    let trialAfterC3React = globalTrialStore.getTrial(mockVierge.id);
    const stageC3Reactivated = trialAfterC3React?.stages.find((s) => s.id === stageC3.id)?.status !== 'INACTIVE';

    const passed =
      deactivationRejectedWithException &&
      isStageStillActive &&
      isAcquisitionPreserved &&
      stageC3Inactive &&
      stageC3Reactivated;

    record(
      'B2',
      'Interdiction de désactiver rétroactivement un jalon contenant des acquisitions scientifiques',
      'TEST_B_JALONS',
      passed,
      'Exception levée lors de la tentative de désactivation de C2 + acquisitions intactes + bascule autorisée sur C3 vierge',
      `Rejet exception: ${deactivationRejectedWithException} (${errorMessage}), Données C2 préservées: ${isAcquisitionPreserved}, C3 vierge toggle OK: ${stageC3Inactive && stageC3Reactivated}`
    );
  }

  // ==========================================================================
  // VOLET C : UNICITÉ DES PHOTOS ET REMPLACEMENT AVEC HISTORISATION
  // ==========================================================================

  // Test C1 : Remplacement d'une photo existante et archivage contrôlé
  {
    const mock = createMockTrial();
    globalTrialStore.saveTrial(mock);

    const panelId = mock.batches[0].panels[0].id;
    const stageId = mock.stages[0].id;

    // Photo 1 initiale
    const t1 = globalTrialStore.attachPhoto({
      trialId: mock.id,
      panelId,
      stageId,
      filename: 'photo_initiale_t0.jpg',
      caption: 'Cliché initial',
      operatorId: 'Opérateur A',
      storageKey: 'data:image/svg+xml;utf8,<svg>Photo 1</svg>'
    });

    const initialPhoto = t1.mediaReferences.find((m) => m.filename === 'photo_initiale_t0.jpg');

    // Photo 2 de remplacement
    const t2 = globalTrialStore.attachPhoto({
      trialId: mock.id,
      panelId,
      stageId,
      filename: 'photo_remplacement_t0.jpg',
      caption: 'Cliché de remplacement de meilleure netteté',
      operatorId: 'Opérateur B',
      storageKey: 'data:image/svg+xml;utf8,<svg>Photo 2</svg>'
    });

    const activePhotos = t2.mediaReferences.filter(
      (m) => m.type === 'PHOTO' && m.panelId === panelId && m.stageId === stageId && m.status !== 'ARCHIVED'
    );
    const archivedPhotos = t2.mediaReferences.filter(
      (m) => m.type === 'PHOTO' && m.panelId === panelId && m.stageId === stageId && m.status === 'ARCHIVED'
    );

    const passed =
      activePhotos.length === 1 &&
      activePhotos[0].filename === 'photo_remplacement_t0.jpg' &&
      archivedPhotos.length === 1 &&
      archivedPhotos[0].filename === 'photo_initiale_t0.jpg' &&
      archivedPhotos[0].replacementMediaId === activePhotos[0].id;

    record(
      'C1',
      'Unicité stricte de la photo active et archivage de l\'ancien cliché avec lien de traçabilité',
      'TEST_C_PHOTOS',
      passed,
      'Exactement 1 photo ACTIVE, 1 photo ARCHIVED liée',
      `Actives: ${activePhotos.length} (${activePhotos[0]?.filename}), Archivées: ${archivedPhotos.length}`
    );
  }

  // ==========================================================================
  // VOLET D : ISOLATION NORMATIVE STRICTE NF EN 927-6:2018
  // ==========================================================================

  // Test D1 : Vérification de l'absence de NF EN 927-3:2019 dans le moteur QUV
  {
    const allConfigs = [
      ...Object.values(ruleSet.measurementConfigurations || {}),
      ...Object.values(ruleSet.seriesConfigurations || {})
    ];

    const hasEn927_6 = allConfigs.some((c: any) => (c.origin as any) === 'NORMATIVE_REQUIREMENT' || (c.origin as any) === 'NF_EN_927_6_2018');
    const hasEn927_3 = allConfigs.some((c: any) => (c.origin as any) === 'NF_EN_927_3_2019' || (c.origin as any) === 'NF_EN_927_3');
    const labRulesAreClassified = Object.values(ruleSet.measurementConfigurations || {})
      .filter((c: any) => c.origin === 'LAB_RECOMMENDATION')
      .every((c: any) => c.ruleSource === 'LABORATORY' || c.ruleSource === 'LAB_RECOMMENDATION');

    const passed = hasEn927_6 && !hasEn927_3 && labRulesAreClassified;

    record(
      'D1',
      'Isolation normative : NF EN 927-6:2018 exclusif, aucune règle NF EN 927-3, séparation INFIPERF/LABORATORY',
      'TEST_D_ISOLATION',
      passed,
      'hasEn927_6 === true && hasEn927_3 === false && labRulesAreClassified === true',
      `NF EN 927-6 présent: ${hasEn927_6}, NF EN 927-3 absent: ${!hasEn927_3}, Lab rules classées: ${labRulesAreClassified}`
    );
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount
    }
  };
}
