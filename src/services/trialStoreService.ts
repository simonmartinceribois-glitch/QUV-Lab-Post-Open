/**
 * QUV-Lab — Service TrialStore (persistance, CRUD metier, verrouillage, photos, rapports)
 * Issu du decoupage de trialStore.ts (refactor/split-trialstore). Code deplace a l'identique.
 */
import {
  Trial,
  TrialMetadata,
  CommonCharacteristics,
  BatchDefinition,
  PanelDefinition,
  ExposureStage,
  ExposureStageType,
  PanelAcquisitionRecord,
  AuditEvent,
  MediaReference,
  PhotoReference,
  TrialProtocolConfig,
  WoodGrainOrientation,
  ExposureFace,
  SpecimenRole,
  SpecimenRoleCode
} from '../types/trial';
import {
  UUID,
  MeasurementFamilyId,
  ScientificRuleSet,
  ColorRawData,
  GlossRawData,
  PersozRawData,
  AdhesionRawData,
  VisualObservationsRawData,
  ScientificRuleOrigin,
  ScientificReport,
  ScientificReportStatus,
  ScientificReportReviewComment
} from '../types/scientific';
import { getDefaultScientificRuleSet, createCountConfiguration, createSeriesConfiguration } from '../scientific/ruleSet';
import { recalculateAcquisition } from '../scientific/recalculator';
import { createConfigChangeEvent } from '../scientific/auditEngine';
import { buildScientificReport } from './reportGenerator';
import { isFamilyScheduledForStage } from '../scientific/panelUtils';
import { generateUUID } from './trialIds';
import { validateAcquisitionTarget, validatePhotoTarget } from './trialIntegrity';
import { generateStandardExposureStages } from './trialStages';
import { createDemoTrial, createValidationTrial } from './trialSeed';

const STORAGE_KEY = 'quv_lab_trials_v2_2';
/**
 * Service TrialStore complet
 */
export class TrialStoreService {
  private trials: Map<UUID, Trial> = new Map();
  private ruleSet: ScientificRuleSet;
  private isEphemeral: boolean;

  constructor(options?: { ephemeral?: boolean }) {
    this.ruleSet = getDefaultScientificRuleSet();
    this.isEphemeral = !!options?.ephemeral;
    if (!this.isEphemeral) {
      this.loadFromStorage();
    }
  }

  /**
   * Crée un store en mémoire isolé (éphémère) n'impactant ni le store global ni localStorage (Gate 55 - D-6).
   */
  public static createIsolatedStore(): TrialStoreService {
    return new TrialStoreService({ ephemeral: true });
  }

  /**
   * Migration non-destructive de la terminologie des étapes d'exposition (v6.1 -> v6.2)
   * Préserve intégralement les UUIDs, acquisitions, RAW, résultats calculés, horodatages, lots et auditTrail.
   */
  public migrateTrialTerminology(trial: Trial): Trial {
    if (!trial || !Array.isArray(trial.stages)) return trial;

    // Ensure orderNumber and reportNumber are present
    if (!trial.metadata.orderNumber) {
      trial.metadata.orderNumber = 'CO-VAN2026-001';
    }
    if (!trial.metadata.reportNumber) {
      trial.metadata.reportNumber = 'RA-VAN2026-001';
    }

    // Ensure project-level dimensions
    if (!trial.commonCharacteristics) {
      trial.commonCharacteristics = {
        dimensions: { lengthMm: 150, widthMm: 75, thicknessMm: 15, unit: 'mm' },
        substrateNature: 'Bois massif',
        materialType: 'Pin sylvestre (NF EN 927-6)'
      };
    } else if (!trial.commonCharacteristics.dimensions) {
      trial.commonCharacteristics.dimensions = { lengthMm: 150, widthMm: 75, thicknessMm: 15, unit: 'mm' };
    }

    // Normalize specimen roles & orientations
    if (Array.isArray(trial.batches)) {
      trial.batches.forEach((b) => {
        if (Array.isArray(b.panels)) {
          b.panels.forEach((p, pIdx) => {
            if (pIdx === 0 || p.label === 'P01' || p.label === 'T') {
              p.label = 'T';
              p.role = 'WITNESS';
              p.roleCode = 'T';
              if (!p.grainOrientation) p.grainOrientation = 'Quartier';
            } else {
              const expNum = pIdx;
              p.label = `${expNum}`;
              p.role = expNum === 1 ? 'EXPOSED_1' : expNum === 2 ? 'EXPOSED_2' : 'EXPOSED_3';
              p.roleCode = expNum === 1 ? 'E1' : expNum === 2 ? 'E2' : 'E3';
              if (!p.grainOrientation) p.grainOrientation = expNum === 3 ? 'Faux quartier' : 'Quartier';
              if (!p.exposureFace) p.exposureFace = 'Face externe';
            }
          });
        }
      });
    }

    trial.stages.forEach((stage, idx) => {
      const isFinal = stage.cycleIndex === 12 || (stage.cycleIndex > 0 && idx === trial.stages.length - 1);
      const isInitial = stage.cycleIndex === 0;

      if (isInitial) {
        stage.stageType = 'INITIAL_PRE_EXPOSURE';
        if (!stage.name || stage.name.includes('MESURES INITIALES') || stage.name.trim() === 'T0') {
          stage.name = 'T0 — MESURES INITIALES AVANT EXPOSITION';
        }
      } else if (isFinal) {
        stage.stageType = 'FINAL_POST_EXPOSURE';
        if (!stage.name || stage.name.includes('MESURES FINALES') || stage.name.includes('2016 h')) {
          stage.name = `${stage.scheduledExposureHours || 2016} h — MESURES FINALES APRÈS EXPOSITION`;
        }
      } else {
        // Cycles intermédiaires (168 h à 1848 h)
        stage.stageType = 'INTERMEDIATE_DURING_EXPOSURE';
        if (stage.name && stage.name.includes('MESURES APRÈS EXPOSITION')) {
          stage.name = stage.name.replace('MESURES APRÈS EXPOSITION', "MESURES EN COURS D'EXPOSITION");
        } else if (!stage.name || stage.name.trim() === `${stage.scheduledExposureHours} h`) {
          stage.name = `${stage.scheduledExposureHours} h — MESURES EN COURS D'EXPOSITION`;
        }
      }
    });

    return trial;
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Trial[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((t) => {
            // Éliminer préventivement toute pollution issue d'anciens mocks de test (Gate 55 - D-6)
            if (t && t.id && !t.id.startsWith('MOCK_TEST_')) {
              const migrated = this.migrateTrialTerminology(t);
              this.trials.set(migrated.id, migrated);
            }
          });
          return;
        }
      }
    } catch {
      // ignore
    }

    // Initialisation avec démo et essai de validation si vide
    const demo = createDemoTrial(this.ruleSet);
    const valTrial = createValidationTrial(this.ruleSet);
    this.trials.set(demo.id, demo);
    this.trials.set(valTrial.id, valTrial);
    this.saveToStorage();
  }

  private saveToStorage(): void {
    if (this.isEphemeral) return;
    try {
      const list = Array.from(this.trials.values()).filter((t) => !t.id.startsWith('MOCK_TEST_'));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  }

  public getTrials(): Trial[] {
    return Array.from(this.trials.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  public getTrial(id: UUID): Trial | undefined {
    const trial = this.trials.get(id);
    if (trial) {
      if (!trial.auditTrail) trial.auditTrail = [];
      if (!trial.mediaReferences) trial.mediaReferences = [];
      if (!trial.acquisitions) trial.acquisitions = {};
      if (!trial.reports) trial.reports = [];
    }
    return trial;
  }

  public getAllTrials(): Trial[] {
    return this.getTrials();
  }

  public saveTrial(trial: Trial): void {
    trial.updatedAt = new Date().toISOString();
    if (!trial.auditTrail) trial.auditTrail = [];
    if (!trial.mediaReferences) trial.mediaReferences = [];
    if (!trial.acquisitions) trial.acquisitions = {};
    if (!trial.reports) trial.reports = [];
    this.trials.set(trial.id, trial);
    this.saveToStorage();
  }

  public resetToDemo(): Trial {
    this.trials.clear();
    const demo = createDemoTrial(this.ruleSet);
    this.trials.set(demo.id, demo);
    this.saveToStorage();
    return demo;
  }

  /**
   * Crée un nouvel essai depuis l'assistant (PROMPT 6 v6.1)
   */
  public createTrial(params: {
    metadata: TrialMetadata;
    commonCharacteristics?: CommonCharacteristics;
    batches: {
      reference: string;
      coatingSystem?: string;
      woodSpecies?: string;
      productReference?: string;
      manufacturerOrSupplier?: string;
      coatCount?: number;
      substratePreparation?: string;
      applicationMethod?: string;
      applicationConditions?: string;
      applicationDate?: string;
      dryingOrConditioningTime?: string;
      batchNotes?: string;
      panelCount: number;
    }[];
    activeFamilies: MeasurementFamilyId[];
    familyConfigs?: Partial<TrialProtocolConfig['familyConfigs']>;
    selectedMeasurementCycles?: number[];
  }): Trial {
    const createdBy = params.metadata?.createdBy?.trim();
    if (!createdBy) {
      throw new Error('Le créateur de l’essai est obligatoire.');
    }

    const trialId = generateUUID();
    const now = new Date().toISOString();

    const createdBatches: BatchDefinition[] = params.batches.map((b, bIdx) => {
      const batchId = generateUUID();
      const panels: PanelDefinition[] = [
        {
          id: generateUUID(),
          batchId,
          index: 1,
          label: 'T',
          role: 'WITNESS',
          roleCode: 'T',
          grainOrientation: 'Quartier',
          status: 'ACTIVE'
        },
        {
          id: generateUUID(),
          batchId,
          index: 2,
          label: '1',
          role: 'EXPOSED_1',
          roleCode: 'E1',
          grainOrientation: 'Quartier',
          exposureFace: 'Face externe',
          status: 'ACTIVE'
        },
        {
          id: generateUUID(),
          batchId,
          index: 3,
          label: '2',
          role: 'EXPOSED_2',
          roleCode: 'E2',
          grainOrientation: 'Quartier',
          exposureFace: 'Face externe',
          status: 'ACTIVE'
        },
        {
          id: generateUUID(),
          batchId,
          index: 4,
          label: '3',
          role: 'EXPOSED_3',
          roleCode: 'E3',
          grainOrientation: 'Faux quartier',
          exposureFace: 'Face externe',
          status: 'ACTIVE'
        }
      ];
      return {
        id: batchId,
        trialId,
        reference: b.reference.trim(),
        orderIndex: bIdx + 1,
        coatingSystem: b.coatingSystem,
        woodSpecies: b.woodSpecies,
        productReference: b.productReference,
        manufacturerOrSupplier: b.manufacturerOrSupplier,
        coatCount: b.coatCount,
        substratePreparation: b.substratePreparation,
        applicationMethod: b.applicationMethod,
        applicationConditions: b.applicationConditions,
        applicationDate: b.applicationDate,
        dryingOrConditioningTime: b.dryingOrConditioningTime,
        batchNotes: b.batchNotes,
        panels
      };
    });

    const protocolConfig: TrialProtocolConfig = {
      standardReference: 'NF EN 927-6',
      activeFamilies: params.activeFamilies,
      familyConfigs: {
        COLOR: params.familyConfigs?.COLOR || {
          familyId: 'COLOR',
          enabled: params.activeFamilies.includes('COLOR'),
          countConfig: createCountConfiguration('COLOR', 4, this.ruleSet)
        },
        GLOSS: params.familyConfigs?.GLOSS || {
          familyId: 'GLOSS',
          enabled: params.activeFamilies.includes('GLOSS'),
          seriesConfig: createSeriesConfiguration('GLOSS', 2, 2, this.ruleSet)
        },
        PERSOZ: params.familyConfigs?.PERSOZ || {
          familyId: 'PERSOZ',
          enabled: params.activeFamilies.includes('PERSOZ'),
          countConfig: createCountConfiguration('PERSOZ', 3, this.ruleSet)
        },
        ADHESION: params.familyConfigs?.ADHESION || {
          familyId: 'ADHESION',
          enabled: params.activeFamilies.includes('ADHESION')
        },
        OBSERVATIONS: params.familyConfigs?.OBSERVATIONS || {
          familyId: 'OBSERVATIONS',
          enabled: params.activeFamilies.includes('OBSERVATIONS')
        }
      }
    };

    const stages = generateStandardExposureStages(trialId, params.selectedMeasurementCycles);

    const auditTrail: AuditEvent[] = [
      {
        id: generateUUID(),
        trialId,
        timestamp: now,
        operatorId: createdBy,
        action: 'CREATE_TRIAL',
        entityType: 'TRIAL',
        entityId: trialId,
        details: {
          reference: params.metadata.reference,
          title: params.metadata.title,
          batchCount: createdBatches.length,
          totalPanels: createdBatches.reduce((sum, b) => sum + b.panels.length, 0),
          measurementPlanCycles: params.selectedMeasurementCycles || [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
        }
      }
    ];

    const trial: Trial = {
      id: trialId,
      schemaVersion: '1.2.0',
      createdAt: now,
      updatedAt: now,
      metadata: {
        ...params.metadata,
        createdBy
      },
      commonCharacteristics: params.commonCharacteristics,
      status: 'IN_PROGRESS',
      configurationStatus: 'EDITABLE',
      config: protocolConfig,
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: Array.from({ length: 11 }, (_, i) => ({ cycleIndex: i + 1, mandatory: true })),
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages,
      batches: createdBatches,
      acquisitions: {},
      auditTrail,
      mediaReferences: []
    };

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Exclut un panneau de manière motivée (PROMPT 6 - Section 9)
   */
  public excludePanel(trialId: UUID, panelId: UUID, reason: string, operatorId: string): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    if (!reason || reason.trim().length === 0) {
      throw new Error('Le motif d\'exclusion du panneau est obligatoire.');
    }

    let foundPanel: PanelDefinition | null = null;
    let foundBatch: BatchDefinition | null = null;

    for (const b of trial.batches) {
      const p = b.panels.find((item) => item.id === panelId);
      if (p) {
        foundPanel = p;
        foundBatch = b;
        break;
      }
    }

    if (!foundPanel) throw new Error(`Panneau ${panelId} introuvable`);

    const now = new Date().toISOString();
    foundPanel.status = 'EXCLUDED';
    foundPanel.exclusionReason = reason.trim();
    foundPanel.excludedAt = now;
    foundPanel.excludedBy = operatorId || 'OPERATOR';

    trial.auditTrail.push({
      id: generateUUID(),
      trialId,
      timestamp: now,
      operatorId: operatorId || 'OPERATOR',
      action: 'EXCLUDE_PANEL',
      entityType: 'PANEL',
      entityId: panelId,
      details: {
        batchReference: foundBatch?.reference,
        panelLabel: foundPanel.label,
        reason: reason.trim()
      }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Adapte le protocole de mesure avec justification (PROMPT 6 - Section 11 & 12)
   */
  public adaptProtocolConfig(
    trialId: UUID,
    familyId: MeasurementFamilyId,
    newCountOrSeries: number | { seriesCount: number; readingsPerSeries: number },
    justification: string,
    operatorId: string
  ): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    if (trial.configurationStatus === 'LOCKED') {
      throw new Error('La configuration de l\'essai est VERROUILLÉE suite aux premières acquisitions scientifiques.');
    }

    const famConfig = trial.config.familyConfigs[familyId];
    const prevConfig = famConfig?.countConfig || famConfig?.seriesConfig;

    if (typeof newCountOrSeries === 'number') {
      const isStandard = newCountOrSeries === (this.ruleSet.measurementConfigurations[familyId]?.standardRecommendedCount ?? 4);
      if (!isStandard && (!justification || justification.trim().length === 0)) {
        throw new Error('Une justification obligatoire est requise pour toute adaptation du nombre de mesures.');
      }
      const updatedConfig = createCountConfiguration(familyId, newCountOrSeries, this.ruleSet, {
        justification,
        operatorId
      });
      trial.config.familyConfigs[familyId] = {
        ...famConfig,
        familyId,
        enabled: true,
        countConfig: updatedConfig
      };
      trial.auditTrail.push(
        createConfigChangeEvent(trialId, operatorId, familyId, prevConfig, updatedConfig, justification)
      );
    } else {
      const std = this.ruleSet.seriesConfigurations?.[familyId]?.standardConfiguration;
      const isStandard =
        std &&
        newCountOrSeries.seriesCount === std.seriesCount &&
        newCountOrSeries.readingsPerSeries === std.readingsPerSeries;
      if (!isStandard && (!justification || justification.trim().length === 0)) {
        throw new Error('Une justification obligatoire est requise pour toute adaptation de structure de séries.');
      }
      const updatedConfig = createSeriesConfiguration(
        familyId,
        newCountOrSeries.seriesCount,
        newCountOrSeries.readingsPerSeries,
        this.ruleSet,
        { justification, operatorId }
      );
      trial.config.familyConfigs[familyId] = {
        ...famConfig,
        familyId,
        enabled: true,
        seriesConfig: updatedConfig
      };
      trial.auditTrail.push(
        createConfigChangeEvent(trialId, operatorId, familyId, prevConfig, updatedConfig, justification)
      );
    }

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Enregistre ou met à jour une acquisition scientifique pour un panneau
   * Déclenche automatiquement le verrouillage de la configuration s'il s'agit de la première acquisition.
   */
  public recordAcquisition(params: {
    trialId: UUID;
    stageId: UUID;
    batchId: UUID;
    panelId: UUID;
    familyId: MeasurementFamilyId;
    raw: unknown;
    operatorId: string;
    source?: 'MANUAL_KEYPAD' | 'INSTRUMENT_IMPORT' | 'FILE_IMPORT';
    mediaIds?: UUID[];
  }): { trial: Trial; record: PanelAcquisitionRecord } {
    const trial = this.getTrial(params.trialId);
    if (!trial) throw new Error(`Essai ${params.trialId} introuvable`);

    // Garde-fou d'intégrité relationnelle (Gate 3.1 - Risque 1) avant tout effet de bord
    validateAcquisitionTarget(trial, params.stageId, params.batchId, params.panelId);

    // Règle métier canonique : ADHESION = T0 + C12 uniquement. Interdit à C1..C11.
    const targetStage = trial.stages?.find((s) => s.id === params.stageId);
    if (!targetStage) {
      throw new Error(`Jalon ${params.stageId} introuvable dans l'essai.`);
    }

    // Protection défensive D-1 (Gate 54) : Bloquer toute acquisition sur un jalon exclu du plan (INACTIVE)
    if (targetStage.status === 'INACTIVE') {
      throw new Error("Ce jalon a été exclu du plan de mesurage ; aucune acquisition n'est autorisée.");
    }

    if (params.familyId === 'ADHESION' && !isFamilyScheduledForStage('ADHESION', targetStage)) {
      throw new Error(
        `La mesure d'adhérence au quadrillage (NF EN ISO 2409) est strictement interdite aux étapes intermédiaires (C1 à C11). Elle est planifiée uniquement à T0 et C12.`
      );
    }

    const now = new Date().toISOString();

    // Verrouillage automatique si non encore verrouillé
    if (trial.configurationStatus !== 'LOCKED') {
      trial.configurationStatus = 'LOCKED';
      trial.auditTrail.push({
        id: generateUUID(),
        trialId: trial.id,
        timestamp: now,
        operatorId: 'SYSTEM',
        action: 'LOCK_TRIAL_CONFIGURATION',
        entityType: 'CONFIG',
        entityId: trial.id,
        details: { reason: 'Première acquisition scientifique enregistrée.' }
      });
    }

    const key = `${params.stageId}__${params.panelId}__${params.familyId}`;
    const prevRecord = trial.acquisitions[key];

    const newRecord: PanelAcquisitionRecord = {
      id: prevRecord ? prevRecord.id : generateUUID(),
      trialId: trial.id,
      stageId: params.stageId,
      batchId: params.batchId,
      panelId: params.panelId,
      familyId: params.familyId,
      raw: params.raw,
      computed: null,
      status: 'COMPLETE',
      alerts: [],
      trace: {
        createdBy: prevRecord ? prevRecord.trace.createdBy : params.operatorId || 'OPERATOR',
        createdAt: prevRecord ? prevRecord.trace.createdAt : now,
        lastModifiedBy: params.operatorId || 'OPERATOR',
        lastModifiedAt: now,
        source: params.source || 'MANUAL_KEYPAD'
      },
      mediaIds: params.mediaIds || prevRecord?.mediaIds || []
    };

    // Calcul immédiat via PROMPT 5 sans toucher à raw
    const { updatedRecord, rawUnchanged } = recalculateAcquisition(newRecord, trial, this.ruleSet);
    if (!rawUnchanged) {
      // Garde-fou scientifique : le moteur de calcul a modifié le RAW, ce qui ne doit
      // structurellement jamais arriver. On le rend visible plutôt que de le laisser silencieux.
      updatedRecord.alerts.push({
        id: generateUUID(),
        severity: 'BLOCKING',
        code: 'RAW_INTEGRITY_VIOLATION',
        message: 'Anomalie critique : la donnée brute (RAW) a été modifiée lors du recalcul. Intégrité scientifique compromise.',
        familyId: params.familyId,
        stageId: params.stageId,
        panelId: params.panelId
      });
    }
    trial.acquisitions[key] = updatedRecord;

    // Audit de l'acquisition
    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: now,
      operatorId: params.operatorId || 'OPERATOR',
      action: prevRecord ? 'UPDATE_ACQUISITION' : 'RECORD_ACQUISITION',
      entityType: 'ACQUISITION',
      entityId: updatedRecord.id,
      details: {
        stageId: params.stageId,
        panelId: params.panelId,
        familyId: params.familyId,
        source: newRecord.trace.source,
        quality: (updatedRecord.computed as any)?.qualityAssessment?.status || 'N/A',
        rawUnchanged
      }
    });

    this.saveTrial(trial);
    return { trial, record: updatedRecord };
  }

  /**
   * Valide une étape d'exposition
   */
  public validateStage(trialId: UUID, stageId: UUID, operatorId: string, notes?: string): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    const stage = trial.stages.find((s) => s.id === stageId);
    if (!stage) throw new Error(`Étape ${stageId} introuvable`);

    const now = new Date().toISOString();
    stage.status = 'VALIDATED';
    stage.validatedBy = operatorId || 'OPERATOR';
    stage.validatedAt = now;
    if (notes) stage.notes = notes;

    // Passer automatiquement l'étape suivante en IN_PROGRESS si elle était NOT_STARTED
    const currentIdx = trial.stages.findIndex((s) => s.id === stageId);
    if (currentIdx >= 0 && currentIdx + 1 < trial.stages.length) {
      const nextStage = trial.stages[currentIdx + 1];
      if (nextStage.status === 'NOT_STARTED') {
        nextStage.status = 'IN_PROGRESS';
      }
    }

    trial.auditTrail.push({
      id: generateUUID(),
      trialId,
      timestamp: now,
      operatorId: operatorId || 'OPERATOR',
      action: 'VALIDATE_STAGE',
      entityType: 'STAGE',
      entityId: stageId,
      details: { stageName: stage.name, cycleIndex: stage.cycleIndex }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Active ou désactive une étape intermédiaire d'exposition (C1 à C11)
   * T0, C12 et AFTER_EXPOSURE sont obligatoires et protégées contre toute désactivation.
   * La désactivation est NON-DESTRUCTIVE : conserve les relevés, photos, métadonnées et audit trail.
   */
  public toggleStageStatus(
    trialId: UUID,
    stageId: UUID,
    arg3?: boolean | string,
    arg4?: string,
    arg5?: string
  ): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    const stage = trial.stages.find((s) => s.id === stageId);
    if (!stage) throw new Error(`Étape ${stageId} introuvable`);

    // Protection absolue des étapes obligatoires T0, C12 (2016 h) et étapes finales
    if (
      stage.cycleIndex === 0 ||
      stage.cycleIndex === 12 ||
      stage.stageType === 'INITIAL_PRE_EXPOSURE' ||
      stage.stageType === 'FINAL_POST_EXPOSURE'
    ) {
      throw new Error(
        "L'étape initiale T0, l'étape finale C12 (2016 h) et l'étape après exposition sont obligatoires selon NF EN 927-6 et ne peuvent pas être désactivées."
      );
    }

    // 3. Protection absolue du plan verrouillé (Gate 54 - D-2) :
    // Dès la première acquisition ou lorsque la configuration est verrouillée, aucun changement de statut n'est permis.
    if (trial.configurationStatus === 'LOCKED') {
      throw new Error(
        "Le plan de mesurage est verrouillé. Aucune modification du statut des jalons n'est autorisée après le démarrage ou le verrouillage de la campagne."
      );
    }

    let active: boolean;
    let operatorId: string;
    let reason: string | undefined;

    if (typeof arg3 === 'boolean') {
      active = arg3;
      operatorId = arg4 || 'OPERATOR';
      reason = arg5;
    } else {
      active = stage.status === 'INACTIVE';
      operatorId = (arg3 as string) || 'OPERATOR';
      reason = arg4;
    }

    const now = new Date().toISOString();
    if (!trial.auditTrail) trial.auditTrail = [];

    if (!active) {
      // Protection stricte : Un jalon contenant déjà des acquisitions scientifiques ne peut pas être désactivé rétroactivement
      const hasAcquisitions = Object.values(trial.acquisitions || {}).some(
        (acq) => acq && acq.stageId === stageId && (acq.raw !== undefined || acq.status === 'COMPLETE' || acq.status === 'VALID' as any)
      );
      if (hasAcquisitions) {
        throw new Error(
          `Impossible de désactiver le jalon "${stage.name}" car des acquisitions scientifiques y sont déjà consignées.`
        );
      }

      stage.status = 'INACTIVE';
      trial.auditTrail.push({
        id: generateUUID(),
        trialId,
        timestamp: now,
        operatorId: operatorId || 'OPERATOR',
        action: 'DEACTIVATE_STAGE',
        entityType: 'STAGE',
        entityId: stageId,
        details: {
          stageName: stage.name,
          cycleIndex: stage.cycleIndex,
          scheduledExposureHours: stage.scheduledExposureHours,
          reason: reason || 'Désactivation intermédiaire du jalon'
        }
      });
    } else {
      stage.status = 'NOT_STARTED';
      trial.auditTrail.push({
        id: generateUUID(),
        trialId,
        timestamp: now,
        operatorId: operatorId || 'OPERATOR',
        action: 'REACTIVATE_STAGE',
        entityType: 'STAGE',
        entityId: stageId,
        details: {
          stageName: stage.name,
          cycleIndex: stage.cycleIndex,
          scheduledExposureHours: stage.scheduledExposureHours
        }
      });
    }

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Met à jour le plan de mesurage d'un essai avant la première acquisition (Gate 52).
   * Après la première acquisition scientifique ou si la configuration est verrouillée :
   * PLAN VERROUILLÉ, toute modification est interdite pour garantir l'intégrité de l'historique.
   */
  public updateMeasurementPlan(
    trialId: UUID,
    activeCycleIndices: number[],
    operatorId: string,
    reason?: string
  ): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    if (trial.configurationStatus === 'LOCKED') {
      throw new Error(
        "Le plan de mesurage est verrouillé. Aucune modification n'est autorisée après le démarrage ou le verrouillage de la campagne."
      );
    }

    const hasAcquisitions = Object.keys(trial.acquisitions).length > 0;
    if (hasAcquisitions) {
      throw new Error(
        "Impossible de modifier le plan de mesurage : des acquisitions scientifiques ont déjà été enregistrées."
      );
    }

    // T0 (0) et C12 (12) sont obligatoires
    if (!activeCycleIndices.includes(0)) {
      throw new Error('Le jalon initial T0 (0 h) est obligatoire et ne peut pas être exclu du plan de mesurage.');
    }
    if (!activeCycleIndices.includes(12)) {
      throw new Error('Le jalon final C12 (2016 h) est obligatoire et ne peut pas être exclu du plan de mesurage.');
    }

    const normalizedPlan = Array.from(new Set(activeCycleIndices));

    trial.stages.forEach((stage) => {
      if (stage.cycleIndex === 0 || stage.cycleIndex === 12) {
        if (stage.status === 'INACTIVE') stage.status = 'NOT_STARTED';
        return;
      }

      const shouldBeActive = normalizedPlan.includes(stage.cycleIndex);
      if (shouldBeActive && stage.status === 'INACTIVE') {
        stage.status = 'NOT_STARTED';
      } else if (!shouldBeActive && stage.status !== 'INACTIVE') {
        stage.status = 'INACTIVE';
      }
    });

    const now = new Date().toISOString();
    if (!trial.auditTrail) trial.auditTrail = [];

    trial.auditTrail.push({
      id: generateUUID(),
      trialId,
      timestamp: now,
      operatorId: operatorId || 'OPERATOR',
      action: 'UPDATE_MEASUREMENT_PLAN' as any,
      entityType: 'TRIAL',
      entityId: trialId,
      details: {
        activeCycles: normalizedPlan.sort((a, b) => a - b),
        reason: reason || 'Mise à jour du plan de mesurage pré-acquisition'
      }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Associe une photographie en garantissant l'unicité stricte du cliché actif par (panelId + stageId).
   * Si une photo existe déjà, elle est automatiquement archivée de façon non-destructive.
   */
  public attachPhoto(params: {
    trialId: UUID;
    panelId: UUID;
    stageId: UUID;
    filename: string;
    caption?: string;
    operatorId: string;
    storageKey?: string;
    replaceExisting?: boolean;
  }): Trial {
    const trial = this.getTrial(params.trialId);
    if (!trial) throw new Error(`Essai ${params.trialId} introuvable`);

    // Garde-fou d'intégrité relationnelle (Gate 3.1 - Risque 2)
    validatePhotoTarget(trial, params.stageId, params.panelId);

    const now = new Date().toISOString();
    let replacedMediaId: string | undefined;

    // Vérifier si une photo active existe déjà pour ce couple (panelId, stageId)
    const existingActivePhoto = trial.mediaReferences.find(
      (m) =>
        m.type === 'PHOTO' &&
        m.status !== 'ARCHIVED' &&
        m.panelId === params.panelId &&
        m.stageId === params.stageId
    );

    if (existingActivePhoto) {
      // Archivage automatique et non destructif de l'ancienne photo dans l'historique
      existingActivePhoto.status = 'ARCHIVED';
      existingActivePhoto.replacedAt = now;
      existingActivePhoto.replacedBy = params.operatorId || 'OPERATOR';
      replacedMediaId = existingActivePhoto.id;

      trial.auditTrail.push({
        id: generateUUID(),
        trialId: params.trialId,
        timestamp: now,
        operatorId: params.operatorId || 'OPERATOR',
        action: 'REPLACE_PHOTO',
        entityType: 'PANEL',
        entityId: params.panelId,
        details: {
          oldMediaId: existingActivePhoto.id,
          stageId: params.stageId,
          reason: 'Remplacement de photographie active par un nouveau cliché'
        }
      });
    }

    const media: PhotoReference = {
      id: generateUUID(),
      trialId: params.trialId,
      panelId: params.panelId,
      stageId: params.stageId,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: params.storageKey || `photos/${params.filename}`,
      filename: params.filename,
      mimeType: 'image/jpeg',
      sizeBytes: 1024 * 250,
      capturedAt: now,
      capturedBy: params.operatorId || 'OPERATOR',
      caption: params.caption,
      replacementMediaId: replacedMediaId
    };

    if (replacedMediaId) {
      const oldPhoto = trial.mediaReferences.find((m) => m.id === replacedMediaId);
      if (oldPhoto) {
        oldPhoto.replacementMediaId = media.id;
      }
    }

    trial.mediaReferences.push(media);

    // Trouver l'acquisition observation s'il y a lieu
    const obsKey = `${params.stageId}__${params.panelId}__OBSERVATIONS`;
    const obsRec = trial.acquisitions[obsKey];
    if (obsRec) {
      if (replacedMediaId) {
        obsRec.mediaIds = obsRec.mediaIds.filter((id) => id !== replacedMediaId);
      }
      if (!obsRec.mediaIds.includes(media.id)) {
        obsRec.mediaIds = [...obsRec.mediaIds, media.id];
      }
    }

    // Assurer également le remplacement cohérent sans doublon pour toute acquisition référençant l'ancienne photo
    if (replacedMediaId) {
      Object.values(trial.acquisitions).forEach((acq) => {
        if (acq.stageId === params.stageId && acq.panelId === params.panelId && Array.isArray(acq.mediaIds)) {
          if (acq.mediaIds.includes(replacedMediaId)) {
            acq.mediaIds = acq.mediaIds.filter((id) => id !== replacedMediaId);
            if (!acq.mediaIds.includes(media.id)) {
              acq.mediaIds.push(media.id);
            }
          }
        }
      });
    }

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: params.trialId,
      timestamp: now,
      operatorId: params.operatorId || 'OPERATOR',
      action: 'ATTACH_PHOTO',
      entityType: 'PANEL',
      entityId: params.panelId,
      details: {
        mediaId: media.id,
        stageId: params.stageId,
        filename: params.filename,
        replacedMediaId
      }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Supprime une référence de photographie
   * 
   * NOTE D'ARCHITECTURE SUR LA TRAÇABILITÉ :
   * L'opérateur passé en argument (operatorId) trace l'auteur de l'action dans l'audit trail.
   * L'application ne disposant pas encore d'un système de session utilisateur / utilisateur connecté,
   * trial.metadata.createdBy ou un identifiant fourni est actuellement utilisé comme fallback.
   * 
   * INTÉGRITÉ SCIENTIFIQUE & MÉDIAS (MESURE ≠ PHOTO) :
   * La suppression d'une photographie ne supprime JAMAIS l'acquisition correspondante.
   * Elle préserve strictement les données scientifiques de l'acquisition :
   * - acq.status reste inchangé (ex: COMPLETE)
   * - acq.raw reste inchangé
   * - acq.computed reste inchangé
   * Seule la référence dans acq.mediaIds est nettoyée pour garantir l'intégrité référentielle.
   */
  public deletePhoto(trialId: UUID, mediaId: UUID, operatorId: string): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    const mediaIdx = trial.mediaReferences.findIndex(m => m.id === mediaId);
    if (mediaIdx === -1) return trial;

    const removed = trial.mediaReferences.splice(mediaIdx, 1)[0];

    // Nettoyer les références dans les acquisitions
    Object.values(trial.acquisitions).forEach(acq => {
      if (acq.mediaIds && acq.mediaIds.includes(mediaId)) {
        acq.mediaIds = acq.mediaIds.filter(id => id !== mediaId);
      }
    });

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: new Date().toISOString(),
      operatorId: operatorId || 'OPERATOR',
      action: 'DELETE_PHOTO',
      entityType: 'PANEL',
      entityId: removed.panelId || trial.id,
      details: { mediaId, filename: removed.filename, caption: removed.caption }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Enregistre un événement d'audit de consultation des résultats (PROMPT 7 - Section 35)
   */
  public logViewResults(trialId: UUID, operatorId: string): void {
    const trial = this.getTrial(trialId);
    if (!trial) return;

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: new Date().toISOString(),
      operatorId: operatorId || 'OPERATOR',
      action: 'VIEW_RESULTS',
      entityType: 'TRIAL',
      entityId: trial.id,
      details: { view: 'RESULTS_DASHBOARD' }
    });

    this.saveTrial(trial);
  }

  /**
   * Génère ou régénère un rapport scientifique versionné (PROMPT 7 - Section 21 & 35)
   */
  public generateScientificReportForTrial(
    trialId: UUID,
    operatorId: string,
    ruleSet: ScientificRuleSet
  ): ScientificReport {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    if (!trial.reports) {
      trial.reports = [];
    }

    const isRegeneration = trial.reports.length > 0;
    const nextVersionNumber = `v${trial.reports.length + 1}.0`;

    const report = buildScientificReport(trial, ruleSet, {
      operatorId,
      versionNumber: nextVersionNumber
    });

    trial.reports.unshift(report); // Plus récent en premier

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: new Date().toISOString(),
      operatorId: operatorId || 'OPERATOR',
      action: isRegeneration ? 'REGENERATE_REPORT' : 'GENERATE_REPORT',
      entityType: 'TRIAL',
      entityId: report.id,
      details: {
        reportVersion: report.metadata.reportVersion,
        isComplete: report.isComplete,
        calculationVersion: report.metadata.calculationVersion,
        scientificRuleSetId: report.metadata.scientificRuleSetId
      }
    });

    this.saveTrial(trial);
    return report;
  }

  /**
   * Met à jour le statut du rapport scientifique (Revue / Approbation)
   */
  public updateReportStatus(
    trialId: UUID,
    reportId: string,
    newStatus: ScientificReportStatus,
    operatorId: string
  ): Trial {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    const report = trial.reports?.find((r) => r.id === reportId);
    if (!report) throw new Error(`Rapport ${reportId} introuvable`);

    const now = new Date().toISOString();
    report.status = newStatus;

    let action = 'REVIEW_REPORT';
    if (newStatus === 'REVIEWED') {
      report.reviewedBy = operatorId || 'REVIEWER';
      report.reviewedAt = now;
      action = 'REVIEW_REPORT';
    } else if (newStatus === 'APPROVED') {
      report.approvedBy = operatorId || 'APPROVER';
      report.approvedAt = now;
      action = 'APPROVE_REPORT';
    }

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: now,
      operatorId: operatorId || 'OPERATOR',
      action,
      entityType: 'TRIAL',
      entityId: report.id,
      details: {
        reportVersion: report.metadata.reportVersion,
        newStatus
      }
    });

    this.saveTrial(trial);
    return trial;
  }

  /**
   * Ajoute un commentaire de revue scientifique (PROMPT 7 - Section 34 & 35)
   */
  public addReportReviewComment(
    trialId: UUID,
    reportId: string,
    comment: {
      author: string;
      text: string;
      category: ScientificReportReviewComment['category'];
    }
  ): ScientificReportReviewComment {
    const trial = this.getTrial(trialId);
    if (!trial) throw new Error(`Essai ${trialId} introuvable`);

    const report = trial.reports?.find((r) => r.id === reportId);
    if (!report) throw new Error(`Rapport ${reportId} introuvable`);

    const newComment: ScientificReportReviewComment = {
      id: generateUUID(),
      reportId,
      author: comment.author || 'REVIEWER',
      createdAt: new Date().toISOString(),
      text: comment.text,
      category: comment.category
    };

    if (!report.reviewComments) {
      report.reviewComments = [];
    }
    report.reviewComments.push(newComment);

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: newComment.createdAt,
      operatorId: newComment.author,
      action: 'ADD_REPORT_COMMENT',
      entityType: 'TRIAL',
      entityId: report.id,
      details: {
        commentId: newComment.id,
        category: newComment.category,
        preview: newComment.text.slice(0, 50)
      }
    });

    this.saveTrial(trial);
    return newComment;
  }

  /**
   * Trace un export dans l'audit trail (PROMPT 7 - Section 26 & 35)
   */
  public logReportExport(
    trialId: UUID,
    reportId: string,
    exportType: 'REPORT_PDF' | 'REPORT_CSV' | 'RAW_DATA_CSV' | 'COMPUTED_DATA_CSV',
    operatorId: string
  ): void {
    const trial = this.getTrial(trialId);
    if (!trial) return;

    let action = 'EXPORT_REPORT';
    if (exportType === 'RAW_DATA_CSV') action = 'EXPORT_RAW_DATA';
    else if (exportType === 'COMPUTED_DATA_CSV') action = 'EXPORT_COMPUTED_DATA';

    trial.auditTrail.push({
      id: generateUUID(),
      trialId: trial.id,
      timestamp: new Date().toISOString(),
      operatorId: operatorId || 'OPERATOR',
      action,
      entityType: 'TRIAL',
      entityId: reportId,
      details: { exportType }
    });

    this.saveTrial(trial);
  }
}
