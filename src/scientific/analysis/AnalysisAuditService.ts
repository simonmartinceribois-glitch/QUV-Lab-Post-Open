/**
 * QUV-Lab — Service d'Audit et de Versionnage de l'Assistant QUV (PROMPT 8 - Section 24, 25, 38)
 * Enregistre et trace tous les événements liés aux analyses générées, modifiées et validées.
 */

import { UUID, ISODateString } from '../../types/scientific';
import { Trial, AuditEvent } from '../../types/trial';
import { QUVAnalysisResult, AnalysisAuditEvent, AnalysisEventType, AnalysisReviewStatus } from '../../types/analysis';
import { ANALYSIS_VERSION } from './AnalysisEngine';

export class AnalysisAuditService {
  /**
   * Crée un événement d'audit spécifique pour l'Assistant d'Analyse QUV
   */
  public static logAnalysisEvent(
    trial: Trial,
    eventType: AnalysisEventType,
    operatorId: string,
    analysis: QUVAnalysisResult,
    customDetails?: Record<string, unknown>
  ): AuditEvent {
    const now = new Date().toISOString();
    const event: AuditEvent = {
      id: `audit-analysis-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      trialId: trial.id,
      timestamp: now,
      operatorId: operatorId || 'OPERATOR',
      action: eventType,
      entityType: 'TRIAL',
      entityId: analysis.id,
      details: {
        analysisVersion: ANALYSIS_VERSION,
        calculationVersion: analysis.metadata.calculationVersion,
        ruleSetVersion: analysis.metadata.ruleSetVersion,
        targetStageId: analysis.scope.targetStageId,
        reviewStatus: analysis.review.status,
        ...customDetails
      }
    };

    if (!trial.auditTrail) {
      trial.auditTrail = [];
    }
    trial.auditTrail.push(event);

    return event;
  }
}
