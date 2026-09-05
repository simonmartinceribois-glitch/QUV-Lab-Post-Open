/**
 * QUV-Lab — Donnees de demonstration & validation (seed)
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
import { validateAcquisitionTarget } from './trialIntegrity';
import { generateStandardExposureStages } from './trialStages';

/**
 * Crée un essai de démonstration complet représentatif d'une campagne active
 */
export function createDemoTrial(ruleSet: ScientificRuleSet): Trial {
  const trialId = 'quv-trial-2026-042';

  const metadata: TrialMetadata = {
    reference: 'QUV-2026-042',
    orderNumber: 'CO-VAN2026-001',
    reportNumber: 'RA-VAN2026-001',
    title: 'Système Lasurage Chêne Haute Durabilité',
    projectOrClient: 'Projet X — Ceribois & Partenaires',
    coatingSystemDescription: 'Système 3 couches lasure acrylique microporeuse en phase aqueuse',
    substrateDescription: 'Chêne européen (Quercus robur) quartier/faux-quartier 150×75×15 mm',
    createdBy: 'Simon Martin (Technicien Labo)',
    generalNotes: 'Campagne de vieillissement accéléré selon NF EN 927-6 (cycles UV-A 340nm + condensation).'
  };

  const commonCharacteristics: CommonCharacteristics = {
    dimensions: {
      lengthMm: 150,
      widthMm: 75,
      thicknessMm: 15,
      unit: 'mm'
    },
    substrateNature: 'Bois massif',
    materialType: 'Chêne européen (Quercus robur)',
    woodGrainOrientation: 'Sur quartier (NF EN 927-6)',
    preparationNotes: 'Rabotage fin, ponçage grain P120, dépoussiérage, stabilisation 7 jours à 20°C / 65% HR',
    conditioningNotes: 'Conditionnement selon NF EN 927-6 §5 (20±2°C, 65±5% HR jusqu\'à masse constante)',
    generalProtocolNotes: 'Toutes les éprouvettes ont été préparées sur le même lot d\'approvisionnement de bois.'
  };

  const batches: BatchDefinition[] = [
    {
      id: `batch-${trialId}-1`,
      trialId,
      reference: 'LOT XX1C',
      orderIndex: 1,
      coatingSystem: 'Lasure Acrylique Standard (Témoin)',
      woodSpecies: 'Chêne',
      productReference: 'LAS-STD-01',
      manufacturerOrSupplier: 'Fournisseur Alpha',
      coatCount: 3,
      substratePreparation: 'Ponçage P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: '2026-08-20',
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      dryFilmThicknessMicrons: 55,
      dryFilmThicknessUnit: 'µm',
      dryFilmThicknessMeasurementDate: '2026-08-21',
      dryFilmThicknessOperator: 'SM',
      dryFilmThicknessMethod: 'Peigne de jauge ISO 2808',
      batchNotes: 'Lot témoin sans agent anti-UV renforcé',
      panels: [
        { id: `panel-${trialId}-1-1`, batchId: `batch-${trialId}-1`, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', grainOrientation: 'Quartier', status: 'ACTIVE' },
        { id: `panel-${trialId}-1-2`, batchId: `batch-${trialId}-1`, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-1-3`, batchId: `batch-${trialId}-1`, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-1-4`, batchId: `batch-${trialId}-1`, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', grainOrientation: 'Faux quartier', exposureFace: 'Face externe', status: 'ACTIVE' }
      ]
    },
    {
      id: `batch-${trialId}-2`,
      trialId,
      reference: 'LOT XX2C',
      orderIndex: 2,
      coatingSystem: 'Lasure Formulation Anti-UV HALS 1.5%',
      woodSpecies: 'Chêne',
      productReference: 'LAS-UV15-02',
      manufacturerOrSupplier: 'Fournisseur Alpha',
      coatCount: 3,
      substratePreparation: 'Ponçage P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: '2026-08-20',
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      dryFilmThicknessMicrons: 95,
      dryFilmThicknessUnit: 'µm',
      dryFilmThicknessMeasurementDate: '2026-08-21',
      dryFilmThicknessOperator: 'SM',
      dryFilmThicknessMethod: 'Peigne de jauge ISO 2808',
      batchNotes: 'Formulation avec stabilisants lumière HALS',
      panels: [
        { id: `panel-${trialId}-2-1`, batchId: `batch-${trialId}-2`, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', grainOrientation: 'Quartier', status: 'ACTIVE' },
        { id: `panel-${trialId}-2-2`, batchId: `batch-${trialId}-2`, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-2-3`, batchId: `batch-${trialId}-2`, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-2-4`, batchId: `batch-${trialId}-2`, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', grainOrientation: 'Faux quartier', exposureFace: 'Face externe', status: 'ACTIVE' }
      ]
    },
    {
      id: `batch-${trialId}-3`,
      trialId,
      reference: 'LOT XX3C',
      orderIndex: 3,
      coatingSystem: 'Lasure Nano-TiO2 Hybride 2.0%',
      woodSpecies: 'Chêne',
      productReference: 'LAS-NANO-03',
      manufacturerOrSupplier: 'Fournisseur Bêta',
      coatCount: 3,
      substratePreparation: 'Ponçage P120',
      applicationMethod: 'Pinceau',
      applicationConditions: '21°C, 55% HR',
      applicationDate: '2026-08-20',
      dryingOrConditioningTime: '7 jours à 20°C/65% HR',
      dryFilmThicknessMicrons: 185,
      dryFilmThicknessUnit: 'µm',
      dryFilmThicknessMeasurementDate: '2026-08-21',
      dryFilmThicknessOperator: 'SM',
      dryFilmThicknessMethod: 'Peigne de jauge ISO 2808',
      batchNotes: 'Formulation nano-charges minérales absorbantes',
      panels: [
        { id: `panel-${trialId}-3-1`, batchId: `batch-${trialId}-3`, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', grainOrientation: 'Quartier', status: 'ACTIVE' },
        { id: `panel-${trialId}-3-2`, batchId: `batch-${trialId}-3`, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-3-3`, batchId: `batch-${trialId}-3`, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', grainOrientation: 'Quartier', exposureFace: 'Face externe', status: 'ACTIVE' },
        { id: `panel-${trialId}-3-4`, batchId: `batch-${trialId}-3`, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', grainOrientation: 'Faux quartier', exposureFace: 'Face externe', status: 'ACTIVE' }
      ]
    }
  ];

  const protocolConfig: TrialProtocolConfig = {
    standardReference: 'NF EN 927-6',
    activeFamilies: ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'],
    familyConfigs: {
      COLOR: {
        familyId: 'COLOR',
        enabled: true,
        countConfig: createCountConfiguration('COLOR', 4, ruleSet)
      },
      GLOSS: {
        familyId: 'GLOSS',
        enabled: true,
        seriesConfig: createSeriesConfiguration('GLOSS', 2, 2, ruleSet)
      },
      PERSOZ: {
        familyId: 'PERSOZ',
        enabled: true,
        countConfig: createCountConfiguration('PERSOZ', 3, ruleSet)
      },
      ADHESION: {
        familyId: 'ADHESION',
        enabled: true
      },
      OBSERVATIONS: {
        familyId: 'OBSERVATIONS',
        enabled: true
      }
    }
  };

  const stages = generateStandardExposureStages(trialId);

  const auditTrail: AuditEvent[] = [
    {
      id: 'audit-1',
      trialId,
      timestamp: '2026-08-30T08:15:00Z',
      operatorId: 'SM',
      action: 'CREATE_TRIAL',
      entityType: 'TRIAL',
      entityId: trialId,
      details: { reference: 'QUV-2026-042', title: metadata.title }
    },
    {
      id: 'audit-2',
      trialId,
      timestamp: '2026-08-30T08:20:00Z',
      operatorId: 'SM',
      action: 'CONFIGURE_PROTOCOL',
      entityType: 'PROTOCOL',
      entityId: 'ALL',
      details: { activeFamilies: ['COLOR', 'GLOSS', 'PERSOZ', 'OBSERVATIONS'], colorPoints: 4, glossSeries: '2x2' }
    },
    {
      id: 'audit-3',
      trialId,
      timestamp: '2026-08-30T08:35:00Z',
      operatorId: 'SM',
      action: 'CREATE_BATCH',
      entityType: 'BATCH',
      entityId: batches[0].id,
      details: { reference: 'LOT XX1C', panelCount: 4 }
    },
    {
      id: 'audit-4',
      trialId,
      timestamp: '2026-08-30T08:40:00Z',
      operatorId: 'SM',
      action: 'CREATE_BATCH',
      entityType: 'BATCH',
      entityId: batches[1].id,
      details: { reference: 'LOT XX2C', panelCount: 4 }
    },
    {
      id: 'audit-5',
      trialId,
      timestamp: '2026-08-30T08:45:00Z',
      operatorId: 'SM',
      action: 'CREATE_BATCH',
      entityType: 'BATCH',
      entityId: batches[2].id,
      details: { reference: 'LOT XX3C', panelCount: 4 }
    },
    {
      id: 'audit-6',
      trialId,
      timestamp: '2026-08-30T09:00:00Z',
      operatorId: 'SYSTEM',
      action: 'LOCK_TRIAL_CONFIGURATION',
      entityType: 'CONFIG',
      entityId: trialId,
      details: { reason: 'Première acquisition scientifique réalisée sur T0.' }
    },
    {
      id: 'audit-7',
      trialId,
      timestamp: '2026-08-30T12:00:00Z',
      operatorId: 'SM',
      action: 'VALIDATE_STAGE',
      entityType: 'STAGE',
      entityId: stages[0].id,
      details: { stageName: 'T0 — Avant exposition', status: 'VALIDATED' }
    },
    {
      id: 'audit-8',
      trialId,
      timestamp: '2026-09-06T17:00:00Z',
      operatorId: 'SM',
      action: 'VALIDATE_STAGE',
      entityType: 'STAGE',
      entityId: stages[1].id,
      details: { stageName: '168 h — Cycle 1', status: 'VALIDATED' }
    }
  ];

  const trial: Trial = {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: '2026-08-30T08:15:00Z',
    updatedAt: '2026-09-13T10:30:00Z',
    metadata,
    commonCharacteristics,
    status: 'IN_PROGRESS',
    configurationStatus: 'LOCKED',
    config: protocolConfig,
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
    auditTrail,
    mediaReferences: []
  };

  // Remplir les acquisitions pour T0 (validé), 168h (validé), et 336h (en cours)
  seedDemoAcquisitions(trial, ruleSet);

  return trial;
}

/**
 * Génère des acquisitions réalistes pour le scénario de démo
 */
function seedDemoAcquisitions(trial: Trial, ruleSet: ScientificRuleSet): void {
  const stageT0 = trial.stages[0];
  const stage168 = trial.stages[1];
  const stage336 = trial.stages[2];

  // Base L*a*b* par lot
  const baseColors: Record<string, { L: number; a: number; b: number }> = {
    'LOT XX1C': { L: 62.4, a: 8.2, b: 24.1 },
    'LOT XX2C': { L: 61.8, a: 8.5, b: 23.8 },
    'LOT XX3C': { L: 63.1, a: 7.9, b: 24.6 }
  };

  // Base Gloss par lot
  const baseGloss: Record<string, number> = {
    'LOT XX1C': 45.2,
    'LOT XX2C': 48.0,
    'LOT XX3C': 46.5
  };

  // Base Persoz par lot
  const basePersoz: Record<string, number> = {
    'LOT XX1C': 82.0,
    'LOT XX2C': 88.0,
    'LOT XX3C': 91.0
  };

  for (const batch of trial.batches) {
    const cBase = baseColors[batch.reference] || { L: 60, a: 8, b: 24 };
    const gBase = baseGloss[batch.reference] || 45;
    const pBase = basePersoz[batch.reference] || 85;

    for (let pIdx = 0; pIdx < batch.panels.length; pIdx++) {
      const panel = batch.panels[pIdx];

      // --- T0 ---
      // Couleur T0
      const colorRawT0: ColorRawData = {
        readings: [
          { pointIndex: 1, L: +(cBase.L + 0.1 * pIdx).toFixed(2), a: +(cBase.a - 0.05 * pIdx).toFixed(2), b: +(cBase.b + 0.1).toFixed(2) },
          { pointIndex: 2, L: +(cBase.L - 0.2 + 0.1 * pIdx).toFixed(2), a: +(cBase.a + 0.02 * pIdx).toFixed(2), b: +(cBase.b - 0.1).toFixed(2) },
          { pointIndex: 3, L: +(cBase.L + 0.15 + 0.05 * pIdx).toFixed(2), a: +(cBase.a - 0.01).toFixed(2), b: +(cBase.b + 0.05).toFixed(2) },
          { pointIndex: 4, L: +(cBase.L - 0.05 + 0.08 * pIdx).toFixed(2), a: +(cBase.a + 0.04).toFixed(2), b: +(cBase.b - 0.02).toFixed(2) }
        ]
      };
      recordAcquisitionDirect(trial, stageT0.id, batch.id, panel.id, 'COLOR', colorRawT0, ruleSet);

      // Brillance T0
      const glossRawT0: GlossRawData = {
        series: [
          {
            seriesIndex: 1,
            orientation: 'Sens du fil',
            readings: [
              { pointIndex: 1, value: +(gBase + 0.3 * pIdx).toFixed(1) },
              { pointIndex: 2, value: +(gBase - 0.2 + 0.2 * pIdx).toFixed(1) }
            ]
          },
          {
            seriesIndex: 2,
            orientation: 'Perpendiculaire',
            readings: [
              { pointIndex: 1, value: +(gBase - 1.2 + 0.3 * pIdx).toFixed(1) },
              { pointIndex: 2, value: +(gBase - 0.8 + 0.1 * pIdx).toFixed(1) }
            ]
          }
        ],
        instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
      };
      recordAcquisitionDirect(trial, stageT0.id, batch.id, panel.id, 'GLOSS', glossRawT0, ruleSet);

      // Persoz T0
      const persozRawT0: PersozRawData = {
        readings: [
          { pointIndex: 1, dampingTimeSeconds: +(pBase + pIdx).toFixed(1) },
          { pointIndex: 2, dampingTimeSeconds: +(pBase - 1 + pIdx).toFixed(1) },
          { pointIndex: 3, dampingTimeSeconds: +(pBase + 1 + pIdx).toFixed(1) }
        ],
        unit: 'SECONDS',
        instrumentMetadata: { instrumentId: 'PERSOZ-PENDULUM-02', temperatureCelsius: 21.5, relativeHumidityPercent: 50.2 }
      };
      recordAcquisitionDirect(trial, stageT0.id, batch.id, panel.id, 'PERSOZ', persozRawT0, ruleSet);

      // Observations T0
      const obsRawT0: VisualObservationsRawData = {
        observations: [
          { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Revêtement uniforme et lisse' }
        ],
        assessedBy: 'SM',
        assessedAt: '2026-08-30T11:45:00Z'
      };
      recordAcquisitionDirect(trial, stageT0.id, batch.id, panel.id, 'OBSERVATIONS', obsRawT0, ruleSet);

      // Adhérence au quadrillage T0 (ISO 2409:2020 - Témoin T)
      if (panel.role === 'WITNESS' || panel.index === 1) {
        const spacing = (batch.dryFilmThicknessMicrons && batch.dryFilmThicknessMicrons > 120) ? 3 : 2;
        const adhRawT0: AdhesionRawData = {
          adhesionClass: 0,
          gridSpacingMm: spacing,
          coatingThicknessMicrons: batch.dryFilmThicknessMicrons,
          measurementDateTime: '2026-08-30T14:00:00Z',
          applicationDateTime: batch.applicationDate,
          requiredMinimumDelayHours: 168,
          normReference: 'NF EN ISO 2409:2020',
          observation: 'Quadrillage net 6×6, bords des incisions parfaitement lisses, aucun détachement (Classe 0).'
        };
        recordAcquisitionDirect(trial, stageT0.id, batch.id, panel.id, 'ADHESION', adhRawT0, ruleSet);
      }

      // --- 168h ---
      const dL168 = batch.reference === 'LOT XX1C' ? 1.8 : batch.reference === 'LOT XX2C' ? 0.9 : 0.6;
      const dG168 = batch.reference === 'LOT XX1C' ? -4.5 : batch.reference === 'LOT XX2C' ? -2.2 : -1.5;

      const colorRaw168: ColorRawData = {
        readings: [
          { pointIndex: 1, L: +(cBase.L + dL168 + 0.1 * pIdx).toFixed(2), a: +(cBase.a + 0.4).toFixed(2), b: +(cBase.b + 0.8).toFixed(2) },
          { pointIndex: 2, L: +(cBase.L + dL168 - 0.1).toFixed(2), a: +(cBase.a + 0.5).toFixed(2), b: +(cBase.b + 0.7).toFixed(2) },
          { pointIndex: 3, L: +(cBase.L + dL168 + 0.2).toFixed(2), a: +(cBase.a + 0.3).toFixed(2), b: +(cBase.b + 0.9).toFixed(2) },
          { pointIndex: 4, L: +(cBase.L + dL168 - 0.05).toFixed(2), a: +(cBase.a + 0.45).toFixed(2), b: +(cBase.b + 0.75).toFixed(2) }
        ]
      };
      recordAcquisitionDirect(trial, stage168.id, batch.id, panel.id, 'COLOR', colorRaw168, ruleSet);

      const glossRaw168: GlossRawData = {
        series: [
          {
            seriesIndex: 1,
            orientation: 'Sens du fil',
            readings: [
              { pointIndex: 1, value: +(gBase + dG168 + 0.2 * pIdx).toFixed(1) },
              { pointIndex: 2, value: +(gBase + dG168 - 0.1).toFixed(1) }
            ]
          },
          {
            seriesIndex: 2,
            orientation: 'Perpendiculaire',
            readings: [
              { pointIndex: 1, value: +(gBase + dG168 - 1.0).toFixed(1) },
              { pointIndex: 2, value: +(gBase + dG168 - 0.6).toFixed(1) }
            ]
          }
        ],
        instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
      };
      recordAcquisitionDirect(trial, stage168.id, batch.id, panel.id, 'GLOSS', glossRaw168, ruleSet);

      const persozRaw168: PersozRawData = {
        readings: [
          { pointIndex: 1, dampingTimeSeconds: +(pBase - 2 + pIdx).toFixed(1) },
          { pointIndex: 2, dampingTimeSeconds: +(pBase - 3 + pIdx).toFixed(1) },
          { pointIndex: 3, dampingTimeSeconds: +(pBase - 1 + pIdx).toFixed(1) }
        ],
        unit: 'SECONDS'
      };
      recordAcquisitionDirect(trial, stage168.id, batch.id, panel.id, 'PERSOZ', persozRaw168, ruleSet);

      const obsRaw168: VisualObservationsRawData = {
        observations: [
          { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Aucun' },
          { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Légère modification de brillance' }
        ],
        assessedBy: 'SM'
      };
      recordAcquisitionDirect(trial, stage168.id, batch.id, panel.id, 'OBSERVATIONS', obsRaw168, ruleSet);

      // --- 336h (En cours - Lot 1 & Lot 2 remplis, Lot 3 partiel) ---
      if (batch.reference === 'LOT XX1C' || (batch.reference === 'LOT XX2C' && pIdx < 3)) {
        const dL336 = batch.reference === 'LOT XX1C' ? 3.4 : 1.7;
        const dG336 = batch.reference === 'LOT XX1C' ? -9.2 : -4.1;

        const colorRaw336: ColorRawData = {
          readings: [
            { pointIndex: 1, L: +(cBase.L + dL336 + 0.1).toFixed(2), a: +(cBase.a + 0.8).toFixed(2), b: +(cBase.b + 1.4).toFixed(2) },
            { pointIndex: 2, L: +(cBase.L + dL336 - 0.2).toFixed(2), a: +(cBase.a + 0.9).toFixed(2), b: +(cBase.b + 1.3).toFixed(2) },
            { pointIndex: 3, L: +(cBase.L + dL336 + 0.3).toFixed(2), a: +(cBase.a + 0.7).toFixed(2), b: +(cBase.b + 1.5).toFixed(2) },
            { pointIndex: 4, L: +(cBase.L + dL336).toFixed(2), a: +(cBase.a + 0.85).toFixed(2), b: +(cBase.b + 1.35).toFixed(2) }
          ]
        };
        recordAcquisitionDirect(trial, stage336.id, batch.id, panel.id, 'COLOR', colorRaw336, ruleSet);

        const glossRaw336: GlossRawData = {
          series: [
            {
              seriesIndex: 1,
              orientation: 'Sens du fil',
              readings: [
                { pointIndex: 1, value: +(gBase + dG336).toFixed(1) },
                { pointIndex: 2, value: +(gBase + dG336 - 0.5).toFixed(1) }
              ]
            },
            {
              seriesIndex: 2,
              orientation: 'Perpendiculaire',
              readings: [
                { pointIndex: 1, value: +(gBase + dG336 - 1.8).toFixed(1) },
                { pointIndex: 2, value: +(gBase + dG336 - 1.2).toFixed(1) }
              ]
            }
          ],
          instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
        };
        recordAcquisitionDirect(trial, stage336.id, batch.id, panel.id, 'GLOSS', glossRaw336, ruleSet);
      }
    }
  }

  // Seeding de photographies documentaires de démo (T0, 168h, 336h)
  const panelSample = trial.batches[0]?.panels[1]; // XX1C-1
  const stage0 = trial.stages[0]; // T0
  const stage1 = trial.stages[1]; // 168h
  const stage2 = trial.stages[2]; // 336h

  if (panelSample && stage0 && stage1) {
    const makeSvg = (label: string, hours: number, stageName: string, stateText: string, colorHue: string) =>
      `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colorHue}"/><stop offset="100%" stop-color="%2378350f"/></linearGradient><pattern id="wood" width="40" height="10" patternUnits="userSpaceOnUse"><path d="M 0 5 Q 20 0 40 5" stroke="%23ffffff" stroke-width="0.5" stroke-opacity="0.15" fill="none"/></pattern></defs><rect width="600" height="400" fill="url(%23bg)"/><rect width="600" height="400" fill="url(%23wood)"/><rect x="20" y="20" width="560" height="360" rx="16" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.3"/><circle cx="50" cy="50" r="14" fill="%23ffffff" fill-opacity="0.2"/><text x="50" y="55" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23ffffff" text-anchor="middle">📷</text><text x="80" y="55" font-family="sans-serif" font-size="16" font-weight="bold" fill="%23ffffff">${label} — ${hours} h (${stageName})</text><rect x="40" y="290" width="520" height="70" rx="10" fill="%230f172a" fill-opacity="0.75"/><text x="60" y="318" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">Suivi documentaire : ${stateText}</text><text x="60" y="342" font-family="monospace" font-size="11" fill="%2394a3b8">NF EN 927-6 • Éprouvette Pin sylvestre • QUV-Lab France</text></svg>`;

    trial.mediaReferences.push({
      id: 'photo-demo-01',
      trialId: trial.id,
      panelId: panelSample.id,
      stageId: stage0.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeSvg('LOT XX1C - Éprouvette 1', 0, 'T0', 'État initial homogène, brillant intact, surface saine', '%23b45309'),
      filename: 'PHOTO_LOT_XX1C_1_T0_0h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 245000,
      capturedAt: '2026-09-01T08:30:00Z',
      capturedBy: 'Simon Martin (Technicien)',
      caption: 'État initial avant exposition : film lasure satiné homogène, aucun défaut de surface.'
    });

    trial.mediaReferences.push({
      id: 'photo-demo-02',
      trialId: trial.id,
      panelId: panelSample.id,
      stageId: stage1.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeSvg('LOT XX1C - Éprouvette 1', 168, 'Cycle 1 (168 h)', 'Légère perte de brillance superficielle, couleur stable', '%2392400e'),
      filename: 'PHOTO_LOT_XX1C_1_C1_168h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 252000,
      capturedAt: '2026-09-08T09:15:00Z',
      capturedBy: 'Simon Martin (Technicien)',
      caption: 'Après 1 cycle (168 h) : début de matification de la zone supérieure, absence de cloquage.'
    });

    if (stage2) {
      trial.mediaReferences.push({
        id: 'photo-demo-03',
        trialId: trial.id,
        panelId: panelSample.id,
        stageId: stage2.id,
        type: 'PHOTO',
        status: 'ACTIVE',
        storageKey: makeSvg('LOT XX1C - Éprouvette 1', 336, 'Cycle 2 (336 h)', 'Matification accentuée, film adhérent, micro-relief visible', '%2378350f'),
        filename: 'PHOTO_LOT_XX1C_1_C2_336h.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 260000,
        capturedAt: '2026-09-15T10:00:00Z',
        capturedBy: 'Simon Martin (Technicien)',
        caption: 'Après 2 cycles (336 h) : évolution continue de l\'aspect de surface, conservation de l\'intégrité.'
      });
    }

    // Photo pour le témoin T à T0
    const witnessSample = trial.batches[0]?.panels[0];
    if (witnessSample) {
      trial.mediaReferences.push({
        id: 'photo-demo-t0-witness',
        trialId: trial.id,
        panelId: witnessSample.id,
        stageId: stage0.id,
        type: 'PHOTO',
        status: 'ACTIVE',
        storageKey: makeSvg('LOT XX1C - Témoin T', 0, 'T0', 'Éprouvette témoin de référence non exposée', '%231e293b'),
        filename: 'PHOTO_LOT_XX1C_T_T0.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 238000,
        capturedAt: '2026-09-01T08:20:00Z',
        capturedBy: 'Simon Martin (Technicien)',
        caption: 'Éprouvette témoin T conservée en chambre obscure conditionnée (20°C / 65% HR).'
      });
    }
  }
}

/**
 * Génère l'essai de validation de référence QUV-2026-VAL-01 (PROMPT 8 - Section 51)
 * Cas d'école complet avec T0 et 2016 h validés
 */
export function createValidationTrial(ruleSet: ScientificRuleSet): Trial {
  const trialId = 'trial-quv-2026-val-01';
  const metadata: TrialMetadata = {
    reference: 'QUV-2026-VAL-01',
    title: 'Évaluation de durabilité accélérée - Lasure Haute Durabilité Pro',
    projectOrClient: 'FINITIONS PRO SA',
    createdBy: 'SM',
    generalNotes:
      'Objectif : vieillissement accéléré selon NF EN 927-6 (Cycle A, 2016 h) pour qualification produit. ' +
      'Opérateur : Dr. S. Martin (Responsable Laboratoire). Laboratoire : QUV-Lab France — Métrologie & Matériaux. ' +
      'Référence normative : NF EN 927-6 (Cycle A - 2016 h). ' +
      'Période prévue : du 2026-03-01 au 2026-05-24.'
  };

  const commonCharacteristics: CommonCharacteristics = {
    dimensions: {
      lengthMm: 150,
      widthMm: 75,
      thicknessMm: 15,
      unit: 'mm'
    },
    materialType: 'Pin sylvestre (Pinus sylvestris L.)',
    woodGrainOrientation: 'Sur quartier (NF EN 927-6)',
    preparationNotes: 'Rabotage fin selon NF EN 927-6, dépoussiérage et conditionnement 20°C/65% HR',
    conditioningNotes: 'Stabilisation 7 jours selon NF EN 927-6 §5',
    generalProtocolNotes: 'Cycle A (NF EN 927-6 - UV-A 340 nm + Condensation + Pulvérisation) sur enceinte QUV/spray'
  };

  const protocolConfig: TrialProtocolConfig = {
    standardReference: 'NF EN 927-6',
    activeFamilies: ['COLOR', 'GLOSS', 'PERSOZ', 'OBSERVATIONS'],
    familyConfigs: {
      COLOR: { familyId: 'COLOR', enabled: true },
      GLOSS: { familyId: 'GLOSS', enabled: true },
      PERSOZ: { familyId: 'PERSOZ', enabled: true },
      OBSERVATIONS: { familyId: 'OBSERVATIONS', enabled: true }
    }
  };

  const stages: ExposureStage[] = [];
  stages.push({
    id: `val-st-0`,
    trialId,
    cycleIndex: 0,
    stageType: 'INITIAL_PRE_EXPOSURE',
    name: 'T0 — MESURES INITIALES AVANT EXPOSITION',
    scheduledExposureHours: 0,
    status: 'VALIDATED'
  });

  for (let c = 1; c <= 11; c++) {
    const hours = c * 168;
    stages.push({
      id: `val-st-${hours}`,
      trialId,
      cycleIndex: c,
      stageType: 'INTERMEDIATE_DURING_EXPOSURE',
      name: `${hours} h — MESURES EN COURS D'EXPOSITION`,
      scheduledExposureHours: hours,
      status: 'VALIDATED'
    });
  }

  stages.push({
    id: `val-st-2016`,
    trialId,
    cycleIndex: 12,
    stageType: 'FINAL_POST_EXPOSURE',
    name: '2016 h — MESURES FINALES APRÈS EXPOSITION',
    scheduledExposureHours: 2016,
    status: 'VALIDATED'
  });

  const batch: BatchDefinition = {
    id: 'val-batch-1',
    trialId,
    reference: 'LOT A - FINITIONS PRO',
    productReference: 'Lasure Haute Durabilité Pro',
    orderIndex: 1,
    coatingSystem: 'Lasure Haute Durabilité Pro (3 couches satin)',
    woodSpecies: 'Pin sylvestre',
    manufacturerOrSupplier: 'FINITIONS PRO SA',
    panels: [
      { id: 'val-p1', batchId: 'val-batch-1', index: 1, label: 'P01', status: 'ACTIVE' },
      { id: 'val-p2', batchId: 'val-batch-1', index: 2, label: 'P02', status: 'ACTIVE' },
      { id: 'val-p3', batchId: 'val-batch-1', index: 3, label: 'P03', status: 'ACTIVE' },
      { id: 'val-p4', batchId: 'val-batch-1', index: 4, label: 'P04', status: 'ACTIVE' }
    ]
  };

  const trial: Trial = {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: '2026-03-01T08:00:00Z',
    updatedAt: '2026-05-24T18:00:00Z',
    metadata,
    commonCharacteristics,
    status: 'COMPLETED',
    configurationStatus: 'LOCKED',
    config: protocolConfig,
    scheduleConfig: {
      cycleDurationHours: 168,
      maxCycles: 12,
      initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
      intermediateCycles: Array.from({ length: 11 }, (_, i) => ({ cycleIndex: i + 1, mandatory: true })),
      finalCycle: { cycleIndex: 12, mandatory: true }
    },
    stages,
    batches: [batch],
    acquisitions: {},
    auditTrail: [
      {
        id: 'val-audit-1',
        trialId,
        timestamp: '2026-03-01T08:00:00Z',
        operatorId: 'SM',
        action: 'CREATE_TRIAL',
        entityType: 'TRIAL',
        entityId: trialId
      },
      {
        id: 'val-audit-2',
        trialId,
        timestamp: '2026-05-24T18:00:00Z',
        operatorId: 'SM',
        action: 'VALIDATE_STAGE',
        entityType: 'STAGE',
        entityId: 'val-st-2016'
      }
    ],
    mediaReferences: []
  };

  // Remplissage T0 : Persoz = 178 s, Gloss = 44.1 GU, Color L=65.20, a=8.40, b=18.10
  const stage0 = stages[0];
  for (const panel of batch.panels) {
    const pIdx = panel.index;
    const colorRaw0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: +(65.20 + 0.1 * pIdx).toFixed(2), a: +(8.40 + 0.05 * pIdx).toFixed(2), b: +(18.10 - 0.1 * pIdx).toFixed(2) },
        { pointIndex: 2, L: +(65.20 - 0.1 * pIdx).toFixed(2), a: +(8.40 - 0.05 * pIdx).toFixed(2), b: +(18.10 + 0.1 * pIdx).toFixed(2) },
        { pointIndex: 3, L: +(65.20 + 0.05).toFixed(2), a: +(8.40 + 0.02).toFixed(2), b: +(18.10).toFixed(2) },
        { pointIndex: 4, L: +(65.20 - 0.05).toFixed(2), a: +(8.40 - 0.02).toFixed(2), b: +(18.10).toFixed(2) }
      ]
    };
    recordAcquisitionDirect(trial, stage0.id, batch.id, panel.id, 'COLOR', colorRaw0, ruleSet);

    const glossRaw0: GlossRawData = {
      series: [
        {
          seriesIndex: 1,
          orientation: 'Sens du fil',
          readings: [
            { pointIndex: 1, value: +(44.3 + 0.1 * pIdx).toFixed(1) },
            { pointIndex: 2, value: +(44.1 - 0.1 * pIdx).toFixed(1) }
          ]
        },
        {
          seriesIndex: 2,
          orientation: 'Perpendiculaire',
          readings: [
            { pointIndex: 1, value: +(43.9 + 0.1 * pIdx).toFixed(1) },
            { pointIndex: 2, value: +(44.1).toFixed(1) }
          ]
        }
      ],
      instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
    };
    recordAcquisitionDirect(trial, stage0.id, batch.id, panel.id, 'GLOSS', glossRaw0, ruleSet);

    const persozRaw0: PersozRawData = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: +(178 + (pIdx % 2 === 0 ? 1 : -1)).toFixed(1) },
        { pointIndex: 2, dampingTimeSeconds: +(178 - (pIdx % 2 === 0 ? 1 : -1)).toFixed(1) },
        { pointIndex: 3, dampingTimeSeconds: 178.0 }
      ],
      unit: 'SECONDS'
    };
    recordAcquisitionDirect(trial, stage0.id, batch.id, panel.id, 'PERSOZ', persozRaw0, ruleSet);

    const obsRaw0: VisualObservationsRawData = {
      observations: [
        { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'État initial intact' },
        { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'État initial intact' },
        { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'État initial intact' },
        { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'État initial intact' },
        { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Film homogène régulier' }
      ],
      assessedBy: 'SM'
    };
    recordAcquisitionDirect(trial, stage0.id, batch.id, panel.id, 'OBSERVATIONS', obsRaw0, ruleSet);
  }

  // Remplissage étapes intermédiaires (168h à 1848h)
  for (let c = 1; c <= 11; c++) {
    const stage = stages[c];
    const fraction = c / 12;
    const currentL = 65.20 - 3.92 * fraction;
    const currentA = 8.40 + 0.75 * fraction;
    const currentB = 18.10 + 3.20 * fraction;
    const currentGloss = 44.1 - 16.2 * fraction;
    const currentPersoz = 178.0 - 27.0 * fraction;

    for (const panel of batch.panels) {
      const colorRaw: ColorRawData = {
        readings: [
          { pointIndex: 1, L: +(currentL + 0.05).toFixed(2), a: +(currentA + 0.02).toFixed(2), b: +(currentB + 0.03).toFixed(2) },
          { pointIndex: 2, L: +(currentL - 0.05).toFixed(2), a: +(currentA - 0.02).toFixed(2), b: +(currentB - 0.03).toFixed(2) },
          { pointIndex: 3, L: +(currentL).toFixed(2), a: +(currentA).toFixed(2), b: +(currentB).toFixed(2) },
          { pointIndex: 4, L: +(currentL).toFixed(2), a: +(currentA).toFixed(2), b: +(currentB).toFixed(2) }
        ]
      };
      recordAcquisitionDirect(trial, stage.id, batch.id, panel.id, 'COLOR', colorRaw, ruleSet);

      const glossRaw: GlossRawData = {
        series: [
          {
            seriesIndex: 1,
            orientation: 'Sens du fil',
            readings: [
              { pointIndex: 1, value: +(currentGloss + 0.2).toFixed(1) },
              { pointIndex: 2, value: +(currentGloss - 0.2).toFixed(1) }
            ]
          },
          {
            seriesIndex: 2,
            orientation: 'Perpendiculaire',
            readings: [
              { pointIndex: 1, value: +(currentGloss - 0.1).toFixed(1) },
              { pointIndex: 2, value: +(currentGloss + 0.1).toFixed(1) }
            ]
          }
        ],
        instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
      };
      recordAcquisitionDirect(trial, stage.id, batch.id, panel.id, 'GLOSS', glossRaw, ruleSet);

      const persozRaw: PersozRawData = {
        readings: [
          { pointIndex: 1, dampingTimeSeconds: +(currentPersoz + 0.5).toFixed(1) },
          { pointIndex: 2, dampingTimeSeconds: +(currentPersoz - 0.5).toFixed(1) },
          { pointIndex: 3, dampingTimeSeconds: +(currentPersoz).toFixed(1) }
        ],
        unit: 'SECONDS'
      };
      recordAcquisitionDirect(trial, stage.id, batch.id, panel.id, 'PERSOZ', persozRaw, ruleSet);

      const obsRaw: VisualObservationsRawData = {
        observations: [
          { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Néant' },
          { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Néant' },
          { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Néant' },
          { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Néant' }
        ],
        assessedBy: 'SM'
      };
      recordAcquisitionDirect(trial, stage.id, batch.id, panel.id, 'OBSERVATIONS', obsRaw, ruleSet);
    }
  }

  // Remplissage étape finale 2016 h
  const stage2016 = stages[12];
  for (const panel of batch.panels) {
    const colorRaw2016: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 61.28, a: 9.15, b: 21.30 },
        { pointIndex: 2, L: 61.28, a: 9.15, b: 21.30 },
        { pointIndex: 3, L: 61.28, a: 9.15, b: 21.30 },
        { pointIndex: 4, L: 61.28, a: 9.15, b: 21.30 }
      ]
    };
    recordAcquisitionDirect(trial, stage2016.id, batch.id, panel.id, 'COLOR', colorRaw2016, ruleSet);

    const glossRaw2016: GlossRawData = {
      series: [
        {
          seriesIndex: 1,
          orientation: 'Sens du fil',
          readings: [
            { pointIndex: 1, value: 27.9 },
            { pointIndex: 2, value: 27.9 }
          ]
        },
        {
          seriesIndex: 2,
          orientation: 'Perpendiculaire',
          readings: [
            { pointIndex: 1, value: 27.9 },
            { pointIndex: 2, value: 27.9 }
          ]
        }
      ],
      instrumentMetadata: { instrumentId: 'TRI-GLOSS-LAB01', geometry: '60' }
    };
    recordAcquisitionDirect(trial, stage2016.id, batch.id, panel.id, 'GLOSS', glossRaw2016, ruleSet);

    const persozRaw2016: PersozRawData = {
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 151.0 },
        { pointIndex: 2, dampingTimeSeconds: 151.0 },
        { pointIndex: 3, dampingTimeSeconds: 151.0 }
      ],
      unit: 'SECONDS'
    };
    recordAcquisitionDirect(trial, stage2016.id, batch.id, panel.id, 'PERSOZ', persozRaw2016, ruleSet);

    const obsRaw2016: VisualObservationsRawData = {
      observations: [
        { category: 'BLISTERING', categoryLabel: 'Cloquage (ISO 4628-2)', rating: 0, status: 'CONFORME', comment: 'Aucun cloquage après 2016 h' },
        { category: 'FLAKING', categoryLabel: 'Écaillage (ISO 4628-5)', rating: 0, status: 'CONFORME', comment: 'Aucun écaillage après 2016 h' },
        { category: 'CRACKING', categoryLabel: 'Craquelage (ISO 4628-4)', rating: 0, status: 'CONFORME', comment: 'Aucun craquelage après 2016 h' },
        { category: 'CHALKING', categoryLabel: 'Farinage (ISO 4628-6)', rating: 0, status: 'CONFORME', comment: 'Aucun farinage après 2016 h' },
        { category: 'GENERAL_APPEARANCE', categoryLabel: 'Aspect général', rating: 0, status: 'CONFORME', comment: 'Perte de brillance satinée régulière, légère matification' }
      ],
      assessedBy: 'SM'
    };
    recordAcquisitionDirect(trial, stage2016.id, batch.id, panel.id, 'OBSERVATIONS', obsRaw2016, ruleSet);

    // Adhérence au quadrillage C12 (2016 h - Éprouvettes exposées)
    if (panel.role !== 'WITNESS' && panel.index !== 1) {
      const spacing = (batch.dryFilmThicknessMicrons && batch.dryFilmThicknessMicrons > 120) ? 3 : 2;
      const adhClass = batch.reference === 'LOT XX1C' ? 1 : 0;
      const adhRaw2016: AdhesionRawData = {
        adhesionClass: adhClass,
        gridSpacingMm: spacing,
        coatingThicknessMicrons: batch.dryFilmThicknessMicrons,
        measurementDateTime: '2026-11-25T15:30:00Z',
        applicationDateTime: batch.applicationDate,
        requiredMinimumDelayHours: 168,
        normReference: 'NF EN ISO 2409:2020',
        observation: adhClass === 0
          ? 'Bords des incisions lisses après 2016 h d\'exposition, aucun détachement.'
          : 'Légers détachements en petits éclats au niveau des intersections des incisions (< 5 % de la surface).'
      };
      recordAcquisitionDirect(trial, stage2016.id, batch.id, panel.id, 'ADHESION', adhRaw2016, ruleSet);
    }
  }

  // Planche photographique chronologique d'exemple (T0, C3/504h, C6/1008h, C9/1512h, C12/2016h)
  const p1 = batch.panels[1]; // LOT A - 1 (E1)
  const st0 = stages[0]; // T0 - 0h
  const st3 = stages[3]; // C3 - 504h
  const st6 = stages[6]; // C6 - 1008h
  const st9 = stages[9]; // C9 - 1512h
  const st12 = stages[12]; // C12 - 2016h

  const makeValSvg = (hours: number, stageLabel: string, desc: string, gradStart: string) =>
    `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><defs><linearGradient id="valbg${hours}" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${gradStart}"/><stop offset="100%" stop-color="%23451a03"/></linearGradient><pattern id="woodpat" width="50" height="12" patternUnits="userSpaceOnUse"><path d="M 0 6 Q 25 0 50 6" stroke="%23ffffff" stroke-width="0.6" stroke-opacity="0.18" fill="none"/></pattern></defs><rect width="600" height="400" fill="url(%23valbg${hours})"/><rect width="600" height="400" fill="url(%23woodpat)"/><rect x="20" y="20" width="560" height="360" rx="14" fill="none" stroke="%23ffffff" stroke-width="1.5" stroke-opacity="0.35"/><rect x="35" y="35" width="220" height="32" rx="8" fill="%230f172a" fill-opacity="0.85"/><text x="45" y="56" font-family="monospace" font-size="13" font-weight="bold" fill="%2338bdf8">LOT A - Échantillon 1</text><rect x="400" y="35" width="165" height="32" rx="8" fill="%231e293b" fill-opacity="0.85"/><text x="482" y="56" font-family="monospace" font-size="13" font-weight="bold" fill="%23fbbf24" text-anchor="middle">${stageLabel} — ${hours} h</text><rect x="35" y="295" width="530" height="70" rx="10" fill="%23020617" fill-opacity="0.8"/><text x="50" y="322" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23f8fafc">${desc}</text><text x="50" y="346" font-family="monospace" font-size="11" fill="%2394a3b8">NF EN 927-6 (Cycle A) • Pinus sylvestris • QUV-Lab Métrologie</text></svg>`;

  trial.mediaReferences.push(
    {
      id: 'photo-val-00',
      trialId: trial.id,
      panelId: p1.id,
      stageId: st0.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeValSvg(0, 'T0', 'État initial : film satiné translucide sans défaut', '%23d97706'),
      filename: 'PHOTO_LOTA_1_T0_0h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 248000,
      capturedAt: '2026-03-01T08:00:00Z',
      capturedBy: 'Dr. S. Martin (Responsable Labo)',
      caption: 'T0 (0 h) : Aspect initial sain et homogène. Aucun signe de farinage, cloquage ou craquelage.'
    },
    {
      id: 'photo-val-03',
      trialId: trial.id,
      panelId: p1.id,
      stageId: st3.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeValSvg(504, 'C3', 'Après 504 h : début de matification, teinte stable', '%23b45309'),
      filename: 'PHOTO_LOTA_1_C3_504h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 254000,
      capturedAt: '2026-03-22T09:30:00Z',
      capturedBy: 'Dr. S. Martin (Responsable Labo)',
      caption: 'C3 (504 h) : Perte de brillance modérée, très légère modification colorimétrique, excellente tenue.'
    },
    {
      id: 'photo-val-06',
      trialId: trial.id,
      panelId: p1.id,
      stageId: st6.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeValSvg(1008, 'C6', 'Après 1008 h : matification progressive, film continu', '%2392400e'),
      filename: 'PHOTO_LOTA_1_C6_1008h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 259000,
      capturedAt: '2026-04-12T11:00:00Z',
      capturedBy: 'Dr. S. Martin (Responsable Labo)',
      caption: 'C6 (1008 h) : Matification homogène constatée, structure du bois visible sans décollement.'
    },
    {
      id: 'photo-val-09',
      trialId: trial.id,
      panelId: p1.id,
      stageId: st9.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeValSvg(1512, 'C9', 'Après 1512 h : matification prononcée, intégrité préservée', '%2378350f'),
      filename: 'PHOTO_LOTA_1_C9_1512h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 263000,
      capturedAt: '2026-05-03T14:15:00Z',
      capturedBy: 'Dr. S. Martin (Responsable Labo)',
      caption: 'C9 (1512 h) : Aspect mat régulier, aucune fissuration ni dégradation locale.'
    },
    {
      id: 'photo-val-12',
      trialId: trial.id,
      panelId: p1.id,
      stageId: st12.id,
      type: 'PHOTO',
      status: 'ACTIVE',
      storageKey: makeValSvg(2016, 'C12', 'Après 2016 h : terme d\'exposition, aspect mat sans altération grave', '%23581c87'),
      filename: 'PHOTO_LOTA_1_C12_2016h.jpg',
      mimeType: 'image/jpeg',
      sizeBytes: 271000,
      capturedAt: '2026-05-24T16:00:00Z',
      capturedBy: 'Dr. S. Martin (Responsable Labo)',
      caption: 'C12 (2016 h) : Terme de l\'essai. Dégradation limitée à la perte de brillance normale sans rupture du film.'
    }
  );

  return trial;
}

function recordAcquisitionDirect(
  trial: Trial,
  stageId: UUID,
  batchId: UUID,
  panelId: UUID,
  familyId: MeasurementFamilyId,
  raw: unknown,
  ruleSet: ScientificRuleSet
): PanelAcquisitionRecord {
  // Garde-fou d'intégrité relationnelle (Gate 3.1 - Risque 1)
  validateAcquisitionTarget(trial, stageId, batchId, panelId);

  const key = `${stageId}__${panelId}__${familyId}`;
  const record: PanelAcquisitionRecord = {
    id: `acq-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    trialId: trial.id,
    stageId,
    batchId,
    panelId,
    familyId,
    raw,
    computed: null,
    status: 'COMPLETE',
    alerts: [],
    trace: {
      createdBy: 'SM',
      createdAt: new Date().toISOString(),
      source: 'MANUAL_KEYPAD'
    },
    mediaIds: []
  };

  const { updatedRecord } = recalculateAcquisition(record, trial, ruleSet);
  trial.acquisitions[key] = updatedRecord;
  return updatedRecord;
}
