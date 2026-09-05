/**
 * QUV-Lab — Modèle de Données & Types du Moteur Scientifique
 * Schéma v1.1.0 — 5 Niveaux Indépendants, Référentiel Découplé & NF EN 927-6
 */

export type UUID = string;
export type ISODateString = string;

// ============================================================================
// 1. LES 5 NIVEAUX FONDAMENTAUX INDÉPENDANTS
// ============================================================================

/** Niveau 2 : Validité intrinsèque d'une mesure élémentaire */
export type ReadingValidity =
  | 'VALID'    // Valeur numérique finie et compatible avec le domaine physique
  | 'SUSPECT'  // Valeur numériquement valide mais atypique statistiquement (RAW conservé)
  | 'INVALID'  // NaN, Infini, non-numérique, hors domaine physique
  | 'MISSING'; // Mesure attendue non renseignée

/** Niveau 3 : Statut de qualité d'un relevé ou d'une série */
export type QualityStatus =
  | 'GOOD'
  | 'ACCEPTABLE'
  | 'WARNING'
  | 'INVALID';

/** Niveau 4 : Statut de conformité du protocole de mesure */
export type ProtocolComplianceStatus =
  | 'STANDARD'            // Conforme aux paramètres par défaut de la référence normative
  | 'ADAPTED_JUSTIFIED'   // Diffère du standard avec justification technique enregistrée
  | 'ADAPTED_UNJUSTIFIED' // Diffère du standard SANS justification (bloquant)
  | 'INCOMPLETE'          // Paramétrage incomplet
  | 'INVALID';            // Valeurs incohérentes

/** Niveau 5 : Conclusion normative formelle */
export type NormativeComplianceEvaluation =
  | 'CONFORME'
  | 'NON_CONFORME'
  | 'NON_EVALUEE'; // Par défaut dans le moteur scientifique pur

/** Source et origine explicite de la règle scientifique (PROMPT 5 v1.2) */
export type ScientificRuleOrigin =
  | 'NORMATIVE_REQUIREMENT' // Exigence stricte issue d'une norme officielle (ex: NF EN 927-6 clauses 6.3.2, 6.3.3)
  | 'LAB_RECOMMENDATION'    // Recommandation ou procédure interne du laboratoire (ex: Dureté Persoz ISO 1522)
  | 'METROLOGICAL_CHOICE'   // Choix méthodologique métrologique (ex: Écart-type échantillon n-1, seuils de dispersion)
  | 'PROTOCOL_ADAPTATION';  // Dérogation / adaptation locale configurée par l'opérateur avec justification

/** Alias de compatibilité avec v1.1 */
export type RuleSource = ScientificRuleOrigin | 'NORMATIVE' | 'LABORATORY' | 'PROJECT' | 'USER_CUSTOM';

// ============================================================================
// 2. TYPES D'ESSAI, STATUTS ET GESTION DE VERROUILLAGE
// ============================================================================

export type TrialStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'NEEDS_REVIEW'
  | 'COMPLETED'
  | 'ARCHIVED';

export type ConfigurationStatus = 'EDITABLE' | 'LOCKED';
export type StageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'READY_FOR_VALIDATION' | 'VALIDATED' | 'INACTIVE';
export type PanelStatus = 'ACTIVE' | 'EXCLUDED';
export type AcquisitionStatus = 'EMPTY' | 'PARTIAL' | 'COMPLETE' | 'WARNING' | 'ERROR';
export type AlertSeverity = 'INFO' | 'WARNING' | 'BLOCKING';

export type MeasurementFamilyId = 'COLOR' | 'GLOSS' | 'PERSOZ' | 'ADHESION' | 'OBSERVATIONS' | string;
export type StandardDeviationMethod = 'SAMPLE' | 'POPULATION';

export type ScientificAlertCode =
  | 'MEASUREMENT_COUNT_MISMATCH'
  | 'MEASUREMENT_MISSING'
  | 'MEASUREMENT_INVALID'
  | 'MEASUREMENT_SUSPECT'
  | 'PROTOCOL_ADAPTED'
  | 'PROTOCOL_ADAPTATION_UNJUSTIFIED'
  | 'GEOMETRY_MISMATCH'
  | 'STATISTICAL_WARNING'
  | 'REFERENCE_STAGE_MISSING'
  | 'REFERENCE_VALUE_ZERO'
  | 'PHYSICAL_BOUNDS_EXCEEDED'
  | 'CALCULATION_UNAVAILABLE';

export interface MeasurementAlert {
  id: string;
  severity: AlertSeverity;
  code: ScientificAlertCode | string;
  message: string;
  familyId: MeasurementFamilyId;
  stageId?: UUID;
  panelId?: UUID;
  pointIndex?: number;
  seriesIndex?: number;
}

export interface ComputationMetadata {
  calculationVersion: string;
  calculatedAt: ISODateString;
}

// ============================================================================
// 3. RÉFÉRENTIEL SCIENTIFIQUE DÉCOUPLÉ & CONFIGURATION DU PROTOCOLE
// ============================================================================

export type MeasurementCountMode = 'STANDARD_DEFAULT' | 'CUSTOM_JUSTIFIED';

export interface MeasurementProtocolDefinition {
  familyId: MeasurementFamilyId;
  origin: ScientificRuleOrigin;
  standardReference: string;
  clause?: string;
  rationale?: string;
  standardRecommendedCount?: number;
  configuredCount?: number;
  isAdapted: boolean;
  justification?: string;
  deviationReason?: string;
  configuredBy: string;
  configuredAt: ISODateString;
}

export interface MeasurementCountConfiguration {
  familyId: MeasurementFamilyId;
  mode: MeasurementCountMode;
  origin?: ScientificRuleOrigin;
  standardReference?: string;
  clause?: string;
  rationale?: string;
  standardRecommendedCount: number;
  configuredCount: number;
  deviationFromStandard: boolean;
  justification?: string;
  deviationReason?: string;
  configuredBy: string;
  configuredAt: ISODateString;
  ruleSource: RuleSource;
}

export interface MeasurementSeriesConfiguration {
  familyId: MeasurementFamilyId;
  mode: MeasurementCountMode;
  origin?: ScientificRuleOrigin;
  standardReference?: string;
  clause?: string;
  rationale?: string;
  standardConfiguration: {
    seriesCount: number;
    readingsPerSeries: number;
    totalReadings: number;
    orientations?: string[];
    description?: string;
  };
  configuredConfiguration: {
    seriesCount: number;
    readingsPerSeries: number;
    totalReadings: number;
    orientations?: string[];
    description?: string;
  };
  justification?: string;
  deviationReason?: string;
  deviationFromStandard: boolean;
  configuredBy: string;
  configuredAt: ISODateString;
  ruleSource: RuleSource;
}

export interface ScientificRuleSet {
  id: UUID;
  standardReference: string; // "NF EN 927-6"
  version: string;           // "2018 / v1.1"
  effectiveDate?: ISODateString;
  measurementConfigurations: Record<MeasurementFamilyId, MeasurementCountConfiguration>;
  seriesConfigurations?: Record<MeasurementFamilyId, MeasurementSeriesConfiguration>;
  colorimetry: {
    illuminant: 'D65' | string;
    observer: '10°' | '2°' | string;
    geometry: '45_0' | 'D_8' | string;
    differenceFormula: 'CIE_1976' | 'CIEDE_2000' | string;
    physicalBounds: {
      minL: number;
      maxL: number;
      minA: number;
      maxA: number;
      minB: number;
      maxB: number;
    };
  };
  statisticalRules: {
    stdDevMethod: StandardDeviationMethod;
    glossGeometryDefault: '60' | '20' | '85' | string;
    maxGlossDispersionPercent?: number;
    maxColorStdDev?: number;
  };
  sourceReference: string;
  status: 'VERIFIED' | 'TO_BE_CONFIRMED';
  validatedBy?: string;
  validatedAt?: ISODateString;
}

// ============================================================================
// 4. DONNÉES BRUTES (RAW) & CALCULÉES (COMPUTED) PAR FAMILLE
// ============================================================================

// --- CONTRÔLE QUALITÉ DU RELEVÉ ---
export interface QualityAssessment {
  expectedCount: number;
  actualCount: number;
  validCount: number;
  suspectCount: number;
  invalidCount: number;
  missingCount: number;
  completenessPercent: number;
  status: QualityStatus;
  warnings: string[];
}

// --- COULEUR ---
export interface ColorRawPoint {
  pointIndex: number;
  L: number | null;
  a: number | null;
  b: number | null;
}

export interface ColorRawData {
  readings: ColorRawPoint[];
  instrumentMetadata?: {
    instrumentId?: string;
    illuminant?: string;
    observer?: string;
    geometry?: string;
  };
}

export interface ColorComputedData {
  pointsCount: number;
  validCount: number;
  meanL: number | null;
  meanA: number | null;
  meanB: number | null;
  stdDevL: number | null;
  stdDevA: number | null;
  stdDevB: number | null;
  chromaC: number | null;
  hueH: number | null;
  referenceStageId?: UUID | null;
  initialMeanL?: number | null;
  initialMeanA?: number | null;
  initialMeanB?: number | null;
  deltaL: number | null;
  deltaA: number | null;
  deltaB: number | null;
  deltaE: number | null;
  deltaC?: number | null;
  deltaH?: number | null;
  criterionCategory?: string;
  qualityAssessment: QualityAssessment;
  protocolStatus: ProtocolComplianceStatus;
  computation: ComputationMetadata;
}

// --- BRILLANCE ---
export interface GlossRawPoint {
  pointIndex: number;
  value: number | null;
}

export interface GlossMeasurementSeries {
  seriesIndex: number;
  orientation: 'GRAIN_DIRECTION' | 'PERPENDICULAR_DIRECTION' | string;
  readings: GlossRawPoint[];
}

export interface GlossRawData {
  series: GlossMeasurementSeries[];
  mode?: 'NORMATIVE_4' | 'SIMPLIFIED_2' | 'NORMATIVE_6';
  instrumentMetadata?: {
    instrumentId?: string;
    geometry?: '60' | '20' | '85' | string;
  };
}

export interface GlossComputedData {
  totalReadings: number;
  validCount: number;
  glossMode?: 'NORMATIVE_4' | 'SIMPLIFIED_2' | 'NORMATIVE_6';
  initialMeanGloss?: number | null;
  initialStdDevGloss?: number | null;
  meanGloss: number | null;
  stdDevGloss: number | null;
  seriesStats: {
    seriesIndex: number;
    orientation: string;
    mean: number | null;
    stdDev: number | null;
    validCount: number;
  }[];
  referenceStageId?: UUID | null;
  deltaGloss: number | null;
  deltaGlossStdDev?: number | null;
  retentionRatePercent: number | null;
  infiperfAlert?: { active: boolean; message: string; source: 'INFIPERF / FCBA'; severity: 'WARNING' };
  criterionCategory?: string;
  qualityAssessment: QualityAssessment;
  protocolStatus: ProtocolComplianceStatus;
  computation: ComputationMetadata;
}

// --- PERSOZ (FAMILLE COMPLÉMENTAIRE) ---
export interface PersozRawPoint {
  pointIndex: number;
  dampingTimeSeconds: number | null;
}

export interface PersozRawData {
  readings: PersozRawPoint[];
  unit: 'SECONDS' | 'OSCILLATIONS';
  instrumentMetadata?: {
    instrumentId?: string;
    temperatureCelsius?: number;
    relativeHumidityPercent?: number;
  };
}

export interface PersozComputedData {
  pointsCount: number;
  validCount: number;
  initialMeanDampingTime?: number | null;
  meanDampingTime: number | null;
  stdDevDampingTime: number | null;
  coefficientOfVariationPercent: number | null;
  referenceStageId?: UUID | null;
  deltaDampingTime: number | null;
  relativeHardnessVariationPercent: number | null;
  criterionCategory?: string;
  qualityAssessment: QualityAssessment;
  protocolStatus: ProtocolComplianceStatus;
  computation: ComputationMetadata;
}

// --- ADHÉRENCE — QUADRILLAGE (NF EN ISO 2409:2020) ---
export type AdhesionClassRating = 0 | 1 | 2 | 3 | 4 | 5;

export interface AdhesionRawData {
  adhesionClass: AdhesionClassRating | number | null; // 0 à 5
  observation?: string;
  measurementDateTime: ISODateString;
  applicationDateTime?: string; // Récupéré de batch.applicationDate
  coatingThicknessMicrons?: number | null;
  gridSpacingMm: number; // 1, 2, 3 mm selon NF EN ISO 2409
  bladeType?: string; // 'SINGLE_BLADE_6_CUTS' | 'MULTI_BLADE' | string
  tapeType?: string; // 'IEC 60454-2' | string
  conditioning?: string; // ex: "23°C / 50% HR"
  requiredMinimumDelayHours: number; // ex: 168 h (7 jours)
  elapsedTimeHours?: number | null;
  delayStatus?: 'CONFORME' | 'INSUFFICIENT_DELAY' | 'INVALID_DATE' | 'MISSING_APPLICATION_DATE';
  mediaId?: UUID | null;
  operatorId?: string;
  normReference: string; // "NF EN ISO 2409:2020"
}

export interface AdhesionComputedData {
  adhesionClass: number | null;
  classDescription: string;
  initialAdhesionClass?: number | null;
  deltaAdhesionClass?: number | null; // Variation d'adhérence vs T0
  elapsedTimeHours: number | null;
  delayCompliance: 'CONFORME' | 'NON_CONFORME' | 'NON_EVALUE';
  gridSpacingUsedMm: number;
  criterionCategory?: string;
  qualityAssessment: QualityAssessment;
  protocolStatus: ProtocolComplianceStatus;
  computation: ComputationMetadata;
}

// --- OBSERVATIONS VISUELLES (NORMES ISO 4628 / ISO 2409) ---
export type VisualObservationCategory =
  | 'BLISTERING'        // Cloquage ISO 4628-2
  | 'FLAKING'           // Écaillage ISO 4628-5
  | 'CRACKING'          // Craquelage ISO 4628-4
  | 'CHALKING'          // Farinage ISO 4628-6
  | 'GENERAL_APPEARANCE'// Aspect général
  | 'CROSS_CUT_ADHESION'// Adhérence quadrillage ISO 2409
  | 'OTHER_DEFECT';     // Autres défauts configurés

export interface VisualObservationItem {
  category: VisualObservationCategory;
  categoryLabel: string;
  rating: string | number; // 0, 1, 2, 3, 4, 5 ou classe ISO
  status: 'CONFORME' | 'NON_CONFORME' | 'OBSERVE' | 'AUCUN';
  comment?: string;
  photoId?: string;
}

export interface VisualObservationsRawData {
  observations: VisualObservationItem[];
  overallNotes?: string;
  assessedBy?: string;
  assessedAt?: ISODateString;
}

export interface VisualObservationsComputedData {
  totalEvaluated: number;
  defectsCount: number;
  maxRating: number;
  summary: string;
  qualityAssessment: QualityAssessment;
  protocolStatus: ProtocolComplianceStatus;
  computation: ComputationMetadata;
}

// ============================================================================
// 5. QUALITÉ MULTI-NIVEAUX & AGRÉGATIONS
// ============================================================================

export interface PanelQualityAssessment {
  panelId: UUID;
  stageId: UUID;
  families: {
    familyId: MeasurementFamilyId;
    status: QualityStatus;
    protocolStatus: ProtocolComplianceStatus;
    alerts: MeasurementAlert[];
  }[];
  globalStatus: QualityStatus;
  assessedAt: ISODateString;
  calculationVersion: string;
}

export interface StageQualityAssessment {
  stageId: UUID;
  panelsEvaluated: number;
  panelsComplete: number;
  panelsWithWarnings: number;
  panelsInvalid: number;
  familyAssessments: Record<MeasurementFamilyId, QualityStatus>;
  globalStatus: QualityStatus;
  calculationVersion: string;
}

export interface TrialQualityAssessment {
  trialId: UUID;
  stagesEvaluated: number;
  protocolCompliance: ProtocolComplianceStatus;
  globalQuality: QualityStatus;
  blockingAlertsCount: number;
  warningAlertsCount: number;
  normativeConclusion: NormativeComplianceEvaluation;
  calculatedAt: ISODateString;
  calculationVersion: string;
}

export interface BatchAggregationStats {
  batchId: UUID;
  stageId: UUID;
  familyId: MeasurementFamilyId;
  panelsCount: number;
  activePanelsCount: number;
  // Statistiques inter-panneaux
  interPanelMean: number | null;
  interPanelStdDev: number | null;
  // Dérivées moyennes du lot
  meanDeltaE?: number | null;
  meanDeltaGloss?: number | null;
  meanGlossRetentionPercent?: number | null;
  computation: ComputationMetadata;
}

// ============================================================================
// 6. MODÈLE DU RAPPORT SCIENTIFIQUE & TRAÇABILITÉ DES VERSIONS (PROMPT 7)
// ============================================================================

export type ScientificReportStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'REVIEWED'
  | 'APPROVED';

export interface ScientificReportMetadata {
  reportId: string;
  trialId: string;
  generatedAt: ISODateString;
  generatedBy: string;
  reportVersion: string;
  schemaVersion: string;
  calculationVersion: string;
  scientificRuleSetId: string;
}

export interface ScientificReportReviewComment {
  id: string;
  reportId: string;
  author: string;
  createdAt: ISODateString;
  text: string;
  category: 'GENERAL' | 'ANOMALY' | 'PROTOCOL' | 'CALCULATION' | 'CONCLUSION';
}

export interface ScientificReport {
  id: string;
  metadata: ScientificReportMetadata;
  status: ScientificReportStatus;
  title: string;
  executiveSummary: string;
  normativeReference: string;
  protocolStatus: ProtocolComplianceStatus;
  isComplete: boolean;
  missingCriticalElements: string[];
  sections: {
    identification: string;
    studyPurpose: string;
    normativeReferences: string;
    materialsAndBatches: string;
    panelsDefinition: string;
    experimentalConditions: string;
    exposureSchedule: string;
    measurementPlan: string;
    colorResults: string;
    glossResults: string;
    persozResults: string;
    adhesionResults?: string;
    visualObservations: string;
    kineticsAnalysis: string;
    qualityControl: string;
    deviationsAndAdaptations: string;
    calculationTraceability: string;
    scientificSynthesis: string;
    factualConclusion: string;
  };
  annexes: {
    annexA_RawDataSummary: string;
    annexB_ComputedResultsSummary: string;
    annexC_QualityAssessmentSummary: string;
    annexD_ProtocolAdaptationsSummary: string;
    annexE_AuditTrailSummary: string;
    annexF_ScientificVersionSummary: string;
  };
  reviewComments: ScientificReportReviewComment[];
  reviewedBy?: string;
  reviewedAt?: ISODateString;
  approvedBy?: string;
  approvedAt?: ISODateString;
}
