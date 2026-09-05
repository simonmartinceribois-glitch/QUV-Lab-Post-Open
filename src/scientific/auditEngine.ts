/**
 * QUV-Lab — Moteur de Traçabilité & Audit Trail (PROMPT 5 v1.2)
 * Génère des événements d'audit immuables pour toute modification de configuration,
 * adaptation de protocole ou recalcul scientifique.
 */

import { AuditEvent } from '../types/trial';
import {
  UUID,
  MeasurementFamilyId,
  MeasurementCountConfiguration,
  MeasurementSeriesConfiguration
} from '../types/scientific';

/**
 * Génère un événement d'audit officiel MODIFY_MEASUREMENT_CONFIG
 */
export function createConfigChangeEvent(
  trialId: UUID,
  operatorId: string,
  familyId: MeasurementFamilyId,
  previousConfig: MeasurementCountConfiguration | MeasurementSeriesConfiguration | undefined,
  newConfig: MeasurementCountConfiguration | MeasurementSeriesConfiguration,
  justification?: string
): AuditEvent {
  const isSeries = 'standardConfiguration' in newConfig;

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    trialId,
    timestamp: new Date().toISOString(),
    operatorId: operatorId || newConfig.configuredBy || 'OPERATOR',
    action: 'MODIFY_MEASUREMENT_CONFIG',
    entityType: 'PROTOCOL',
    entityId: familyId,
    details: {
      familyId,
      mode: newConfig.mode,
      origin: newConfig.origin || 'PROTOCOL_ADAPTATION',
      isAdapted: newConfig.deviationFromStandard,
      justification: justification || newConfig.justification,
      deviationReason: newConfig.deviationReason,
      previous: previousConfig
        ? isSeries
          ? (previousConfig as MeasurementSeriesConfiguration).configuredConfiguration
          : (previousConfig as MeasurementCountConfiguration).configuredCount
        : null,
      updated: isSeries
        ? (newConfig as MeasurementSeriesConfiguration).configuredConfiguration
        : (newConfig as MeasurementCountConfiguration).configuredCount
    }
  };
}
