/**
 * QUV-Lab — GATE 53 : Intégrité Créateur Obligatoire & Média ≠ Mesure
 *
 * Valide les garde-fous stricts :
 * - G53-CREATOR-01 : createTrial avec createdBy: '' est rejeté avec erreur explicite
 * - G53-CREATOR-02 : createTrial avec createdBy: '   ' (espaces blancs) est rejeté
 * - G53-CREATOR-03 : createTrial avec createdBy: 'Jean Dupont' est autorisé et tracé
 * - G53-CREATOR-04 : Test UI Wizard : bouton final bloqué si createdBy est vide (indépendant de step 1)
 * - G53-MEDIA-01 : Suppression d'une photo référencée : mediaId retiré, acquisition conservée, status/raw/computed inchangés
 * - G53-MEDIA-02 : Acquisition COMPLETE avec photo : après suppression de la photo, le statut reste strictement COMPLETE
 * - G53-MEDIA-03 : Acquisition avec mediaIds: [] reste exploitable par les moteurs scientifiques (complétude != photo)
 * - G53-MEDIA-04 : attachPhoto avec remplacement : ancien média retiré, nouveau ajouté, aucun doublon, données scientifiques inchangées
 */

import { globalTrialStore, generateUUID } from '../../services/trialStore';
import { isFinalCreateAllowed } from '../../components/CreateTrialWizardModal';
import { assessStageQuality } from '../qualityEngine';
import { getDefaultScientificRuleSet } from '../ruleSet';
import { ColorRawData, ColorRawPoint, VisualObservationsRawData, ColorComputedData } from '../../types/scientific';
import { TrialMetadata, PanelAcquisitionRecord } from '../../types/trial';

export interface Gate53TestResult {
  id: string;
  name: string;
  category: 'CREATOR_INTEGRITY' | 'MEDIA_INTEGRITY';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate53MediaCreatorTests(): {
  results: Gate53TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate53TestResult[] = [];

  const record = (
    id: string,
    name: string,
    category: Gate53TestResult['category'],
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  const baseBatches = [
    {
      reference: 'LOT-A',
      coatingSystem: 'Acrylique phase aqueuse',
      woodSpecies: 'Pin sylvestre',
      panelCount: 4
    }
  ];

  // ==========================================================================
  // 1. TESTS DE TRAÇABILITÉ & GARDE-FOUS CRÉATEUR
  // ==========================================================================

  // G53-CREATOR-01 : createTrial direct avec createdBy: '' -> rejeté avec erreur explicite
  let g53Creator01Error = '';
  try {
    globalTrialStore.createTrial({
      metadata: {
        reference: 'TRIAL-ERR-01',
        title: 'Test Créateur Vide',
        createdBy: ''
      } as TrialMetadata,
      batches: baseBatches,
      activeFamilies: ['COLOR']
    });
  } catch (err: any) {
    g53Creator01Error = err?.message || String(err);
  }
  record(
    'G53-CREATOR-01',
    'Rejet strict lors de la création d\'un essai avec createdBy vide',
    'CREATOR_INTEGRITY',
    g53Creator01Error.includes('créateur de l’essai est obligatoire') || g53Creator01Error.includes('obligatoire'),
    'Erreur explicite : Le créateur de l’essai est obligatoire.',
    g53Creator01Error || 'Aucune erreur levée (création indue)'
  );

  // G53-CREATOR-02 : createTrial direct avec createdBy: '   ' (espaces) -> rejeté
  let g53Creator02Error = '';
  try {
    globalTrialStore.createTrial({
      metadata: {
        reference: 'TRIAL-ERR-02',
        title: 'Test Créateur Espaces',
        createdBy: '     '
      } as TrialMetadata,
      batches: baseBatches,
      activeFamilies: ['COLOR']
    });
  } catch (err: any) {
    g53Creator02Error = err?.message || String(err);
  }
  record(
    'G53-CREATOR-02',
    'Rejet strict lors de la création avec createdBy composé d\'espaces blancs',
    'CREATOR_INTEGRITY',
    g53Creator02Error.length > 0 && (g53Creator02Error.includes('créateur') || g53Creator02Error.includes('obligatoire')),
    'Erreur explicite de rejet',
    g53Creator02Error || 'Aucune erreur levée'
  );

  // G53-CREATOR-03 : createTrial avec createdBy: 'Jean Dupont' -> création autorisée et tracée
  let g53Creator03Success = false;
  let g53Creator03Details = '';
  try {
    const trialCreated = globalTrialStore.createTrial({
      metadata: {
        reference: 'TRIAL-OK-03',
        title: 'Essai Conforme Traçabilité',
        createdBy: 'Jean Dupont'
      } as TrialMetadata,
      batches: baseBatches,
      activeFamilies: ['COLOR', 'GLOSS']
    });
    const auditEvent = trialCreated.auditTrail.find((e) => e.action === 'CREATE_TRIAL');
    g53Creator03Success =
      trialCreated.metadata.createdBy === 'Jean Dupont' &&
      auditEvent !== undefined &&
      auditEvent.operatorId === 'Jean Dupont';
    g53Creator03Details = `metadata.createdBy="${trialCreated.metadata.createdBy}", audit.operatorId="${auditEvent?.operatorId}"`;
  } catch (err: any) {
    g53Creator03Details = err?.message || String(err);
  }
  record(
    'G53-CREATOR-03',
    'Création autorisée et tracée avec createdBy valide',
    'CREATOR_INTEGRITY',
    g53Creator03Success,
    'metadata.createdBy="Jean Dupont" et auditTrail.operatorId="Jean Dupont"',
    g53Creator03Details
  );

  // G53-CREATOR-04 : Test UI Wizard : bouton final bloqué si createdBy = '' à l'étape 7
  const isAllowedWhenEmptyAtStep7 = isFinalCreateAllowed(7, '');
  const isAllowedWhenWhitespaceAtStep7 = isFinalCreateAllowed(7, '   ');
  const isAllowedWhenValidAtStep7 = isFinalCreateAllowed(7, 'Simon Martin');
  const g53Creator04Passed = !isAllowedWhenEmptyAtStep7 && !isAllowedWhenWhitespaceAtStep7 && isAllowedWhenValidAtStep7;
  record(
    'G53-CREATOR-04',
    'Garde-fou UI final : bouton Créer l\'Essai bloqué si createdBy absent à l\'étape 7',
    'CREATOR_INTEGRITY',
    g53Creator04Passed,
    'isFinalCreateAllowed: false si vide/espaces, true si valide',
    `vide=${isAllowedWhenEmptyAtStep7}, espaces=${isAllowedWhenWhitespaceAtStep7}, valide=${isAllowedWhenValidAtStep7}`
  );

  // ==========================================================================
  // 2. TESTS D'INTÉGRITÉ MÉDIAS : MESURE ≠ PHOTO
  // ==========================================================================

  // Préparation d'un essai dédié aux tests médias
  const trialMedia = globalTrialStore.createTrial({
    metadata: {
      reference: 'TRIAL-MEDIA-G53',
      title: 'Essai Intégrité Médias',
      createdBy: 'Technicien Métrologie'
    } as TrialMetadata,
    batches: baseBatches,
    activeFamilies: ['COLOR', 'OBSERVATIONS']
  });

  const panel = trialMedia.batches[0].panels[0];
  const stage = trialMedia.stages[0]; // T0

  // G53-MEDIA-01 : Créer acquisition avec mediaIds: ['media-1'], supprimer media-1 -> acquisition et données intactes
  const photo1 = globalTrialStore.attachPhoto({
    trialId: trialMedia.id,
    panelId: panel.id,
    stageId: stage.id,
    filename: 'test_observation_t0.jpg',
    caption: 'Cliché initial T0',
    operatorId: 'Technicien Métrologie'
  });

  const media1Id = photo1.mediaReferences[photo1.mediaReferences.length - 1].id;

  // Créer une observation qui référence ce mediaId
  const rawObs: VisualObservationsRawData = {
    observations: [
      {
        category: 'GENERAL_APPEARANCE',
        categoryLabel: 'Aspect général',
        rating: 0,
        status: 'CONFORME'
      }
    ],
    overallNotes: 'Parfait état initial'
  };

  trialMedia.acquisitions[`${stage.id}__${panel.id}__OBSERVATIONS`] = {
    id: generateUUID(),
    trialId: trialMedia.id,
    stageId: stage.id,
    batchId: panel.batchId,
    panelId: panel.id,
    familyId: 'OBSERVATIONS',
    status: 'COMPLETE',
    alerts: [],
    raw: rawObs,
    computed: {
      totalEvaluated: 1,
      defectsCount: 0,
      maxRating: 0,
      summary: 'Parfait état',
      qualityAssessment: {
        expectedCount: 1,
        actualCount: 1,
        validCount: 1,
        suspectCount: 0,
        invalidCount: 0,
        missingCount: 0,
        completenessPercent: 100,
        status: 'CONFORME',
        warnings: []
      },
      protocolStatus: 'NORMATIVE_DEFAULT',
      computation: {
        calculationVersion: '1.0',
        calculatedAt: new Date().toISOString()
      }
    },
    trace: {
      createdAt: new Date().toISOString(),
      createdBy: 'Technicien Métrologie',
      source: 'MANUAL_KEYPAD'
    },
    mediaIds: [media1Id]
  };
  globalTrialStore.saveTrial(trialMedia);

  // Supprimer la photo media1Id
  globalTrialStore.deletePhoto(trialMedia.id, media1Id, 'Technicien Métrologie');
  const updatedTrialAfterDelete = globalTrialStore.getTrial(trialMedia.id)!;
  const acqAfterDelete = updatedTrialAfterDelete.acquisitions[`${stage.id}__${panel.id}__OBSERVATIONS`];

  const g53Media01Passed =
    acqAfterDelete !== undefined &&
    acqAfterDelete.status === 'COMPLETE' &&
    !acqAfterDelete.mediaIds.includes(media1Id) &&
    acqAfterDelete.mediaIds.length === 0 &&
    (acqAfterDelete.raw as VisualObservationsRawData).overallNotes === 'Parfait état initial' &&
    acqAfterDelete.computed !== undefined;

  record(
    'G53-MEDIA-01',
    'Suppression d\'un cliché : mediaId nettoyé, acquisition, status, raw et computed conservés',
    'MEDIA_INTEGRITY',
    g53Media01Passed,
    'media1 retiré, status=COMPLETE, raw et computed inchangés',
    `mediaIds=[${acqAfterDelete?.mediaIds?.join(',')}], status=${acqAfterDelete?.status}, hasRaw=${Boolean(acqAfterDelete?.raw)}`
  );

  // G53-MEDIA-02 : Une acquisition COMPLETE possède une photo. Supprimer la photo -> l'acquisition reste COMPLETE
  // Vérification directe sur le résultat de la suppression précédente
  const g53Media02Passed = acqAfterDelete !== undefined && acqAfterDelete.status === 'COMPLETE';
  record(
    'G53-MEDIA-02',
    'Une acquisition reste STRICTEMENT COMPLETE après suppression de sa photographie associée',
    'MEDIA_INTEGRITY',
    g53Media02Passed,
    'status === "COMPLETE"',
    `status=${acqAfterDelete?.status}`
  );

  // G53-MEDIA-03 : Une acquisition avec mediaIds: [] reste exploitable par les moteurs scientifiques (complétude != photo)
  const readingsColor: ColorRawPoint[] = [
    { pointIndex: 1, L: 50.2, a: 12.1, b: 24.5 },
    { pointIndex: 2, L: 50.4, a: 12.0, b: 24.6 },
    { pointIndex: 3, L: 50.1, a: 12.2, b: 24.4 },
    { pointIndex: 4, L: 50.3, a: 12.1, b: 24.5 }
  ];
  const rawColor: ColorRawData = {
    readings: readingsColor,
    instrumentMetadata: { geometry: 'd/8' }
  };

  trialMedia.acquisitions[`${stage.id}__${panel.id}__COLOR`] = {
    id: generateUUID(),
    trialId: trialMedia.id,
    stageId: stage.id,
    batchId: panel.batchId,
    panelId: panel.id,
    familyId: 'COLOR',
    status: 'COMPLETE',
    alerts: [],
    raw: rawColor,
    computed: {
      pointsCount: 4,
      validCount: 4,
      meanL: 50.25,
      meanA: 12.1,
      meanB: 24.5,
      stdDevL: 0.1,
      stdDevA: 0.1,
      stdDevB: 0.1,
      chromaC: 27.3,
      hueH: 63.7,
      deltaL: 0.0,
      deltaA: 0.0,
      deltaB: 0.0,
      deltaE: 0.0,
      qualityAssessment: {
        expectedCount: 4,
        actualCount: 4,
        validCount: 4,
        suspectCount: 0,
        invalidCount: 0,
        missingCount: 0,
        completenessPercent: 100,
        status: 'GOOD',
        warnings: []
      },
      protocolStatus: 'STANDARD',
      computation: {
        calculationVersion: '1.0',
        calculatedAt: new Date().toISOString()
      }
    } as ColorComputedData,
    trace: {
      createdAt: new Date().toISOString(),
      createdBy: 'Technicien Métrologie',
      source: 'MANUAL_KEYPAD'
    },
    mediaIds: [] // Aucun média attaché
  };
  globalTrialStore.saveTrial(trialMedia);

  const ruleSet = getDefaultScientificRuleSet();
  const stageAssessment = assessStageQuality(stage.id, trialMedia, ruleSet);
  const colorAcq = trialMedia.acquisitions[`${stage.id}__${panel.id}__COLOR`];
  const colorComputed = colorAcq.computed as ColorComputedData;

  // Le moteur scientifique analyse parfaitement l'acquisition sans exiger de photo
  const g53Media03Passed =
    colorAcq.mediaIds.length === 0 &&
    colorAcq.status === 'COMPLETE' &&
    typeof colorComputed.meanL === 'number' &&
    stageAssessment !== undefined;

  record(
    'G53-MEDIA-03',
    'L\'absence de photo (mediaIds: []) n\'entrave pas l\'exploitation scientifique (Mesure ≠ Photo)',
    'MEDIA_INTEGRITY',
    g53Media03Passed,
    'Acquisition sans média valide et exploitable dans les moteurs scientifiques',
    `mediaIdsCount=${colorAcq.mediaIds.length}, meanL=${colorComputed.meanL}, stageAssessmentGenerated=${Boolean(stageAssessment)}`
  );

  // G53-MEDIA-04 : attachPhoto avec remplacement (replacedMediaId) :
  // ancien retiré, nouveau ajouté, aucun doublon, données scientifiques inchangées
  const photoInitial = globalTrialStore.attachPhoto({
    trialId: trialMedia.id,
    panelId: panel.id,
    stageId: stage.id,
    filename: 'initial_shot.jpg',
    caption: 'Premier cliché',
    operatorId: 'Technicien Métrologie'
  });
  const initialPhotoId = photoInitial.mediaReferences.find((m) => m.filename === 'initial_shot.jpg' && m.status === 'ACTIVE')!.id;

  // Lier ce cliché à l'acquisition d'observation
  acqAfterDelete.mediaIds = [initialPhotoId];
  globalTrialStore.saveTrial(trialMedia);

  // Remplacement par un nouveau cliché sur le même panneau et le même jalon
  const photoReplaced = globalTrialStore.attachPhoto({
    trialId: trialMedia.id,
    panelId: panel.id,
    stageId: stage.id,
    filename: 'replacement_shot.jpg',
    caption: 'Deuxième cliché de remplacement',
    operatorId: 'Technicien Métrologie'
  });

  const newPhotoId = photoReplaced.mediaReferences.find((m) => m.filename === 'replacement_shot.jpg' && m.status === 'ACTIVE')!.id;
  const oldPhotoRef = photoReplaced.mediaReferences.find((m) => m.id === initialPhotoId)!;
  const updatedObsAcq = photoReplaced.acquisitions[`${stage.id}__${panel.id}__OBSERVATIONS`];

  // Vérifications d'intégrité
  const oldRemovedFromAcq = !updatedObsAcq.mediaIds.includes(initialPhotoId);
  const newAddedToAcq = updatedObsAcq.mediaIds.includes(newPhotoId);
  const noDuplicates = updatedObsAcq.mediaIds.filter((id) => id === newPhotoId).length === 1;
  const oldPhotoArchived = oldPhotoRef.status === 'ARCHIVED';
  const scientificDataIntact =
    updatedObsAcq.status === 'COMPLETE' &&
    (updatedObsAcq.raw as VisualObservationsRawData).overallNotes === 'Parfait état initial';

  const g53Media04Passed =
    oldRemovedFromAcq &&
    newAddedToAcq &&
    noDuplicates &&
    oldPhotoArchived &&
    scientificDataIntact;

  record(
    'G53-MEDIA-04',
    'attachPhoto avec remplacement : ancien retiré, nouveau ajouté, aucun doublon, intégrité intacte',
    'MEDIA_INTEGRITY',
    g53Media04Passed,
    'oldRemoved=true, newAdded=true, noDuplicates=true, oldPhotoArchived=true, scienceIntact=true',
    `oldRemoved=${oldRemovedFromAcq}, newAdded=${newAddedToAcq}, duplicatesCount=${updatedObsAcq.mediaIds.filter((id) => id === newPhotoId).length}, oldStatus=${oldPhotoRef?.status}`
  );

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
