/**
 * QUV-Lab — Moteur d'Évaluation des Observations Visuelles (ISO 4628 / NF EN 927-6)
 * Évalue les cotations visuelles, détecte les anomalies d'aspect et préserve l'intégrité du RAW.
 */

import {
  VisualObservationsRawData,
  VisualObservationsComputedData,
  VisualObservationCategory,
  MeasurementAlert,
  QualityAssessment,
  ProtocolComplianceStatus,
  ScientificRuleSet,
  UUID
} from '../types/scientific';

export const OBSERVATIONS_CALCULATION_VERSION = '1.2.0';

export interface ObservationsCalculationResult {
  computed: VisualObservationsComputedData;
  alerts: MeasurementAlert[];
}

export function calculateObservations(
  rawData: VisualObservationsRawData | null | undefined,
  ruleSet: ScientificRuleSet,
  options?: {
    panelId?: UUID;
    stageId?: UUID;
    calculationVersion?: string;
  }
): ObservationsCalculationResult {
  const alerts: MeasurementAlert[] = [];
  const calculationVersion = options?.calculationVersion || OBSERVATIONS_CALCULATION_VERSION;
  const calculatedAt = new Date().toISOString();

  if (!rawData || !Array.isArray(rawData.observations) || rawData.observations.length === 0) {
    alerts.push({
      id: `alert-obs-empty-${Date.now()}`,
      severity: 'WARNING',
      code: 'MEASUREMENT_MISSING',
      message: 'Aucune observation visuelle enregistrée pour ce panneau.',
      familyId: 'OBSERVATIONS',
      panelId: options?.panelId,
      stageId: options?.stageId
    });

    const qualityAssessment: QualityAssessment = {
      status: 'INVALID',
      validCount: 0,
      expectedCount: 0,
      actualCount: 0,
      suspectCount: 0,
      invalidCount: 0,
      missingCount: 0,
      completenessPercent: 0,
      warnings: ['Données d\'observation manquantes']
    };

    const protocolStatus: ProtocolComplianceStatus = 'INCOMPLETE';

    return {
      computed: {
        totalEvaluated: 0,
        defectsCount: 0,
        maxRating: 0,
        summary: 'Non évalué',
        qualityAssessment,
        protocolStatus,
        computation: {
          calculationVersion,
          calculatedAt
        }
      },
      alerts
    };
  }

  let totalEvaluated = 0;
  let defectsCount = 0;
  let maxRatingNum = 0;
  const defectDescriptions: string[] = [];

  for (const obs of rawData.observations) {
    totalEvaluated++;
    const ratingVal = typeof obs.rating === 'number' ? obs.rating : parseFloat(obs.rating) || 0;
    if (ratingVal > maxRatingNum) maxRatingNum = ratingVal;

    if (ratingVal > 0 || obs.status === 'NON_CONFORME' || obs.status === 'OBSERVE') {
      defectsCount++;
      defectDescriptions.push(`${obs.categoryLabel || obs.category} (Note: ${obs.rating})`);

      if (ratingVal >= 3) {
        alerts.push({
          id: `alert-obs-severe-${obs.category}-${Date.now()}`,
          severity: 'WARNING',
          code: 'STATISTICAL_WARNING',
          message: `Défaut visuel marqué détecté : ${obs.categoryLabel || obs.category} (cotation ${obs.rating}).`,
          familyId: 'OBSERVATIONS',
          panelId: options?.panelId,
          stageId: options?.stageId
        });
      }
    }
  }

  const qualityStatus = defectsCount > 0 ? (maxRatingNum >= 3 ? 'WARNING' : 'ACCEPTABLE') : 'GOOD';
  const qualityAssessment: QualityAssessment = {
    status: qualityStatus,
    validCount: totalEvaluated,
    expectedCount: totalEvaluated,
    actualCount: totalEvaluated,
    suspectCount: 0,
    invalidCount: 0,
    missingCount: 0,
    completenessPercent: 100,
    warnings: defectsCount === 0 ? [] : [`${defectsCount} anomalie(s) visuelle(s) relevée(s)`]
  };

  const summary = defectsCount === 0
    ? 'Aspect intact (Aucun défaut)'
    : `Défauts : ${defectDescriptions.slice(0, 3).join(', ')}${defectDescriptions.length > 3 ? '...' : ''}`;

  return {
    computed: {
      totalEvaluated,
      defectsCount,
      maxRating: maxRatingNum,
      summary,
      qualityAssessment,
      protocolStatus: 'STANDARD',
      computation: {
        calculationVersion,
        calculatedAt
      }
    },
    alerts
  };
}
