/**
 * QUV-Lab — Service de Recalcul & Pipeline Scientifique en 10 Étapes
 * Lit uniquement RAW, applique le référentiel scientifique, produit COMPUTED et garantit l'immuabilité de RAW.
 */

import {
  Trial,
  PanelAcquisitionRecord
} from '../types/trial';
import {
  ScientificRuleSet,
  ColorRawData,
  GlossRawData,
  PersozRawData,
  AcquisitionStatus,
  MeasurementAlert
} from '../types/scientific';
import { calculateColor } from './colorEngine';
import { calculateGloss } from './glossEngine';
import { calculatePersoz } from './persozEngine';
import { calculateAdhesion } from './adhesionEngine';
import { calculateObservations } from './observationsEngine';
import { VisualObservationsRawData, AdhesionRawData } from '../types/scientific';

export interface RecalculationResult {
  updatedRecord: PanelAcquisitionRecord;
  rawUnchanged: boolean;
}

/**
 * Recalcule une acquisition spécifique sans altérer le RAW
 */
export function recalculateAcquisition(
  record: PanelAcquisitionRecord,
  trial: Trial,
  ruleSet: ScientificRuleSet,
  options?: {
    customCalculationVersion?: string;
  }
): RecalculationResult {
  // Copie de sécurité pour vérifier l'immuabilité absolue
  const rawSnapshotBefore = JSON.stringify(record.raw);

  // Recherche de l'étape de référence (T0 par défaut)
  const initialStage = trial.stages.find((s) => s.stageType === 'INITIAL_PRE_EXPOSURE' || s.cycleIndex === 0);
  const isCurrentInitial = record.stageId === initialStage?.id;

  let referenceRaw: unknown = null;
  if (!isCurrentInitial && initialStage) {
    const refKey = `${initialStage.id}__${record.panelId}__${record.familyId}`;
    const refRecord = trial.acquisitions[refKey];
    if (refRecord) {
      referenceRaw = refRecord.raw;
    }
  }

  let computed: unknown = null;
  let alerts: MeasurementAlert[] = [];

  const famConfig = trial.config.familyConfigs[record.familyId];

  if (record.familyId === 'COLOR') {
    const countConfig = famConfig?.countConfig || ruleSet.measurementConfigurations.COLOR;
    const res = calculateColor(
      record.raw as ColorRawData,
      countConfig,
      ruleSet,
      {
        referenceRaw: referenceRaw as ColorRawData | null,
        referenceStageId: initialStage?.id,
        panelId: record.panelId,
        stageId: record.stageId,
        calculationVersion: options?.customCalculationVersion
      }
    );
    computed = res.computed;
    alerts = res.alerts;
  } else if (record.familyId === 'GLOSS') {
    const seriesConfig = famConfig?.seriesConfig || ruleSet.seriesConfigurations?.GLOSS;
    if (seriesConfig) {
      const res = calculateGloss(
        record.raw as GlossRawData,
        seriesConfig,
        ruleSet,
        {
          referenceRaw: referenceRaw as GlossRawData | null,
          referenceStageId: initialStage?.id,
          panelId: record.panelId,
          stageId: record.stageId,
          calculationVersion: options?.customCalculationVersion
        }
      );
      computed = res.computed;
      alerts = res.alerts;
    }
  } else if (record.familyId === 'PERSOZ') {
    const countConfig = famConfig?.countConfig || ruleSet.measurementConfigurations.PERSOZ;
    const res = calculatePersoz(
      record.raw as PersozRawData,
      countConfig,
      ruleSet,
      {
        referenceRaw: referenceRaw as PersozRawData | null,
        referenceStageId: initialStage?.id,
        panelId: record.panelId,
        stageId: record.stageId,
        calculationVersion: options?.customCalculationVersion
      }
    );
    computed = res.computed;
    alerts = res.alerts;
  } else if (record.familyId === 'ADHESION') {
    const countConfig = famConfig?.countConfig || ruleSet.measurementConfigurations.ADHESION;
    const res = calculateAdhesion(
      record.raw as AdhesionRawData,
      countConfig,
      ruleSet,
      {
        referenceRaw: referenceRaw as AdhesionRawData | null,
        referenceStageId: initialStage?.id,
        panelId: record.panelId,
        stageId: record.stageId,
        calculationVersion: options?.customCalculationVersion
      }
    );
    computed = res.computed;
    alerts = res.alerts;
  } else if (record.familyId === 'OBSERVATIONS') {
    const res = calculateObservations(
      record.raw as VisualObservationsRawData,
      ruleSet,
      {
        panelId: record.panelId,
        stageId: record.stageId,
        calculationVersion: options?.customCalculationVersion
      }
    );
    computed = res.computed;
    alerts = res.alerts;
  }

  // Détermination du statut de l'acquisition
  let status: AcquisitionStatus = 'COMPLETE';
  if (alerts.some((a) => a.severity === 'BLOCKING')) {
    status = 'ERROR';
  } else if (alerts.some((a) => a.severity === 'WARNING')) {
    status = 'WARNING';
  } else if (!computed) {
    status = 'EMPTY';
  }

  // Vérification de l'immuabilité
  const rawSnapshotAfter = JSON.stringify(record.raw);
  const rawUnchanged = rawSnapshotBefore === rawSnapshotAfter;

  const updatedRecord: PanelAcquisitionRecord = {
    ...record,
    computed,
    alerts,
    status,
    trace: {
      ...record.trace,
      lastModifiedAt: new Date().toISOString()
    }
  };

  return {
    updatedRecord,
    rawUnchanged
  };
}

/**
 * Recalcule toutes les acquisitions d'un essai
 */
export function recalculateAllTrialAcquisitions(
  trial: Trial,
  ruleSet: ScientificRuleSet,
  options?: {
    customCalculationVersion?: string;
  }
): { updatedAcquisitions: Record<string, PanelAcquisitionRecord>; allRawUnchanged: boolean } {
  const updatedAcquisitions: Record<string, PanelAcquisitionRecord> = {};
  let allRawUnchanged = true;

  for (const [key, record] of Object.entries(trial.acquisitions)) {
    const { updatedRecord, rawUnchanged } = recalculateAcquisition(
      record,
      trial,
      ruleSet,
      options
    );
    updatedAcquisitions[key] = updatedRecord;
    if (!rawUnchanged) allRawUnchanged = false;
  }

  return { updatedAcquisitions, allRawUnchanged };
}
