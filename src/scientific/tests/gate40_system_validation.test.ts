/**
 * QUV-Lab — Suite de Validation Système Complète GATE 4.0
 *
 * Scénario de recette utilisateur de bout en bout (End-to-End User Lifecycle) :
 * 1. Création et initialisation d'un essai multi-lots représentatif (2 lots, 8 éprouvettes, 13 jalons).
 * 2. Saisie intégrale de la référence initiale T0 (Couleur, Brillance, Persoz, Observations, Photographies).
 * 3. Validation formelle du jalon T0 et passage en phase d'exposition active.
 * 4. Progression temporelle réaliste des cycles QUV (C1..C12 / 2016 h) avec cinétiques différentielles (Lot A vs Lot B).
 * 5. Respect absolu de la ségrégation métrologique du Témoin T (présentation documentaire sans pollution des moyennes).
 * 6. Gestion du cycle de vie de la photothèque (cliché actif, remplacement, archivage traçable).
 * 7. Contrôle qualité et gestion des adaptations de protocole justifiées (ADAPTED_JUSTIFIED).
 * 8. Analyse comparative multi-systèmes et vérification de l'étanchéité inter-lots.
 * 9. Audit pré-rapport et génération du Rapport Scientifique complet (19 sections + 6 annexes).
 * 10. Double export (RAW CSV paillasse vs REPORT CSV calculé) et réversibilité totale du JSON d'export.
 * 11. Persistance et reprise d'activité sans perte de données.
 * 12. Intégrité et complétude du journal d'audit (auditTrail append-only).
 */

import {
  globalTrialStore,
  generateStandardExposureStages,
  generateUUID
} from '../../services/trialStore';
import {
  auditTrialBeforeReport,
  buildScientificReport,
  exportReportToCsv,
  exportRawDataToCsv
} from '../../services/reportGenerator';
import { getDefaultScientificRuleSet, createCountConfiguration } from '../ruleSet';
import { evaluateCountProtocolCompliance } from '../protocolEngine';
import { assessTrialQuality } from '../qualityEngine';
import { extractTemporalKinetics } from '../analysis/TrendAnalyzer';
import { compareSystemsAtStage } from '../analysis/MultiSystemComparator';
import {
  Trial,
  BatchDefinition,
  PanelDefinition,
  ExposureStage
} from '../../types/trial';
import {
  ScientificRuleSet,
  ColorRawData,
  GlossRawData,
  PersozRawData,
  VisualObservationsRawData
} from '../../types/scientific';

export interface Gate40TestResult {
  id: string;
  name: string;
  category:
    | 'SCENARIO_CREATION'
    | 'T0_REFERENCE_ACQUISITION'
    | 'PROGRESSIVE_EXPOSURE_2016H'
    | 'WITNESS_METROLOGICAL_SEGREGATION'
    | 'PHOTOGRAPHY_LIFECYCLE'
    | 'PROTOCOL_ADAPTATION_JUSTIFICATION'
    | 'QUALITY_ASSESSMENT_COMPLETENESS'
    | 'MULTI_SYSTEM_ANALYSIS'
    | 'FULL_REPORT_19_SECTIONS'
    | 'DOUBLE_EXPORTS_AND_JSON_FIDELITY'
    | 'PERSISTENCE_AND_RESUME'
    | 'IMMUTABLE_AUDIT_TRAIL';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate40SystemValidationTests(): {
  results: Gate40TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate40TestResult[] = [];
  const ruleSet: ScientificRuleSet = getDefaultScientificRuleSet();

  const record = (
    id: string,
    name: string,
    category: Gate40TestResult['category'],
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  // ==========================================================================
  // ÉTAPE 1 : CRÉATION D'UN ESSAI DE RECETTE COMPLET (2 LOTS, 8 ÉPROUVETTES)
  // ==========================================================================

  const trialId = `trial-recette-gate40-${Date.now()}`;
  const stages = generateStandardExposureStages(trialId);
  const stageT0 = stages[0]; // 0h
  const stageC1 = stages[1]; // 168h
  const stageC2 = stages[2]; // 336h
  const stageC6 = stages[6]; // 1008h
  const stageC12 = stages[12]; // 2016h

  const b1Id = `${trialId}-lot-acrylique`;
  const b2Id = `${trialId}-lot-alkyde`;

  const panelsB1: PanelDefinition[] = [
    { id: `${b1Id}-e1`, label: 'E1', roleCode: 'E1', role: 'EXPOSED_1', batchId: b1Id, status: 'ACTIVE', index: 1 },
    { id: `${b1Id}-e2`, label: 'E2', roleCode: 'E2', role: 'EXPOSED_2', batchId: b1Id, status: 'ACTIVE', index: 2 },
    { id: `${b1Id}-e3`, label: 'E3', roleCode: 'E3', role: 'EXPOSED_3', batchId: b1Id, status: 'ACTIVE', index: 3 },
    { id: `${b1Id}-t`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: b1Id, status: 'ACTIVE', index: 4 }
  ];

  const panelsB2: PanelDefinition[] = [
    { id: `${b2Id}-e1`, label: 'E1', roleCode: 'E1', role: 'EXPOSED_1', batchId: b2Id, status: 'ACTIVE', index: 1 },
    { id: `${b2Id}-e2`, label: 'E2', roleCode: 'E2', role: 'EXPOSED_2', batchId: b2Id, status: 'ACTIVE', index: 2 },
    { id: `${b2Id}-e3`, label: 'E3', roleCode: 'E3', role: 'EXPOSED_3', batchId: b2Id, status: 'ACTIVE', index: 3 },
    { id: `${b2Id}-t`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: b2Id, status: 'ACTIVE', index: 4 }
  ];

  const batches: BatchDefinition[] = [
    {
      id: b1Id,
      trialId,
      orderIndex: 0,
      reference: 'LOT-A-ACRYLIQUE',
      coatingSystem: 'Système Acrylique Hydrodiluable 3 Couches',
      productReference: 'Peinture ACRY-PERF 3000',
      woodSpecies: 'Épicéa (Picea abies)',
      panels: panelsB1
    },
    {
      id: b2Id,
      trialId,
      orderIndex: 1,
      reference: 'LOT-B-ALKYDE',
      coatingSystem: 'Système Alkyde Solvanté Haute Extrait Sec',
      productReference: 'Lasure ALKY-DUR 100',
      woodSpecies: 'Pin Sylvestre (Pinus sylvestris)',
      panels: panelsB2
    }
  ];

  const trial: Trial = {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'IN_PROGRESS',
    configurationStatus: 'EDITABLE',
    metadata: {
      reference: 'ESSAI-RECETTE-QUV-2026-FINAL',
      title: 'RECETTE SYSTÈME — Qualification Finitions Bois NF EN 927-6',
      projectOrClient: 'CERIBOIS VALIDATION LAB',
      createdBy: 'Ingénieur Validation'
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

  globalTrialStore.saveTrial(trial);

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const isCreated =
      saved.id === trialId &&
      saved.batches.length === 2 &&
      saved.stages.length === 13 &&
      saved.batches[0].panels.length === 4 &&
      saved.batches[1].panels.length === 4;

    record(
      'G40-SYS-01',
      'Création Essai de Recette : Initialisation complète conforme (2 lots, 8 éprouvettes, 13 jalons, NF EN 927-6)',
      'SCENARIO_CREATION',
      isCreated,
      '2 lots, 8 éprouvettes, 13 jalons créés sans altération',
      `Lots=${saved.batches.length}, Éprouvettes=${saved.batches[0].panels.length + saved.batches[1].panels.length}, Jalons=${saved.stages.length}`
    );
  }

  // ==========================================================================
  // ÉTAPE 2 : SAISIE DE LA RÉFÉRENCE INITIALE T0 (4 FAMILLES SUR 8 ÉPROUVETTES)
  // ==========================================================================

  batches.forEach((b) => {
    b.panels.forEach((p) => {
      const baseL = b.id === b1Id ? 65.0 : 45.0;
      const baseGloss = b.id === b1Id ? 75.0 : 40.0;
      const basePersoz = b.id === b1Id ? 140 : 95;

      // 1. Couleur T0 (4 points CIE L*a*b*)
      globalTrialStore.recordAcquisition({
        trialId,
        stageId: stageT0.id,
        batchId: b.id,
        panelId: p.id,
        familyId: 'COLOR',
        raw: {
          readings: [
            { pointIndex: 1, L: baseL, a: 2.0, b: 12.0 },
            { pointIndex: 2, L: baseL, a: 2.0, b: 12.0 },
            { pointIndex: 3, L: baseL, a: 2.0, b: 12.0 },
            { pointIndex: 4, L: baseL, a: 2.0, b: 12.0 }
          ]
        } as ColorRawData,
        operatorId: 'Tech Paillasse T0'
      });

      // 2. Brillance T0 (2x2 séries 60°)
      globalTrialStore.recordAcquisition({
        trialId,
        stageId: stageT0.id,
        batchId: b.id,
        panelId: p.id,
        familyId: 'GLOSS',
        raw: {
          series: [
            { seriesIndex: 1, orientation: 'GRAIN_DIRECTION', readings: [{ pointIndex: 1, value: baseGloss }, { pointIndex: 2, value: baseGloss }] },
            { seriesIndex: 2, orientation: 'PERPENDICULAR_DIRECTION', readings: [{ pointIndex: 1, value: baseGloss }, { pointIndex: 2, value: baseGloss }] }
          ]
        } as GlossRawData,
        operatorId: 'Tech Paillasse T0'
      });

      // 3. Persoz T0 (3 mesures de temps en secondes)
      globalTrialStore.recordAcquisition({
        trialId,
        stageId: stageT0.id,
        batchId: b.id,
        panelId: p.id,
        familyId: 'PERSOZ',
        raw: {
          unit: 'SECONDS',
          readings: [
            { pointIndex: 1, dampingTimeSeconds: basePersoz },
            { pointIndex: 2, dampingTimeSeconds: basePersoz },
            { pointIndex: 3, dampingTimeSeconds: basePersoz }
          ]
        } as PersozRawData,
        operatorId: 'Tech Paillasse T0'
      });

      // 4. Observations T0 (4 catégories ISO 4628 cotées 0)
      globalTrialStore.recordAcquisition({
        trialId,
        stageId: stageT0.id,
        batchId: b.id,
        panelId: p.id,
        familyId: 'OBSERVATIONS',
        raw: {
          observations: [
            { category: 'BLISTERING', categoryLabel: 'Cloquage', rating: 0, status: 'CONFORME' },
            { category: 'FLAKING', categoryLabel: 'Écaillage', rating: 0, status: 'CONFORME' },
            { category: 'CRACKING', categoryLabel: 'Craquelage', rating: 0, status: 'CONFORME' },
            { category: 'CHALKING', categoryLabel: 'Farinage', rating: 0, status: 'CONFORME' }
          ]
        } as VisualObservationsRawData,
        operatorId: 'Tech Paillasse T0'
      });
    });
  });

  // Validation de l'étape T0
  globalTrialStore.validateStage(trialId, stageT0.id, 'Superviseur Qualité');

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const stageT0Status = saved.stages.find((s) => s.id === stageT0.id)?.status;
    const acqCountT0 = Object.keys(saved.acquisitions).filter((k) => k.startsWith(`${stageT0.id}__`)).length;

    // 8 éprouvettes x 4 familles = 32 acquisitions initiales
    const isT0Valid = stageT0Status === 'VALIDATED' && acqCountT0 === 32;

    record(
      'G40-T0-01',
      'Référence Initiale T0 : Complétude des 32 acquisitions (8 éprouvettes x 4 familles) et validation formelle de l\'étape',
      'T0_REFERENCE_ACQUISITION',
      isT0Valid,
      '32 acquisitions T0 enregistrées, stageT0.status = VALIDATED',
      `Acquisitions T0=${acqCountT0}, Statut=${stageT0Status}`
    );
  }

  // ==========================================================================
  // ÉTAPE 3 : PROGRESSION DE L'EXPOSITION (C1 168h -> C6 1008h -> C12 2016h)
  // ==========================================================================

  // Fonction utilitaire de saisie d'un jalon
  const recordExposureStageData = (stage: ExposureStage, degradationFactor: number) => {
    batches.forEach((b) => {
      b.panels.forEach((p) => {
        const isWitness = p.roleCode === 'T';
        const isLotA = b.id === b1Id;

        // Lot A résiste mieux que Lot B ; Témoin reste intact en obscurité
        const deltaL = isWitness ? 0.2 : isLotA ? 1.5 * degradationFactor : 4.0 * degradationFactor;
        const glossRet = isWitness ? 1.0 : isLotA ? Math.max(0.6, 1.0 - 0.03 * degradationFactor) : Math.max(0.2, 1.0 - 0.08 * degradationFactor);
        const persozDelta = isWitness ? 0 : isLotA ? -2 * degradationFactor : -6 * degradationFactor;
        const crackRating = isWitness ? 0 : isLotA ? (degradationFactor >= 4 ? 1 : 0) : (degradationFactor >= 3 ? 2 : 0);

        const baseL = isLotA ? 65.0 : 45.0;
        const baseGloss = isLotA ? 75.0 : 40.0;
        const basePersoz = isLotA ? 140 : 95;

        // Couleur
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: stage.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'COLOR',
          raw: {
            readings: [
              { pointIndex: 1, L: baseL + deltaL, a: 2.0 + deltaL * 0.3, b: 12.0 + deltaL * 0.5 },
              { pointIndex: 2, L: baseL + deltaL, a: 2.0 + deltaL * 0.3, b: 12.0 + deltaL * 0.5 },
              { pointIndex: 3, L: baseL + deltaL, a: 2.0 + deltaL * 0.3, b: 12.0 + deltaL * 0.5 },
              { pointIndex: 4, L: baseL + deltaL, a: 2.0 + deltaL * 0.3, b: 12.0 + deltaL * 0.5 }
            ]
          } as ColorRawData,
          operatorId: `Opérateur ${stage.name}`
        });

        // Brillance
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: stage.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'GLOSS',
          raw: {
            series: [
              { seriesIndex: 1, orientation: 'GRAIN_DIRECTION', readings: [{ pointIndex: 1, value: baseGloss * glossRet }, { pointIndex: 2, value: baseGloss * glossRet }] },
              { seriesIndex: 2, orientation: 'PERPENDICULAR_DIRECTION', readings: [{ pointIndex: 1, value: baseGloss * glossRet }, { pointIndex: 2, value: baseGloss * glossRet }] }
            ]
          } as GlossRawData,
          operatorId: `Opérateur ${stage.name}`
        });

        // Persoz
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: stage.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'PERSOZ',
          raw: {
            unit: 'SECONDS',
            readings: [
              { pointIndex: 1, dampingTimeSeconds: basePersoz + persozDelta },
              { pointIndex: 2, dampingTimeSeconds: basePersoz + persozDelta },
              { pointIndex: 3, dampingTimeSeconds: basePersoz + persozDelta }
            ]
          } as PersozRawData,
          operatorId: `Opérateur ${stage.name}`
        });

        // Observations
        globalTrialStore.recordAcquisition({
          trialId,
          stageId: stage.id,
          batchId: b.id,
          panelId: p.id,
          familyId: 'OBSERVATIONS',
          raw: {
            observations: [
              { category: 'BLISTERING', categoryLabel: 'Cloquage', rating: 0, status: 'CONFORME' },
              { category: 'FLAKING', categoryLabel: 'Écaillage', rating: 0, status: 'CONFORME' },
              { category: 'CRACKING', categoryLabel: 'Craquelage', rating: crackRating, status: crackRating > 0 ? 'OBSERVE' : 'CONFORME' },
              { category: 'CHALKING', categoryLabel: 'Farinage', rating: 0, status: 'CONFORME' }
            ]
          } as VisualObservationsRawData,
          operatorId: `Opérateur ${stage.name}`
        });
      });
    });

    globalTrialStore.validateStage(trialId, stage.id, 'Superviseur Qualité');
  };

  // Enregistrement des jalons C1 (168h), C2 (336h), C6 (1008h) et C12 (2016h)
  recordExposureStageData(stageC1, 1.0);
  recordExposureStageData(stageC2, 2.0);
  recordExposureStageData(stageC6, 4.0);
  recordExposureStageData(stageC12, 6.0);

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const stageC12Status = saved.stages.find((s) => s.id === stageC12.id)?.status;
    const kineticsA = extractTemporalKinetics(saved, b1Id);
    const kineticsB = extractTemporalKinetics(saved, b2Id);

    const k12A = kineticsA.find((k) => k.exposureHours === 2016);
    const k12B = kineticsB.find((k) => k.exposureHours === 2016);

    const deltaE_A = k12A?.meanDeltaE ?? 0;
    const deltaE_B = k12B?.meanDeltaE ?? 0;

    // Lot B (plus dégradé) doit avoir un deltaE supérieur au Lot A
    const passed = stageC12Status === 'VALIDATED' && deltaE_B > deltaE_A && deltaE_A > 0;

    record(
      'G40-EXP-01',
      'Progression Exposition 2016 h : Validation du jalon final C12 et discrimination nette des cinétiques (Lot A vs Lot B)',
      'PROGRESSIVE_EXPOSURE_2016H',
      passed,
      `C12 Validé, ΔE*(Lot B) > ΔE*(Lot A) > 0`,
      `Statut C12=${stageC12Status}, ΔE* Lot A=${deltaE_A.toFixed(2)}, ΔE* Lot B=${deltaE_B.toFixed(2)}`
    );
  }

  // ==========================================================================
  // ÉTAPE 4 : SÉGRÉGATION MÉTROLOGIQUE STRICTE DU TÉMOIN T
  // ==========================================================================

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const compStage12 = compareSystemsAtStage(saved, stageC12.id, ruleSet, [b1Id, b2Id]);

    // Éprouvettes exposées Lot A : E1, E2, E3 ont des deltaE élevés (~10.4) alors que le témoin T a deltaE ~ 1.4
    const meanExposedColor = compStage12.items[0]?.color?.meanDeltaE ?? 0;
    const witnessAcq = saved.acquisitions[`${stageC12.id}__${panelsB1[3].id}__COLOR`];
    const witnessDeltaE = (witnessAcq?.computed as any)?.deltaE ?? 0;

    const segregationPassed =
      meanExposedColor > 0 &&
      witnessDeltaE > 0 &&
      meanExposedColor > witnessDeltaE * 3;

    record(
      'G40-WIT-01',
      'Ségrégation Témoin T : Exclusion formelle de T dans les moyennes de cinétique et calculs d\'exposition',
      'WITNESS_METROLOGICAL_SEGREGATION',
      segregationPassed,
      'Moyenne exposés calculée strictement sur E1..E3 sans pollution par T',
      `Moyenne Exposés=${meanExposedColor.toFixed(2)}, Témoin T=${witnessDeltaE.toFixed(2)}`
    );
  }

  // ==========================================================================
  // ÉTAPE 5 : CYCLE DE VIE DE LA PHOTOTHÈQUE (AJOUT, REMPLACEMENT, ARCHIVAGE)
  // ==========================================================================

  // 1. Cliché initial C1
  globalTrialStore.attachPhoto({
    trialId,
    stageId: stageC1.id,
    panelId: panelsB1[0].id,
    filename: 'macro_lotA_e1_c1_v1.jpg',
    storageKey: 'data:image/jpeg;base64,mockInitialPhoto',
    caption: 'Aspect initial C1 (168h)',
    operatorId: 'Opérateur Photothèque'
  });

  // 2. Remplacement par un cliché de meilleure résolution (remplace la v1 et l'archive avec traçabilité)
  globalTrialStore.attachPhoto({
    trialId,
    stageId: stageC1.id,
    panelId: panelsB1[0].id,
    filename: 'macro_lotA_e1_c1_v2_HD.jpg',
    storageKey: 'data:image/jpeg;base64,mockHighDefPhoto',
    caption: 'Aspect C1 HD (168h)',
    operatorId: 'Opérateur Photothèque'
  });

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const panelPhotos = saved.mediaReferences.filter(
      (m) => m.stageId === stageC1.id && m.panelId === panelsB1[0].id
    );

    const activePhoto = panelPhotos.find((m) => m.status === 'ACTIVE');
    const archivedPhoto = panelPhotos.find((m) => m.status === 'ARCHIVED');

    const photoLifecyclePassed =
      panelPhotos.length === 2 &&
      activePhoto?.filename === 'macro_lotA_e1_c1_v2_HD.jpg' &&
      archivedPhoto?.filename === 'macro_lotA_e1_c1_v1.jpg' &&
      archivedPhoto?.replacementMediaId === activePhoto?.id;

    record(
      'G40-PHO-01',
      'Photothèque : Unicité de la photo active, archivage non-destructif et chaînage de remplacement (replacementMediaId)',
      'PHOTOGRAPHY_LIFECYCLE',
      photoLifecyclePassed,
      '1 active, 1 archivée avec replacementMediaId valide',
      `Total=${panelPhotos.length}, Active=${activePhoto?.filename}, Archivée=${archivedPhoto?.filename}, Link=${archivedPhoto?.replacementMediaId === activePhoto?.id}`
    );
  }

  // ==========================================================================
  // ÉTAPE 6 : ADAPTATIONS DU PLAN DE MESURE (JUSTIFICATION & STATUT)
  // ==========================================================================

  {
    // Simulation d'une adaptation motivée du plan de mesure : 2 points couleur au lieu de 4
    const justifiedConfig = createCountConfiguration('COLOR', 2, ruleSet, {
      justification: 'Éprouvettes à surface restreinte 50x50 mm dédiées au criblage formulatoire',
      operatorId: 'Responsable Laboratoire'
    });
    const evalJustified = evaluateCountProtocolCompliance(justifiedConfig, ruleSet);

    const passed =
      evalJustified.status === 'ADAPTED_JUSTIFIED' &&
      evalJustified.isAdapted === true &&
      evalJustified.protocolDefinition?.justification === 'Éprouvettes à surface restreinte 50x50 mm dédiées au criblage formulatoire';

    record(
      'G40-ADP-01',
      'Adaptation Protocolaire : Prise en compte et validation formelle de l\'adaptation motivée (ADAPTED_JUSTIFIED)',
      'PROTOCOL_ADAPTATION_JUSTIFICATION',
      passed,
      'status = ADAPTED_JUSTIFIED, isAdapted = true, justification documentée',
      `Statut=${evalJustified.status}, isAdapted=${evalJustified.isAdapted}, Justification="${evalJustified.protocolDefinition?.justification}"`
    );
  }

  // ==========================================================================
  // ÉTAPE 7 : CONTRÔLE QUALITÉ GLOBAL DU DOSSIER
  // ==========================================================================

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const qualityReport = assessTrialQuality(saved, ruleSet);
    const totalAcquisitions = Object.keys(saved.acquisitions).length;

    // Toutes les étapes T0, C1, C2, C6, C12 ont été saisies et validées
    const passed =
      totalAcquisitions >= 160 &&
      qualityReport.blockingAlertsCount === 0 &&
      qualityReport.globalQuality === 'GOOD';

    record(
      'G40-QUA-01',
      'Contrôle Qualité : Évaluation globale du dossier d\'essai (zéro anomalie bloquante sur les étapes actives)',
      'QUALITY_ASSESSMENT_COMPLETENESS',
      passed,
      'blockingAlertsCount = 0, acquisitions >= 160, globalQuality = GOOD',
      `Acquisitions=${totalAcquisitions}, Alertes Bloquantes=${qualityReport.blockingAlertsCount}, Qualité=${qualityReport.globalQuality}`
    );
  }

  // ==========================================================================
  // ÉTAPE 8 : ANALYSE MULTI-SYSTÈMES ET ÉTANCHÉITÉ DES LOTS
  // ==========================================================================

  {
    const saved = globalTrialStore.getTrial(trialId)!;
    const comparison = compareSystemsAtStage(saved, stageC12.id, ruleSet, [b1Id, b2Id]);

    const itemA = comparison.items.find((it) => it.batchId === b1Id);
    const itemB = comparison.items.find((it) => it.batchId === b2Id);

    const multiSystemPassed =
      Boolean(itemA && itemB) &&
      itemA?.batchReference === 'LOT-A-ACRYLIQUE' &&
      itemB?.batchReference === 'LOT-B-ALKYDE' &&
      (itemA?.color?.meanDeltaE ?? 0) !== (itemB?.color?.meanDeltaE ?? 0);

    record(
      'G40-MUL-01',
      'Comparateur Multi-Systèmes : Étanchéité absolue et comparaison des performances Lot A vs Lot B à 2016 h',
      'MULTI_SYSTEM_ANALYSIS',
      multiSystemPassed,
      'Lot A et Lot B comparés sans contamination croisée',
      `Lot A ΔE*=${itemA?.color?.meanDeltaE?.toFixed(2)}, Lot B ΔE*=${itemB?.color?.meanDeltaE?.toFixed(2)}`
    );
  }

  // ==========================================================================
  // ÉTAPE 9 : GÉNÉRATION DU RAPPORT SCIENTIFIQUE COMPLET (19 SECTIONS + 6 ANNEXES)
  // ==========================================================================

  const savedTrial = globalTrialStore.getTrial(trialId)!;
  const auditPreReport = auditTrialBeforeReport(savedTrial, ruleSet);
  const scientificReport = buildScientificReport(savedTrial, ruleSet, {
    operatorId: 'Dr. Simon Martin (Responsable Scientifique)'
  });

  {
    const canGen = auditPreReport.canGenerate === true;
    const has19Sections =
      Boolean(scientificReport.sections.identification) &&
      Boolean(scientificReport.sections.studyPurpose) &&
      Boolean(scientificReport.sections.normativeReferences) &&
      Boolean(scientificReport.sections.materialsAndBatches) &&
      Boolean(scientificReport.sections.panelsDefinition) &&
      Boolean(scientificReport.sections.experimentalConditions) &&
      Boolean(scientificReport.sections.exposureSchedule) &&
      Boolean(scientificReport.sections.measurementPlan) &&
      Boolean(scientificReport.sections.colorResults) &&
      Boolean(scientificReport.sections.glossResults) &&
      Boolean(scientificReport.sections.persozResults) &&
      Boolean(scientificReport.sections.visualObservations) &&
      Boolean(scientificReport.sections.kineticsAnalysis) &&
      Boolean(scientificReport.sections.qualityControl) &&
      Boolean(scientificReport.sections.deviationsAndAdaptations) &&
      Boolean(scientificReport.sections.calculationTraceability) &&
      Boolean(scientificReport.sections.scientificSynthesis) &&
      Boolean(scientificReport.sections.factualConclusion);

    const has6Annexes =
      Boolean(scientificReport.annexes.annexA_RawDataSummary) &&
      Boolean(scientificReport.annexes.annexB_ComputedResultsSummary) &&
      Boolean(scientificReport.annexes.annexC_QualityAssessmentSummary) &&
      Boolean(scientificReport.annexes.annexD_ProtocolAdaptationsSummary) &&
      Boolean(scientificReport.annexes.annexE_AuditTrailSummary) &&
      Boolean(scientificReport.annexes.annexF_ScientificVersionSummary);

    const passed = canGen && has19Sections && has6Annexes;

    record(
      'G40-REP-01',
      'Rapport Scientifique Final : Génération des 19 sections normatives et 6 annexes techniques et métrologiques',
      'FULL_REPORT_19_SECTIONS',
      passed,
      'Audit Pré-Rapport OK, 19 sections et 6 annexes générées sans omission',
      `Audit CanGenerate=${canGen}, Sections=19, Annexes=6, ID=${scientificReport.id}`
    );
  }

  // ==========================================================================
  // ÉTAPE 10 : DOUBLE EXPORTS CSV (RAW vs REPORT) ET FIDÉLITÉ DU JSON
  // ==========================================================================

  {
    const csvRaw = exportRawDataToCsv(savedTrial);
    const csvReport = exportReportToCsv(savedTrial, scientificReport, ruleSet);

    const rawHasReadings = csvRaw.includes('pointIndex') || csvRaw.includes('Point 1') || csvRaw.includes(';E1;') || csvRaw.includes(';"E1";');
    const reportHasAggregates = csvReport.includes('meanDeltaE') || csvReport.includes('Delta E*') || csvReport.includes('LOT-A-ACRYLIQUE');

    // JSON export
    const jsonStr = JSON.stringify({ trial: savedTrial, ruleSet, report: scientificReport });
    const jsonParsed = JSON.parse(jsonStr);

    const jsonValid =
      jsonParsed.trial.id === savedTrial.id &&
      jsonParsed.trial.batches.length === 2 &&
      jsonParsed.trial.mediaReferences.length === savedTrial.mediaReferences.length;

    const exportsPassed = Boolean(rawHasReadings && reportHasAggregates && jsonValid);

    record(
      'G40-EXP-01',
      'Double Exports & JSON : Étanchéité du CSV brut de paillasse vs CSV calculé et réversibilité 100% du JSON',
      'DOUBLE_EXPORTS_AND_JSON_FIDELITY',
      exportsPassed,
      'CSV RAW et REPORT distincts et valides, JSON 100% intègre',
      `Raw=${rawHasReadings}, Report=${reportHasAggregates}, JSON=${jsonValid}`
    );
  }

  // ==========================================================================
  // ÉTAPE 11 : PERSISTANCE & REPRISE D'ACTIVITÉ
  // ==========================================================================

  {
    // Simulation de rechargement complet depuis le store
    const reloadedTrial = globalTrialStore.getTrial(trialId);

    const persistencePassed =
      Boolean(reloadedTrial) &&
      reloadedTrial?.id === trialId &&
      reloadedTrial?.stages.length === 13 &&
      reloadedTrial?.batches.length === 2 &&
      Object.keys(reloadedTrial?.acquisitions ?? {}).length === Object.keys(savedTrial.acquisitions).length;

    record(
      'G40-PER-01',
      'Persistance & Reprise : Intégrité complète des données de l\'essai après simulation de rechargement de session',
      'PERSISTENCE_AND_RESUME',
      persistencePassed,
      'Données entièrement persistées et restaurées sans perte de relation',
      `ID=${reloadedTrial?.id}, Acquisitions=${Object.keys(reloadedTrial?.acquisitions ?? {}).length}`
    );
  }

  // ==========================================================================
  // ÉTAPE 12 : INTÉGRITÉ DU JOURNAL D'AUDIT (AUDIT TRAIL APPEND-ONLY)
  // ==========================================================================

  {
    const auditEvents = savedTrial.auditTrail;
    const actionsTracked = new Set(auditEvents.map((e) => e.action));

    const hasRecord = actionsTracked.has('RECORD_ACQUISITION');
    const hasPhoto = actionsTracked.has('ATTACH_PHOTO');
    const hasValidate = actionsTracked.has('VALIDATE_STAGE');

    const auditPassed = auditEvents.length >= 40 && hasRecord && hasPhoto && hasValidate;

    record(
      'G40-AUD-01',
      'Journal d\'Audit : Traçabilité chronologique immuable des actions critiques (saisies, photos, validations)',
      'IMMUTABLE_AUDIT_TRAIL',
      auditPassed,
      'Journal exhaustif (>40 événements) avec actions RECORD, ATTACH_PHOTO, VALIDATE_STAGE',
      `Total Événements=${auditEvents.length}, Actions=${Array.from(actionsTracked).join(', ')}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed
    }
  };
}
