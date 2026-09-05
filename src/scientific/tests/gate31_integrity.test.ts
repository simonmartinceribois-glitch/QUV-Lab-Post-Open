/**
 * QUV-Lab — Suite de Tests d'Intégrité du Modèle de Données GATE 3.1
 *
 * Valide les 3 axes de sécurisation :
 * - RISQUE 1 : Garde-fou runtime validateAcquisitionTarget() & IntegrityViolationError
 * - RISQUE 2 : Typage strict PhotoReference & validatePhotoTarget()
 * - RISQUE 3 : Maintien et étanchéité de la clé d'acquisition ${stageId}__${panelId}__${familyId}
 */

import {
  globalTrialStore,
  generateStandardExposureStages,
  generateUUID,
  IntegrityViolationError,
  validateAcquisitionTarget,
  validatePhotoTarget
} from '../../services/trialStore';
import {
  Trial,
  BatchDefinition,
  PanelDefinition,
  PhotoReference,
  MediaReference
} from '../../types/trial';
import { getDefaultScientificRuleSet } from '../ruleSet';
import { ColorRawData, GlossRawData } from '../../types/scientific';

export interface Gate31TestResult {
  id: string;
  name: string;
  category: 'RISK_1_RUNTIME_GUARDS' | 'RISK_2_STRICT_PHOTOS' | 'RISK_3_KEY_COMPAT_SEGREGATION';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate31IntegrityTests(): {
  results: Gate31TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate31TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  const record = (
    id: string,
    name: string,
    category: Gate31TestResult['category'],
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  const createTwoBatchTrial = (customId?: string): Trial => {
    const trialId = customId || `trial-gate31-${generateUUID()}`;
    const stages = generateStandardExposureStages(trialId);

    const panelsBatch1: PanelDefinition[] = [
      { id: `${trialId}-b1-p1`, label: '1', roleCode: 'E1', role: 'EXPOSED_1', batchId: `${trialId}-b1`, status: 'ACTIVE', index: 1 },
      { id: `${trialId}-b1-p2`, label: '2', roleCode: 'E2', role: 'EXPOSED_2', batchId: `${trialId}-b1`, status: 'ACTIVE', index: 2 },
      { id: `${trialId}-b1-p3`, label: '3', roleCode: 'E3', role: 'EXPOSED_3', batchId: `${trialId}-b1`, status: 'ACTIVE', index: 3 },
      { id: `${trialId}-b1-pT`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: `${trialId}-b1`, status: 'ACTIVE', index: 4 }
    ];

    const panelsBatch2: PanelDefinition[] = [
      { id: `${trialId}-b2-p1`, label: '1', roleCode: 'E1', role: 'EXPOSED_1', batchId: `${trialId}-b2`, status: 'ACTIVE', index: 1 },
      { id: `${trialId}-b2-p2`, label: '2', roleCode: 'E2', role: 'EXPOSED_2', batchId: `${trialId}-b2`, status: 'ACTIVE', index: 2 },
      { id: `${trialId}-b2-p3`, label: '3', roleCode: 'E3', role: 'EXPOSED_3', batchId: `${trialId}-b2`, status: 'ACTIVE', index: 3 },
      { id: `${trialId}-b2-pT`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: `${trialId}-b2`, status: 'ACTIVE', index: 4 }
    ];

    const batches: BatchDefinition[] = [
      {
        id: `${trialId}-b1`,
        trialId,
        orderIndex: 0,
        reference: 'LOT-SYST-A',
        productReference: 'Peinture A',
        woodSpecies: 'Pin Sylvestre',
        coatCount: 2,
        panels: panelsBatch1
      },
      {
        id: `${trialId}-b2`,
        trialId,
        orderIndex: 1,
        reference: 'LOT-SYST-B',
        productReference: 'Peinture B',
        woodSpecies: 'Pin Sylvestre',
        coatCount: 3,
        panels: panelsBatch2
      }
    ];

    return {
      id: trialId,
      schemaVersion: '1.2.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: 'IN_PROGRESS',
      configurationStatus: 'EDITABLE',
      metadata: {
        reference: 'TEST-GATE-3.1',
        title: 'Essai de validation d\'intégrité GATE 3.1',
        createdBy: 'TestRunner'
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
  };

  // ==========================================================================
  // SECTION 1 : RISQUE 1 — GARDES-FOUS RUNTIME BATCH / PANEL / STAGE
  // ==========================================================================

  // TEST 1 : Mélange inter-lots bloqué dans recordAcquisition (panelId de Lot 2 avec batchId de Lot 1)
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stageId = trial.stages[0].id;
    const batch1Id = trial.batches[0].id;
    const panel2FromBatch2 = trial.batches[1].panels[0].id;

    let threwError = false;
    let errorCode = '';

    try {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId,
        batchId: batch1Id,
        panelId: panel2FromBatch2, // INCOHÉRENCE : éprouvette du Lot 2 avec identifiant du Lot 1
        familyId: 'COLOR',
        raw: {
          readings: [
            { pointIndex: 1, L: 60.5, a: 2.1, b: 14.3 },
            { pointIndex: 2, L: 60.8, a: 2.0, b: 14.5 },
            { pointIndex: 3, L: 60.6, a: 2.2, b: 14.4 }
          ]
        } as ColorRawData,
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threwError = true;
      errorCode = err.code || (err instanceof IntegrityViolationError ? err.code : 'UNKNOWN');
    }

    record(
      'G31-01',
      'Mélange inter-lots bloqué dans recordAcquisition() avec IntegrityViolationError',
      'RISK_1_RUNTIME_GUARDS',
      threwError && errorCode === 'INTEGRITY_VIOLATION',
      'Exception IntegrityViolationError (code INTEGRITY_VIOLATION)',
      threwError ? `Levée avec code: ${errorCode}` : 'Aucune exception levée'
    );
  }

  // TEST 2 : Incohérence inter-lots bloquée dans validateAcquisitionTarget direct
  {
    const trial = createTwoBatchTrial();
    const stageId = trial.stages[0].id;
    const batch2Id = trial.batches[1].id;
    const panelFromBatch1 = trial.batches[0].panels[0].id;

    let threw = false;
    let code = '';

    try {
      validateAcquisitionTarget(trial, stageId, batch2Id, panelFromBatch1);
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-02',
      'validateAcquisitionTarget() bloque formellement une éprouvette rattachée au mauvais lot',
      'RISK_1_RUNTIME_GUARDS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError avec code INTEGRITY_VIOLATION',
      threw ? `Levée avec code: ${code}` : 'Non bloqué'
    );
  }

  // TEST 3 : Lot inexistant bloqué
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stageId = trial.stages[0].id;
    const fakeBatchId = 'batch-inexistant-uuid';
    const validPanelId = trial.batches[0].panels[0].id;

    let threw = false;
    let code = '';

    try {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId,
        batchId: fakeBatchId,
        panelId: validPanelId,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [
                { pointIndex: 1, value: 45.2 },
                { pointIndex: 2, value: 44.8 },
                { pointIndex: 3, value: 45.0 }
              ]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-03',
      'Rejet immédiat en cas de batchId inexistant dans le trial',
      'RISK_1_RUNTIME_GUARDS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Rejeté (${code})` : 'Accepté à tort'
    );
  }

  // TEST 4 : Éprouvette inexistante bloquée
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stageId = trial.stages[0].id;
    const batchId = trial.batches[0].id;
    const fakePanelId = 'panel-inexistant-uuid';

    let threw = false;
    let code = '';

    try {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId,
        batchId,
        panelId: fakePanelId,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [{ pointIndex: 1, value: 50 }]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-04',
      'Rejet immédiat en cas de panelId inexistant dans le lot',
      'RISK_1_RUNTIME_GUARDS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Rejeté (${code})` : 'Accepté à tort'
    );
  }

  // TEST 5 : Étape d'exposition inexistante bloquée
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const fakeStageId = 'stage-inexistant-999';
    const batchId = trial.batches[0].id;
    const panelId = trial.batches[0].panels[0].id;

    let threw = false;
    let code = '';

    try {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId: fakeStageId,
        batchId,
        panelId,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [{ pointIndex: 1, value: 50 }]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-05',
      'Rejet immédiat en cas de stageId inexistant dans le trial',
      'RISK_1_RUNTIME_GUARDS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Rejeté (${code})` : 'Accepté à tort'
    );
  }

  // TEST 6 : Étape appartenant à un autre essai bloquée (cross-trial mismatch)
  {
    const trialA = createTwoBatchTrial('trial-A');
    const trialB = createTwoBatchTrial('trial-B');
    globalTrialStore.saveTrial(trialA);
    globalTrialStore.saveTrial(trialB);

    const stageFromTrialB = trialB.stages[0].id; // Etape appartenant à Trial B
    const batchFromTrialA = trialA.batches[0].id;
    const panelFromTrialA = trialA.batches[0].panels[0].id;

    let threw = false;
    let code = '';

    try {
      globalTrialStore.recordAcquisition({
        trialId: trialA.id,
        stageId: stageFromTrialB, // Etape de B passée sur l'essai A
        batchId: batchFromTrialA,
        panelId: panelFromTrialA,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [{ pointIndex: 1, value: 50 }]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-06',
      'Rejet immédiat en cas d\'étape appartenant à un autre essai (cross-trial)',
      'RISK_1_RUNTIME_GUARDS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Rejeté (${code})` : 'Accepté à tort'
    );
  }

  // ==========================================================================
  // SECTION 2 : RISQUE 2 — TYPAGE STRICT ET GARDE-FOU PHOTOGRAPHIQUE
  // ==========================================================================

  // TEST 7 : Photo avec étape inexistante bloquée dans attachPhoto()
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const fakeStageId = 'stage-photos-inconnu';
    const panelId = trial.batches[0].panels[0].id;

    let threw = false;
    let code = '';

    try {
      globalTrialStore.attachPhoto({
        trialId: trial.id,
        panelId,
        stageId: fakeStageId,
        filename: 'cliche_errone.jpg',
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-07',
      'attachPhoto() rejette un rattachement à une étape inexistante (validatePhotoTarget)',
      'RISK_2_STRICT_PHOTOS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Bloqué avec code: ${code}` : 'Accepté sans validation'
    );
  }

  // TEST 8 : Photo avec éprouvette inexistante bloquée dans attachPhoto()
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stageId = trial.stages[0].id;
    const fakePanelId = 'panel-photos-inconnu';

    let threw = false;
    let code = '';

    try {
      globalTrialStore.attachPhoto({
        trialId: trial.id,
        panelId: fakePanelId,
        stageId,
        filename: 'cliche_errone_2.jpg',
        operatorId: 'Tech'
      });
    } catch (err: any) {
      threw = true;
      code = err.code || '';
    }

    record(
      'G31-08',
      'attachPhoto() rejette un rattachement à une éprouvette inexistante',
      'RISK_2_STRICT_PHOTOS',
      threw && code === 'INTEGRITY_VIOLATION',
      'IntegrityViolationError (INTEGRITY_VIOLATION)',
      threw ? `Bloqué avec code: ${code}` : 'Accepté sans validation'
    );
  }

  // TEST 9 : Absence de tout effet de bord lors d'une violation d'intégrité
  {
    const trial = createTwoBatchTrial();
    trial.configurationStatus = 'EDITABLE';
    globalTrialStore.saveTrial(trial);

    const initialAuditLength = trial.auditTrail.length;
    const initialAcquisitionsCount = Object.keys(trial.acquisitions).length;

    try {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId: 'invalid-stage',
        batchId: trial.batches[0].id,
        panelId: trial.batches[0].panels[0].id,
        familyId: 'COLOR',
        raw: { readings: [] } as ColorRawData,
        operatorId: 'Tech'
      });
    } catch {
      // Ignorer l'erreur attendue
    }

    const reloaded = globalTrialStore.getTrial(trial.id);
    const noConfigLock = reloaded?.configurationStatus === 'EDITABLE';
    const noAuditPollution = reloaded?.auditTrail.length === initialAuditLength;
    const noAcquisitionsAdded = Object.keys(reloaded?.acquisitions || {}).length === initialAcquisitionsCount;

    const allClean = Boolean(noConfigLock && noAuditPollution && noAcquisitionsAdded);

    record(
      'G31-09',
      'Absence d\'effet de bord lors d\'un rejet d\'intégrité (configurationStatus non verrouillé, audit intact)',
      'RISK_1_RUNTIME_GUARDS',
      allClean,
      'configurationStatus=UNLOCKED, 0 acquisition ajoutée, 0 audit ajouté',
      `configurationStatus=${reloaded?.configurationStatus}, acqCount=${Object.keys(reloaded?.acquisitions || {}).length}, auditLen=${reloaded?.auditTrail.length}`
    );
  }

  // ==========================================================================
  // SECTION 3 : RISQUE 3 & STRUCTURATION MÉTIER
  // ==========================================================================

  // TEST 10 : Agrégations par lot strictement étanches
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stage0 = trial.stages[0].id;
    const batch1 = trial.batches[0];
    const batch2 = trial.batches[1];

    // Enregistrement Gloss pour les 3 éprouvettes exposées du Lot 1 (valeurs ~60 GU)
    for (const p of batch1.panels.filter((p) => p.role !== 'WITNESS')) {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId: stage0,
        batchId: batch1.id,
        panelId: p.id,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [
                { pointIndex: 1, value: 60.0 },
                { pointIndex: 2, value: 60.0 },
                { pointIndex: 3, value: 60.0 }
              ]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    }

    // Enregistrement Gloss pour les 3 éprouvettes exposées du Lot 2 (valeurs ~20 GU)
    for (const p of batch2.panels.filter((p) => p.role !== 'WITNESS')) {
      globalTrialStore.recordAcquisition({
        trialId: trial.id,
        stageId: stage0,
        batchId: batch2.id,
        panelId: p.id,
        familyId: 'GLOSS',
        raw: {
          series: [
            {
              seriesIndex: 1,
              orientation: 'GRAIN_DIRECTION',
              readings: [
                { pointIndex: 1, value: 20.0 },
                { pointIndex: 2, value: 20.0 },
                { pointIndex: 3, value: 20.0 }
              ]
            }
          ]
        } as GlossRawData,
        operatorId: 'Tech'
      });
    }

    const loadedTrial = globalTrialStore.getTrial(trial.id)!;

    // Calcul direct des moyennes de chaque lot
    const getBatchMeanGloss = (b: BatchDefinition) => {
      const vals: number[] = [];
      for (const p of b.panels.filter((p) => p.role !== 'WITNESS')) {
        const key = `${stage0}__${p.id}__GLOSS`;
        const rec = loadedTrial.acquisitions[key];
        if (rec && rec.computed) {
          const comp = rec.computed as any;
          if (typeof comp.meanGloss === 'number') {
            vals.push(comp.meanGloss);
          }
        }
      }
      return vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
    };

    const meanBatch1 = getBatchMeanGloss(batch1);
    const meanBatch2 = getBatchMeanGloss(batch2);

    const isSegregated = Math.abs(meanBatch1 - 60.0) < 0.1 && Math.abs(meanBatch2 - 20.0) < 0.1;

    record(
      'G31-10',
      'Étanchéité absolue des calculs et agrégations par lot (Lot 1 = 60.0 GU, Lot 2 = 20.0 GU)',
      'RISK_3_KEY_COMPAT_SEGREGATION',
      isSegregated,
      'Moyenne Lot 1 = 60.0, Moyenne Lot 2 = 20.0',
      `Lot 1 = ${meanBatch1.toFixed(1)}, Lot 2 = ${meanBatch2.toFixed(1)}`
    );
  }

  // TEST 11 : Lisibilité et rétrocompatibilité des clés d'acquisitions ${stageId}__${panelId}__${familyId}
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const stageId = trial.stages[0].id;
    const batchId = trial.batches[0].id;
    const panelId = trial.batches[0].panels[0].id;
    const expectedKey = `${stageId}__${panelId}__COLOR`;

    const { record: acqRecord } = globalTrialStore.recordAcquisition({
      trialId: trial.id,
      stageId,
      batchId,
      panelId,
      familyId: 'COLOR',
      raw: {
        readings: [
          { pointIndex: 1, L: 72.1, a: 3.4, b: 18.2 },
          { pointIndex: 2, L: 72.3, a: 3.5, b: 18.1 },
          { pointIndex: 3, L: 72.0, a: 3.3, b: 18.3 }
        ]
      } as ColorRawData,
      operatorId: 'Tech'
    });

    const refreshedTrial = globalTrialStore.getTrial(trial.id)!;
    const directByKey = refreshedTrial.acquisitions[expectedKey];

    const keyMatches = directByKey && directByKey.id === acqRecord.id;
    const computedL = (directByKey?.computed as any)?.meanL;
    const isLValid = typeof computedL === 'number' && Math.abs(computedL - 72.13) < 0.05;

    record(
      'G31-11',
      'Format de clé normalisé ${stageId}__${panelId}__${familyId} intact et calcul accessible',
      'RISK_3_KEY_COMPAT_SEGREGATION',
      Boolean(keyMatches && isLValid),
      `Clé ${expectedKey} contient le record calculé (meanL ≈ 72.13)`,
      keyMatches ? `Trouvé avec meanL=${computedL?.toFixed(2)}` : 'Clé non trouvée'
    );
  }

  // TEST 12 : Typage strict PhotoReference et cycle de vie complet (ACTIVE -> ARCHIVED)
  {
    const trial = createTwoBatchTrial();
    globalTrialStore.saveTrial(trial);

    const panelId = trial.batches[0].panels[0].id;
    const stageId = trial.stages[0].id;

    // 1ère photo
    const t1 = globalTrialStore.attachPhoto({
      trialId: trial.id,
      panelId,
      stageId,
      filename: 'photo_initiale.jpg',
      caption: 'Cliché initial T0',
      operatorId: 'Opérateur 1',
      storageKey: 'photos/photo_initiale.jpg'
    });

    const photo1 = t1.mediaReferences.find((m) => m.filename === 'photo_initiale.jpg') as PhotoReference;
    const isPhoto1Valid =
      photo1 &&
      photo1.type === 'PHOTO' &&
      photo1.panelId === panelId &&
      photo1.stageId === stageId &&
      photo1.status === 'ACTIVE';

    // 2ème photo remplaçant la première
    const t2 = globalTrialStore.attachPhoto({
      trialId: trial.id,
      panelId,
      stageId,
      filename: 'photo_remplacement.jpg',
      caption: 'Cliché haute résolution',
      operatorId: 'Opérateur 2',
      storageKey: 'photos/photo_remplacement.jpg'
    });

    const photo1After = t2.mediaReferences.find((m) => m.filename === 'photo_initiale.jpg') as PhotoReference;
    const photo2After = t2.mediaReferences.find((m) => m.filename === 'photo_remplacement.jpg') as PhotoReference;

    const isArchivedCorrectly =
      photo1After.status === 'ARCHIVED' &&
      photo1After.replacementMediaId === photo2After.id &&
      typeof photo1After.replacedAt === 'string';

    const isActiveCorrectly =
      photo2After.status === 'ACTIVE' &&
      photo2After.panelId === panelId &&
      photo2After.stageId === stageId;

    const allPassed = Boolean(isPhoto1Valid && isArchivedCorrectly && isActiveCorrectly);

    record(
      'G31-12',
      'Typage PhotoReference strict et archivage non-destructif avec traçabilité complète',
      'RISK_2_STRICT_PHOTOS',
      allPassed,
      'Photo 1 archivée avec lien vers Photo 2 active',
      allPassed ? 'Archivage et typage discriminé validés à 100%' : 'Défaut de cycle de vie ou typage'
    );
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  return {
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount
    }
  };
}
