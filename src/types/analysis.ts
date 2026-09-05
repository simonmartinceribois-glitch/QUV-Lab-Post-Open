/**
 * QUV-Lab — Modèle de Données de l'Assistant d'Analyse QUV (PROMPT 8)
 * Définition des types pour l'interprétation scientifique, détection factuelle des anomalies,
 * comparaisons multi-systèmes, hiérarchie en 6 niveaux et traçabilité de revue.
 */

import { UUID, ISODateString, MeasurementFamilyId, ProtocolComplianceStatus } from './scientific';

export type AnalysisSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type AnalysisAnomalyCategory =
  | 'DATA'
  | 'METROLOGY'
  | 'PROTOCOL'
  | 'TEMPORAL'
  | 'COMPARISON'
  | 'NORMATIVE';

export interface AnalysisAnomaly {
  id: string;
  severity: AnalysisSeverity;
  category: AnalysisAnomalyCategory;
  code: string;
  title: string;
  factualDescription: string;
  sourceReference?: string;
  affectedTrialId?: string;
  affectedLotId?: string;
  affectedPanelId?: string;
  affectedStageId?: string;
  blocking: boolean;
}

export interface AnalysisComputation {
  analysisVersion: string;       // ex: '1.0.0'
  calculationVersion: string;    // ex: '1.1.0'
  ruleSetVersion: string;        // ex: 'NF EN 927-6:2026-v1.2'
  generatedAt: ISODateString;
  generatedBy: string;
}

export type InformationHierarchyLevel =
  | 1 // DONNÉE MESURÉE (RAW)
  | 2 // RÉSULTAT CALCULÉ (COMPUTED)
  | 3 // CONSTAT FACTUEL
  | 4 // TENDANCE OBSERVÉE
  | 5 // INTERPRÉTATION POSSIBLE
  | 6; // CONCLUSION ÉTAYÉE

export interface FactualFinding {
  id: string;
  level: InformationHierarchyLevel;
  familyId: MeasurementFamilyId;
  title: string;
  description: string;
  metricKey?: string;
  initialValue?: number | string | null;
  finalValue?: number | string | null;
  deltaValue?: number | string | null;
  unit?: string;
  confidence: 'CERTAIN' | 'HIGH';
}

export type TrendDirection =
  | 'INCREASING'
  | 'DECREASING'
  | 'STABLE'
  | 'NON_MONOTONE'
  | 'RUPTURE'
  | 'INSUFFICIENT_DATA';

export interface TrendFinding {
  id: string;
  level: 4; // TENDANCE OBSERVÉE
  familyId: MeasurementFamilyId;
  metric: string;
  direction: TrendDirection;
  title: string;
  factualDescription: string;
  intermediatePointsCount: number;
  isMonotone: boolean;
}

export interface InterpretationFinding {
  id: string;
  level: 5; // INTERPRÉTATION POSSIBLE
  familyId: MeasurementFamilyId;
  title: string;
  hypothesis: string;           // Ex: "Cette évolution peut être compatible avec une modification de l'état de surface..."
  caveat: string;               // Ex: "⚠ Aucun mécanisme de dégradation n'est démontré par cette seule mesure."
  provenance: 'LAB_HYPOTHESIS' | 'DESCRIPTIVE_CORRELATION';
  correlations?: string[];      // Évolutions concomitantes
}

export interface SystemComparisonItem {
  batchId: string;
  batchReference: string;
  productReference?: string;
  woodSpecies?: string;
  manufacturerOrSupplier?: string;
  coatingSystem?: string;
  panelCount: number;
  activePanelsCount: number;
  // Métriques COMPUTED à l'étape donnée
  color?: {
    meanDeltaE: number | null;
    meanDeltaL: number | null;
    meanDeltaA: number | null;
    meanDeltaB: number | null;
    stdDevDeltaE: number | null;
  };
  gloss?: {
    meanInitialGU: number | null;
    meanCurrentGU: number | null;
    meanDeltaGloss: number | null;
    glossRetentionPercent: number | null;
    retentionCalculable: boolean;
    reasonIfUncalculable?: string;
    stdDevGloss: number | null;
    cvPercent: number | null;
  };
  persoz?: {
    meanInitialSeconds: number | null;
    meanCurrentSeconds: number | null;
    deltaSeconds: number | null;
    persozDeltaPercent: number | null;
    stdDevSeconds: number | null;
    cvPercent: number | null;
  };
  observations?: {
    summary: string;
    blisteringRating: number;
    flakingRating: number;
    crackingRating: number;
    chalkingRating: number;
    hasRecordedData: boolean;
  };
  isComplete: boolean;
  notes?: string;
}

export interface DescriptiveRanking {
  familyId: MeasurementFamilyId;
  metric: string;
  metricLabel: string;
  lowestBatchRef?: string;
  lowestValue?: number;
  highestBatchRef?: string;
  highestValue?: number;
  factualStatement: string;
}

export interface ComparisonResult {
  stageId: string;
  stageName: string;
  exposureHours: number;
  items: SystemComparisonItem[];
  rankings: DescriptiveRanking[];
  incompatibilities: string[];
  limitations: string[];
}

export type AnalysisReviewStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'REVIEWED'
  | 'APPROVED'
  | 'REJECTED';

export interface AnalysisReview {
  status: AnalysisReviewStatus;
  reviewedBy?: string;
  reviewedAt?: ISODateString;
  reviewerComment?: string;
  approvedBy?: string;
  approvedAt?: ISODateString;
  humanEditedText?: string;
  isHumanModified: boolean;
}

export interface QUVAnalysisResult {
  id: string;
  metadata: {
    trialId: string;
    trialReference: string;
    analysisVersion: string;     // '1.0.0'
    calculationVersion: string;  // Issue de COMPUTED
    ruleSetVersion: string;      // Issue du ScientificRuleSet
    generatedAt: ISODateString;
    generatedBy: string;
  };
  scope: {
    referenceStageId: string;   // ex: T0
    targetStageId: string;      // ex: 2016 h
    batchIds: string[];
    panelIds?: string[];
    measurementFamilies: MeasurementFamilyId[];
    studyCriteriaGlossRetentionPercent?: number; // ex: 50%
  };
  rawSummary: {
    hasColorRaw: boolean;
    hasGlossRaw: boolean;
    hasPersozRaw: boolean;
    hasObservationsRaw: boolean;
  };
  computedSummary: {
    calculationVersion: string;
    calculatedAt?: string;
  };
  factualFindings: FactualFinding[];
  trends: TrendFinding[];
  anomalies: AnalysisAnomaly[];
  comparisons: ComparisonResult[];
  interpretations: InterpretationFinding[];
  crossFamilyAnalysis?: string;
  limitations: string[];
  protocolAdaptationsMention: string[];
  technicalSynthesis: string;
  normativeConclusionStatus:
    | 'NON_EVALUEE'
    | 'PENDING_HUMAN_REVIEW'
    | 'APPROVED';
  review: AnalysisReview;
}

export type AnalysisEventType =
  | 'GENERATE_ANALYSIS'
  | 'GENERATE_SYNTHESIS'
  | 'GENERATE_COMPARISON'
  | 'GENERATE_ANOMALY_REPORT'
  | 'EDIT_GENERATED_ANALYSIS'
  | 'APPROVE_ANALYSIS'
  | 'REJECT_ANALYSIS';

export interface AnalysisAuditEvent {
  id: UUID;
  trialId: UUID;
  eventType: AnalysisEventType;
  timestamp: ISODateString;
  operatorId: string;
  analysisVersion: string;
  calculationVersion: string;
  ruleSetVersion: string;
  details?: Record<string, unknown>;
}
