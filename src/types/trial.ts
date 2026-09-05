/**
 * QUV-Lab — Modèle de Données Racine (Trial & Référentiel Permanent)
 * v1.1.0 — Architecture Essai, Référentiel Permanent, Calendrier 168h & Traçabilité
 */

import {
  UUID,
  ISODateString,
  TrialStatus,
  ConfigurationStatus,
  StageStatus,
  PanelStatus,
  AcquisitionStatus,
  MeasurementFamilyId,
  MeasurementAlert,
  ScientificRuleSet,
  MeasurementCountConfiguration,
  MeasurementSeriesConfiguration,
  ComputationMetadata,
  ScientificReport
} from './scientific';

export interface TrialMetadata {
  reference: string;                 // ex: "QUV-2026-042"
  orderNumber?: string;              // Commande ex: "CO-VAN2026-001"
  reportNumber?: string;             // Rapport d'essai ex: "RA-VAN2026-001"
  title?: string;
  projectOrClient?: string;
  coatingSystemDescription?: string;
  substrateDescription?: string;
  createdBy: string;
  generalNotes?: string;
}

export type ExposureStageType =
  | 'INITIAL_PRE_EXPOSURE'
  | 'INTERMEDIATE_DURING_EXPOSURE'
  | 'FINAL_POST_EXPOSURE';

/**
 * Orientation du fil du bois — Liste contrôlée (GATE 2.1)
 */
export type WoodGrainOrientation =
  | 'Quartier'
  | 'Faux quartier'
  | 'Dosse'
  | 'Sur quartier (NF EN 927-6)'
  | 'Sur dosse'
  | 'QUARTER_SAWN'
  | 'SLASH_SAWN'
  | 'MIXED'
  | 'STANDARD'
  | 'QUARTER'
  | 'FALSE_QUARTER'
  | 'SLASH';

/**
 * Face d'exposition UV — Liste contrôlée (GATE 2.1)
 */
export type ExposureFace =
  | 'Face externe'
  | 'Face interne'
  | 'Face avant'
  | 'Face avant (fil longitudinal)'
  | 'Face radiale (fil longitudinal)'
  | 'Face tangentielle'
  | 'EXTERNAL_FACE'
  | 'INTERNAL_FACE';

/**
 * Rôle explicite de l'éprouvette (GATE 2.1 & 2.2)
 * T = Témoin non exposé (obscurité)
 * E1, E2, E3 = Éprouvettes exposées au vieillissement UV
 */
export type SpecimenRole =
  | 'WITNESS'
  | 'EXPOSED_1'
  | 'EXPOSED_2'
  | 'EXPOSED_3'
  | 'EXPOSED_CUSTOM';

export type SpecimenRoleCode = 'T' | 'E1' | 'E2' | 'E3' | 'E';

export interface ProjectDimensions {
  lengthMm?: number;                  // ex: 150
  widthMm?: number;                   // ex: 75
  thicknessMm?: number;               // ex: 15
  unit: 'mm' | 'cm';
}

export interface CommonCharacteristics {
  dimensions?: ProjectDimensions;     // Dimensions uniques et communes au niveau PROJET
  substrateNature?: string;          // ex: "Bois massif", "Panneau dérivé", "Plaque témoin"
  materialType?: string;             // ex: "Pin sylvestre (NF EN 927-6)", "Chêne", "Mélèze"
  woodGrainOrientation?: WoodGrainOrientation; // Optionnel au niveau projet
  preparationNotes?: string;         // ex: "Ponçage P120, dépoussiérage, stabilisation 20°C/65% HR"
  substratePreparation?: string;
  conditioningNotes?: string;        // ex: "Stabilisation 7 jours selon NF EN 927-6 §5"
  generalProtocolNotes?: string;
}

export interface ScheduledCycleCheckpoint {
  cycleIndex: number;                // Entier strict ∈ [1..12]
  label?: string;
  mandatory: boolean;
}

export interface ExposureScheduleConfig {
  cycleDurationHours: 168;
  maxCycles: 12;
  initialStage: {
    exposureHours: 0;
    mandatory: true;
    label: string;
  };
  intermediateCycles: ScheduledCycleCheckpoint[];
  finalCycle: ScheduledCycleCheckpoint;
}

export interface ExposureStage {
  id: UUID;
  trialId: UUID;
  cycleIndex: number;
  stageType: ExposureStageType;
  name: string;
  scheduledExposureHours: number;
  actualExposureHours?: number;
  scheduledAt?: ISODateString;
  measuredAt?: ISODateString;
  status: StageStatus;
  validatedBy?: string;
  validatedAt?: ISODateString;
  notes?: string;
}

export interface PanelDefinition {
  id: UUID;
  batchId: UUID;
  index: number;                     // 1..4
  label: string;                     // ex: "T", "E1", "E2", "E3" ou "P01"
  role?: SpecimenRole;               // Rôle explicite dans le modèle
  roleCode?: SpecimenRoleCode;       // Code rôle explicite 'T' | 'E1' | 'E2' | 'E3'
  grainOrientation?: WoodGrainOrientation; // Orientation du fil individuelle (Quartier, Faux quartier, Dosse)
  exposureFace?: ExposureFace;        // Face d'exposition individuelle (Face externe, Face interne)
  status: PanelStatus;
  position?: string;
  exclusionReason?: string;
  excludedAt?: ISODateString;
  excludedBy?: string;
  notes?: string;
}

export interface BatchDefinition {
  id: UUID;
  trialId: UUID;
  reference: string;                 // ex: "LOT XG2F" ou "XX1C"
  orderIndex: number;
  woodSpecies?: string;              // Essence spécifique au LOT (ex: "Pin sylvestre standardisé")
  productReference?: string;         // Produit appliqué sur le LOT
  coatingSystem?: string;            // Système appliqué sur le LOT
  grainOrientation?: WoodGrainOrientation; // Orientation du fil spécifique au LOT
  exposureFace?: ExposureFace;        // Face d'exposition spécifique au LOT
  manufacturerOrSupplier?: string;   // ex: "Fabricant A"
  coatCount?: number;                // ex: 3
  substratePreparation?: string;     // ex: "Ponçage grain P120"
  applicationMethod?: string;        // ex: "Pinceau", "Pistolet"
  applicationConditions?: string;    // ex: "21°C, 55% HR"
  applicationDate?: string;          // ex: "2026-08-15"
  dryingOrConditioningTime?: string; // ex: "7 jours à 23°C/50% HR"
  // Épaisseur sèche du revêtement (NF EN ISO 2409 / Référentiel)
  dryFilmThicknessMicrons?: number | null; // ex: 185
  dryFilmThicknessUnit?: 'µm' | 'um';
  dryFilmThicknessMeasurementDate?: string;
  dryFilmThicknessOperator?: string;
  dryFilmThicknessMethod?: string; // ex: "Peigne de jauge", "Magnétique ISO 2808", "Micrométrique"
  dryFilmThicknessDeterminationsCount?: number;
  dryFilmThicknessNotes?: string;
  batchNotes?: string;
  panels: PanelDefinition[];         // Exactement 4 éprouvettes (T, E1, E2, E3)
}

export interface FamilyProtocolConfig {
  familyId: MeasurementFamilyId;
  enabled: boolean;
  countConfig?: MeasurementCountConfiguration;
  seriesConfig?: MeasurementSeriesConfiguration;
  instrumentParameters?: Record<string, unknown>;
  customSettings?: Record<string, unknown>;
}

export interface TrialProtocolConfig {
  standardReference: string;
  activeFamilies: MeasurementFamilyId[];
  familyConfigs: Record<MeasurementFamilyId, FamilyProtocolConfig>;
}

export interface AcquisitionTrace {
  createdBy: string;
  createdAt: ISODateString;
  lastModifiedBy?: string;
  lastModifiedAt?: ISODateString;
  source: 'MANUAL_KEYPAD' | 'INSTRUMENT_IMPORT' | 'FILE_IMPORT';
}

export interface PanelAcquisitionRecord<TRaw = unknown, TComputed = unknown> {
  id: UUID;
  trialId: UUID;
  stageId: UUID;
  batchId: UUID;
  panelId: UUID;
  familyId: MeasurementFamilyId;
  raw: TRaw;
  computed: TComputed;
  status: AcquisitionStatus;
  alerts: MeasurementAlert[];
  trace: AcquisitionTrace;
  mediaIds: UUID[];
}

export type MediaStatus = 'ACTIVE' | 'ARCHIVED';

export interface BaseMediaReference {
  id: UUID;
  trialId: UUID;
  status?: MediaStatus; // 'ACTIVE' | 'ARCHIVED' (par défaut ACTIVE)
  storageKey: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  capturedAt: ISODateString;
  capturedBy: string;
  caption?: string;
  replacedAt?: ISODateString;
  replacedBy?: string;
  replacementMediaId?: UUID;
}

export interface PhotoReference extends BaseMediaReference {
  type: 'PHOTO';
  panelId: UUID;
  stageId: UUID;
}

export interface DocumentReference extends BaseMediaReference {
  type: 'DOCUMENT';
  panelId?: UUID;
  stageId?: UUID;
}

export type MediaReference = PhotoReference | DocumentReference;

export interface AuditEvent {
  id: UUID;
  trialId: UUID;
  timestamp: ISODateString;
  operatorId: string;
  action: string;
  entityType: 'TRIAL' | 'BATCH' | 'PANEL' | 'STAGE' | 'ACQUISITION' | 'CONFIG' | 'PROTOCOL';
  entityId: string;
  details?: Record<string, unknown>;
}

export interface Trial {
  id: UUID;
  schemaVersion: string;
  createdAt: ISODateString;
  updatedAt: ISODateString;
  metadata: TrialMetadata;
  commonCharacteristics?: CommonCharacteristics;
  status: TrialStatus;
  configurationStatus: ConfigurationStatus;
  config: TrialProtocolConfig;
  scheduleConfig: ExposureScheduleConfig;
  stages: ExposureStage[];
  batches: BatchDefinition[];
  acquisitions: Record<string, PanelAcquisitionRecord>;
  auditTrail: AuditEvent[];
  mediaReferences: MediaReference[];
  reports?: ScientificReport[];
}
