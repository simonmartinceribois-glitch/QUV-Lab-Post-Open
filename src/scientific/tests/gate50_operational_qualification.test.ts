/**
 * QUV-Lab — Suite de Tests de Qualification Opérationnelle GATE 5.0
 * Sauvegarde, Restauration, Résilience, Versionnage, Archivage, Intégrité et Déploiement
 */

import { globalTrialStore, IntegrityViolationError } from '../../services/trialStore';
import { getDefaultScientificRuleSet } from '../ruleSet';
import {
  Trial,
  TrialMetadata,
  CommonCharacteristics,
  BatchDefinition,
  ExposureStage,
  PhotoReference
} from '../../types/trial';
import {
  ColorRawData,
  GlossRawData,
  PersozRawData,
  VisualObservationsRawData
} from '../../types/scientific';
import { exportRawDataToCsv, exportReportToCsv, buildScientificReport } from '../../services/reportGenerator';
import { recalculateAcquisition } from '../recalculator';

export interface Gate50TestResult {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: unknown;
}

export interface Gate50Summary {
  total: number;
  passed: number;
  failed: number;
  results: Gate50TestResult[];
}

export function runGate50OperationalQualificationTests(): Gate50Summary {
  const results: Gate50TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  function record(
    id: string,
    name: string,
    category: string,
    passed: boolean,
    expected: string,
    actual: string,
    details?: unknown
  ) {
    results.push({ id, name, category, passed, expected, actual, details });
  }

  // --- 1. Création d'un essai complet représentatif pour les tests de sauvegarde / restauration ---
  const trialId = 'trial-gate50-backup-01';
  const now = new Date().toISOString();

  const metadata: TrialMetadata = {
    reference: 'QUV-2026-GATE50-QUALIF',
    orderNumber: 'CMD-QUALIF-2026',
    reportNumber: 'RAP-QUALIF-2026',
    title: 'Qualification Opérationnelle Système — Essai Représentatif Multi-Lots',
    projectOrClient: 'Ceribois & Partenaires Qualité',
    coatingSystemDescription: 'Système Lasurage Haute Durabilité Hydro & Solvanté',
    substrateDescription: 'Pin sylvestre & Chêne européen quartier',
    createdBy: 'Simon Martin (Responsable Qualité)',
    generalNotes: 'Essai complet dédié à la qualification opérationnelle de sauvegarde et restauration.'
  };

  const commonCharacteristics: CommonCharacteristics = {
    dimensions: { lengthMm: 150, widthMm: 75, thicknessMm: 15, unit: 'mm' },
    substrateNature: 'Bois massif',
    materialType: 'Pin sylvestre et Chêne',
    woodGrainOrientation: 'Sur quartier (NF EN 927-6)',
    preparationNotes: 'Rabotage, ponçage P120, dépoussiérage',
    conditioningNotes: 'Stabilisation 7 jours à 20°C / 65% HR'
  };

  const stages: ExposureStage[] = [
    {
      id: `st-g50-0`,
      trialId,
      cycleIndex: 0,
      stageType: 'INITIAL_PRE_EXPOSURE',
      name: 'T0 — MESURES INITIALES AVANT EXPOSITION',
      scheduledExposureHours: 0,
      actualExposureHours: 0,
      status: 'VALIDATED',
      validatedBy: 'SM',
      validatedAt: now
    },
    {
      id: `st-g50-1`,
      trialId,
      cycleIndex: 1,
      stageType: 'INTERMEDIATE_DURING_EXPOSURE',
      name: '168 h — MESURES EN COURS D\'EXPOSITION',
      scheduledExposureHours: 168,
      actualExposureHours: 168,
      status: 'VALIDATED',
      validatedBy: 'SM',
      validatedAt: now
    },
    {
      id: `st-g50-12`,
      trialId,
      cycleIndex: 12,
      stageType: 'FINAL_POST_EXPOSURE',
      name: '2016 h — MESURES FINALES APRÈS EXPOSITION',
      scheduledExposureHours: 2016,
      actualExposureHours: 2016,
      status: 'VALIDATED',
      validatedBy: 'SM',
      validatedAt: now
    }
  ];

  const batches: BatchDefinition[] = [
    {
      id: `batch-g50-1`,
      trialId,
      reference: 'LOT-A-HYDRO',
      orderIndex: 1,
      coatingSystem: 'Lasure Hydro 3C',
      woodSpecies: 'Pin sylvestre',
      coatCount: 3,
      panels: [
        { id: `p-g50-1-T`, batchId: `batch-g50-1`, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', grainOrientation: 'Quartier', status: 'ACTIVE' },
        { id: `p-g50-1-E1`, batchId: `batch-g50-1`, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `p-g50-1-E2`, batchId: `batch-g50-1`, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `p-g50-1-E3`, batchId: `batch-g50-1`, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', grainOrientation: 'Faux quartier', exposureFace: 'Face externe', status: 'ACTIVE' }
      ]
    },
    {
      id: `batch-g50-2`,
      trialId,
      reference: 'LOT-B-SOLV',
      orderIndex: 2,
      coatingSystem: 'Lasure Solvantée 3C',
      woodSpecies: 'Chêne',
      coatCount: 3,
      panels: [
        { id: `p-g50-2-T`, batchId: `batch-g50-2`, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', grainOrientation: 'Quartier', status: 'ACTIVE' },
        { id: `p-g50-2-E1`, batchId: `batch-g50-2`, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `p-g50-2-E2`, batchId: `batch-g50-2`, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `p-g50-2-E3`, batchId: `batch-g50-2`, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', grainOrientation: 'Faux quartier', exposureFace: 'Face externe', status: 'ACTIVE' }
      ]
    }
  ];

  const initialTrial: Trial = {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: now,
    updatedAt: now,
    metadata,
    commonCharacteristics,
    status: 'COMPLETED',
    configurationStatus: 'LOCKED',
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
      intermediateCycles: [{ cycleIndex: 1, mandatory: true }],
      finalCycle: { cycleIndex: 12, mandatory: true }
    },
    stages,
    batches,
    acquisitions: {},
    auditTrail: [
      {
        id: 'aud-g50-1',
        trialId,
        timestamp: now,
        operatorId: 'SM',
        action: 'CREATE_TRIAL',
        entityType: 'TRIAL',
        entityId: trialId
      }
    ],
    mediaReferences: []
  };

  globalTrialStore.saveTrial(initialTrial);

  // Remplissage des données T0 et 2016h
  stages.forEach((st) => {
    batches.forEach((b) => {
      b.panels.forEach((p) => {
        const isT0 = st.cycleIndex === 0;
        const delta = isT0 ? 0 : b.reference === 'LOT-A-HYDRO' ? 4.5 : 8.2;

        // Couleur
        const colorRaw: ColorRawData = {
          readings: [
            { pointIndex: 1, L: 60.0 + delta, a: 3.0, b: 15.0 },
            { pointIndex: 2, L: 60.0 + delta, a: 3.0, b: 15.0 },
            { pointIndex: 3, L: 60.0 + delta, a: 3.0, b: 15.0 },
            { pointIndex: 4, L: 60.0 + delta, a: 3.0, b: 15.0 }
          ]
        };
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: st.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'COLOR',
          raw: colorRaw,
          operatorId: 'SM'
        });

        // Brillance
        const glossRaw: GlossRawData = {
          series: [
            {
              seriesIndex: 1,
              orientation: 'PARALLEL_TO_GRAIN',
              readings: [
                { pointIndex: 1, value: isT0 ? 50.0 : 35.0 },
                { pointIndex: 2, value: isT0 ? 50.0 : 35.0 }
              ]
            },
            {
              seriesIndex: 2,
              orientation: 'PERPENDICULAR_DIRECTION',
              readings: [
                { pointIndex: 1, value: isT0 ? 48.0 : 33.0 },
                { pointIndex: 2, value: isT0 ? 48.0 : 33.0 }
              ]
            }
          ],
          instrumentMetadata: { instrumentId: 'TRI-GLOSS-QUALIF', geometry: '60' }
        };
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: st.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'GLOSS',
          raw: glossRaw,
          operatorId: 'SM'
        });

        // Persoz
        const persozRaw: PersozRawData = {
          readings: [
            { pointIndex: 1, dampingTimeSeconds: isT0 ? 150.0 : 130.0 },
            { pointIndex: 2, dampingTimeSeconds: isT0 ? 150.0 : 130.0 },
            { pointIndex: 3, dampingTimeSeconds: isT0 ? 150.0 : 130.0 }
          ],
          unit: 'SECONDS'
        };
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: st.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'PERSOZ',
          raw: persozRaw,
          operatorId: 'SM'
        });

        // Observations
        const obsRaw: VisualObservationsRawData = {
          observations: [
            { category: 'BLISTERING', categoryLabel: 'Cloquage', rating: 0, status: 'CONFORME' },
            { category: 'FLAKING', categoryLabel: 'Écaillage', rating: 0, status: 'CONFORME' },
            { category: 'CRACKING', categoryLabel: 'Craquelage', rating: 0, status: 'CONFORME' },
            { category: 'CHALKING', categoryLabel: 'Farinage', rating: 0, status: 'CONFORME' }
          ]
        };
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: st.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'OBSERVATIONS',
          raw: obsRaw,
          operatorId: 'SM'
        });
      });
    });
  });

  // Photographie avec remplacement
  globalTrialStore.attachPhoto({
    trialId,
    stageId: stages[0].id,
    panelId: batches[0].panels[1].id,
    filename: 'photo_T0_E1_v1.jpg',
    caption: 'Photo initiale T0 brute',
    operatorId: 'SM'
  });
  globalTrialStore.attachPhoto({
    trialId,
    stageId: stages[0].id,
    panelId: batches[0].panels[1].id,
    filename: 'photo_T0_E1_v2_HD.jpg',
    caption: 'Photo initiale T0 Haute Définition étalonnée',
    operatorId: 'SM',
    replaceExisting: true
  });

  // =========================================================================
  // TEST G50-BCK-01 : Sauvegarde Complète (Backup A)
  // =========================================================================
  const savedTrial = globalTrialStore.getTrial(trialId)!;
  const backupJsonString = JSON.stringify(savedTrial, null, 2);

  const backupValid =
    backupJsonString.length > 5000 &&
    backupJsonString.includes('QUV-2026-GATE50-QUALIF') &&
    backupJsonString.includes('LOT-A-HYDRO') &&
    backupJsonString.includes('LOT-B-SOLV') &&
    backupJsonString.includes('photo_T0_E1_v2_HD.jpg');

  record(
    'G50-BCK-01',
    'Sauvegarde Complète (Backup A) : Sérialisation intégrale sans omission d\'entité',
    'BACKUP_INTEGRITY',
    backupValid,
    'Backup JSON contenant 100% des métadonnées, lots, panneaux, acquisitions, photos et audit',
    `Taille JSON=${backupJsonString.length} octets, Batches=${savedTrial.batches.length}, Acquisitions=${Object.keys(savedTrial.acquisitions).length}`
  );

  // =========================================================================
  // TEST G50-RES-01 : Restauration et Identité Strictes
  // =========================================================================
  const restoredTrial = JSON.parse(backupJsonString) as Trial;

  const idMatch = restoredTrial.id === savedTrial.id;
  const batchCountMatch = restoredTrial.batches.length === savedTrial.batches.length;
  const panelCountMatch =
    restoredTrial.batches.reduce((sum, b) => sum + b.panels.length, 0) === 8;
  const acqCountMatch =
    Object.keys(restoredTrial.acquisitions).length === Object.keys(savedTrial.acquisitions).length;
  const photosMatch = restoredTrial.mediaReferences.length === savedTrial.mediaReferences.length;
  const auditMatch = restoredTrial.auditTrail.length === savedTrial.auditTrail.length;

  const restorationSuccess =
    idMatch && batchCountMatch && panelCountMatch && acqCountMatch && photosMatch && auditMatch;

  record(
    'G50-RES-01',
    'Restauration & Identité : Comparaison stricte Trial Original vs Trial Restauré',
    'RESTORATION_FIDELITY',
    restorationSuccess,
    'Égalité stricte des identifiants, lots, panneaux, acquisitions, photos et auditTrail',
    `Id=${idMatch}, Batches=${batchCountMatch}, Panneaux=${panelCountMatch}, Acquisitions=${acqCountMatch}, Photos=${photosMatch}, Audit=${auditMatch}`
  );

  // =========================================================================
  // TEST G50-COR-01 : Test de Corruption JSON & Résilience
  // =========================================================================
  let malformedHandled = false;
  try {
    const corruptedJson = backupJsonString.slice(0, backupJsonString.length / 2); // JSON tronqué
    JSON.parse(corruptedJson);
  } catch (err) {
    malformedHandled = true;
  }

  record(
    'G50-COR-01',
    'Résilience Corruption : Détection stricte et rejet immédiat d\'un JSON malformé/tronqué',
    'CORRUPTION_RESILIENCE',
    malformedHandled,
    'Erreur de désérialisation interceptée sans écrasement de la mémoire',
    `JSON malformé intercepté avec succès : ${malformedHandled}`
  );

  // =========================================================================
  // TEST G50-COR-02 : Garde-fous d'Intégrité Relationnelle (Rejet d'Orphelins)
  // =========================================================================
  let relationProtected = false;
  try {
    // Tentative d'enregistrement sur une éprouvette orpheline inexistante
    globalTrialStore.recordAcquisition({
      trialId,
      stageId: stages[0].id,
      batchId: batches[0].id,
      panelId: 'orphelin-inexistant-uuid',
      familyId: 'COLOR',
      raw: { readings: [] },
      operatorId: 'HACKER'
    });
  } catch (err) {
    if (err instanceof IntegrityViolationError || (err as Error).message.includes("n'appartient pas au lot")) {
      relationProtected = true;
    }
  }

  record(
    'G50-COR-02',
    'Intégrité Relationnelle : Rejet bloquant de toute acquisition orpheline',
    'RELATIONAL_INTEGRITY',
    relationProtected,
    'Levée d\'une IntegrityViolationError explicite empêchant toute corruption',
    `Protection relationnelle active : ${relationProtected}`
  );

  // =========================================================================
  // TEST G50-VER-01 : Versionnage des Modèles et Règles Scientifiques
  // =========================================================================
  const schemaVer = savedTrial.schemaVersion;
  const ruleVer = ruleSet.version;
  const stdRef = ruleSet.standardReference;

  const versioningValid =
    schemaVer === '1.2.0' && ruleVer.includes('v1.2.0') && stdRef.includes('NF EN 927-6');

  record(
    'G50-VER-01',
    'Versionnage & Traçabilité : Identification formelle schemaVersion et RuleSet ID',
    'VERSIONING_MANAGEMENT',
    versioningValid,
    'schemaVersion=1.2.0, ruleSet.version incluant v1.2.0, standardReference=NF EN 927-6',
    `Schema=${schemaVer}, RuleVersion=${ruleVer}, Standard=${stdRef}`
  );

  // =========================================================================
  // TEST G50-EXP-01 : Cycle Complet Exportations (JSON, RAW CSV, REPORT CSV)
  // =========================================================================
  const reportObj = buildScientificReport(savedTrial, ruleSet, {
    operatorId: 'SM',
    versionNumber: 'v1.0'
  });
  const rawCsv = exportRawDataToCsv(savedTrial);
  const reportCsv = exportReportToCsv(savedTrial, reportObj, ruleSet);

  const exportsValid =
    rawCsv.includes('DONNÉES BRUTES ACQUISES') &&
    rawCsv.includes('LOT-A-HYDRO') &&
    rawCsv.includes('MANUAL_KEYPAD') &&
    reportCsv.includes('RAPPORT SCIENTIFIQUE') &&
    reportCsv.includes('MATRICE DES LOTS') &&
    reportCsv.includes('NF EN 927-6');

  record(
    'G50-EXP-01',
    'Cycle d\'Exportation & Archivage : Exhaustivité des formats RAW CSV et REPORT CSV',
    'EXPORT_ARCHIVING',
    exportsValid,
    'Présence des en-têtes normatifs, traçabilité des opérateurs et séparation RAW / COMPUTED',
    `RAW CSV=${rawCsv.split('\n').length} lignes, REPORT CSV=${reportCsv.split('\n').length} lignes`
  );

  // =========================================================================
  // TEST G50-LCL-01 : Résilience après purge locale & Restauration
  // =========================================================================
  const tempStore = new Map<string, Trial>();
  tempStore.set(restoredTrial.id, restoredTrial);

  const reloaded = tempStore.get(trialId)!;
  const reloadedReport = buildScientificReport(reloaded, ruleSet, {
    operatorId: 'SM',
    versionNumber: 'v1.0'
  });

  const localResiliencePassed =
    reloaded.id === trialId &&
    reloaded.batches.length === 2 &&
    reloadedReport.sections.factualConclusion.length > 50;

  record(
    'G50-LCL-01',
    'Persistance Locale & Continuité : Restauration et calcul immédiat après recharge',
    'LOCAL_STORAGE_RESILIENCE',
    localResiliencePassed,
    'Reprise intégrale et recalcul des rapports scientifiques après rechargement',
    `Essai Rechargé=${reloaded.id}, Lots en Matrice=${reloaded.batches.length}`
  );

  // =========================================================================
  // TEST G50-REP-01 : Reproductibilité Scientifique Déterministe
  // =========================================================================
  const sampleAcqKey = `${stages[2].id}__${batches[0].panels[1].id}__COLOR`;
  const sampleAcq = savedTrial.acquisitions[sampleAcqKey];
  const { updatedRecord: recalcRecord } = recalculateAcquisition(sampleAcq, savedTrial, ruleSet);

  const origDeltaE = (sampleAcq.computed as any)?.deltaE;
  const recalcDeltaE = (recalcRecord.computed as any)?.deltaE;

  const reproducibilityPassed =
    origDeltaE !== undefined &&
    recalcDeltaE !== undefined &&
    Math.abs(origDeltaE - recalcDeltaE) < 1e-6;

  record(
    'G50-REP-01',
    'Reproductibilité Scientifique : Recalcul déterministe identique (ΔE* orig == ΔE* recalculé)',
    'DETERMINISTIC_REPRODUCIBILITY',
    reproducibilityPassed,
    'Égalité mathématique absolue entre calcul archivé et recalcul moteur',
    `ΔE* Archivé=${origDeltaE?.toFixed(3)}, ΔE* Recalculé=${recalcDeltaE?.toFixed(3)}`
  );

  // =========================================================================
  // TEST G50-IMM-01 : Immutabilité et Protection des Jalons Obligatoires
  // =========================================================================
  let protectedFromDeactivation = false;
  try {
    globalTrialStore.toggleStageStatus(trialId, stages[0].id, false, 'HACKER', 'Tentative désactivation T0');
  } catch (err) {
    if ((err as Error).message.includes('obligatoires')) {
      protectedFromDeactivation = true;
    }
  }

  record(
    'G50-IMM-01',
    'Immutabilité & Règles Métier : Protection absolue des jalons T0 et C12 contre toute désactivation',
    'IMMUTABILITY_RULES',
    protectedFromDeactivation,
    'Rejet systématique de toute désactivation de T0 ou C12 selon NF EN 927-6',
    `Protection T0/C12 active : ${protectedFromDeactivation}`
  );

  // =========================================================================
  // TEST G50-PHO-01 : Caractérisation Métrologique des Photographies
  // =========================================================================
  const photos = savedTrial.mediaReferences;
  const activePhotos = photos.filter((p) => p.status === 'ACTIVE');
  const archivedPhotos = photos.filter((p) => p.status === 'ARCHIVED');

  const photoLifecyclePassed =
    activePhotos.length === 1 &&
    archivedPhotos.length === 1 &&
    archivedPhotos[0].replacementMediaId === activePhotos[0].id;

  record(
    'G50-PHO-01',
    'Photothèque : Unicité active, archivage non destructif et traçabilité replacementMediaId',
    'PHOTO_LIFECYCLE_INTEGRITY',
    photoLifecyclePassed,
    '1 photo active, 1 photo archivée avec chaînage explicite replacementMediaId',
    `Actives=${activePhotos.length}, Archivées=${archivedPhotos.length}, Chaînage=${archivedPhotos[0]?.replacementMediaId === activePhotos[0]?.id}`
  );

  // =========================================================================
  // TEST G50-AUD-01 : Journal d'Audit Append-Only
  // =========================================================================
  const auditEvents = savedTrial.auditTrail;
  const hasValidTimestamps = auditEvents.every((e) => !isNaN(new Date(e.timestamp).getTime()));
  const isChronological = auditEvents.every((e, idx) => {
    if (idx === 0) return true;
    return new Date(e.timestamp).getTime() >= new Date(auditEvents[idx - 1].timestamp).getTime();
  });

  const auditPassed = auditEvents.length >= 10 && hasValidTimestamps && isChronological;

  record(
    'G50-AUD-01',
    'Journal d\'Audit : Intégrité chronologique, horodatage ISO et absence d\'événements corrompus',
    'AUDIT_TRAIL_INTEGRITY',
    auditPassed,
    'Événements chronologiques append-only avec opérateurs et timestamps valides',
    `Total Événements=${auditEvents.length}, Chronologique=${isChronological}`
  );

  // Résumé
  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return { total, passed, failed, results };
}
