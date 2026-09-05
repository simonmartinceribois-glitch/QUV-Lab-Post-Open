/**
 * QUV-Lab — Moteur Scientifique Adhérence au Quadrillage (NF EN ISO 2409:2020)
 * Déterministe, pure, conserve RAW intact et génère COMPUTED + alertes métrologiques.
 */

import {
  AdhesionRawData,
  AdhesionComputedData,
  AdhesionClassRating,
  MeasurementAlert,
  QualityAssessment,
  ProtocolComplianceStatus,
  MeasurementCountConfiguration,
  ScientificRuleSet,
  UUID
} from '../types/scientific';

export const ADHESION_CALCULATION_VERSION = '1.2.0';
export const ADHESION_NORM_REFERENCE = 'NF EN ISO 2409:2020';

/**
 * Définition officielle des 6 classes d'adhérence selon la NF EN ISO 2409:2020
 */
export const ISO2409_CLASSES: Record<
  number,
  {
    rating: AdhesionClassRating;
    shortLabel: string;
    description: string;
    affectedAreaPercent: string;
    appearance: string;
  }
> = {
  0: {
    rating: 0,
    shortLabel: 'Classe 0 (0 % décollement)',
    description: 'Les bords des incisions sont parfaitement lisses ; aucun des carrés du quadrillage ne s\'est détaché.',
    affectedAreaPercent: '0 %',
    appearance: 'Bords parfaitement nets et lisses'
  },
  1: {
    rating: 1,
    shortLabel: 'Classe 1 (≤ 5 % décollement)',
    description: 'Détachement de petits éclats de revêtement aux intersections des incisions. Au plus 5 % de la surface du quadrillage est affectée.',
    affectedAreaPercent: '≤ 5 %',
    appearance: 'Petits éclats aux intersections'
  },
  2: {
    rating: 2,
    shortLabel: 'Classe 2 (5 % à 15 % décollement)',
    description: 'Le revêtement s\'est écaillé le long des bords et/ou aux intersections des incisions. Plus de 5 % mais pas plus de 15 % de la surface est affectée.',
    affectedAreaPercent: '> 5 % et ≤ 15 %',
    appearance: 'Écaillage le long des bords / intersections'
  },
  3: {
    rating: 3,
    shortLabel: 'Classe 3 (15 % à 35 % décollement)',
    description: 'Le revêtement s\'est écaillé le long des bords des incisions en larges bandes et/ou des carrés se sont détachés en tout ou partie. Plus de 15 % mais pas plus de 35 % de la surface est affectée.',
    affectedAreaPercent: '> 15 % et ≤ 35 %',
    appearance: 'Larges bandes écaillées et/ou carrés partiels'
  },
  4: {
    rating: 4,
    shortLabel: 'Classe 4 (35 % à 65 % décollement)',
    description: 'Le revêtement s\'est écaillé le long des bords des incisions en larges bandes et/ou plusieurs carrés se sont détachés en tout ou partie. Plus de 35 % mais pas plus de 65 % de la surface est affectée.',
    affectedAreaPercent: '> 35 % et ≤ 65 %',
    appearance: 'Importants décollements en larges bandes'
  },
  5: {
    rating: 5,
    shortLabel: 'Classe 5 (> 65 % décollement)',
    description: 'Tout degré d\'écaillage qui ne peut même pas être classé en classe 4 (décollement supérieur à 65 %).',
    affectedAreaPercent: '> 65 %',
    appearance: 'Décollement quasi-total ou total'
  }
};

/**
 * Détermination de l'espacement de quadrillage applicable selon NF EN ISO 2409:2020
 * Sur support bois (support tendre / anisotrope) :
 * - Épaisseur ≤ 60 µm : 2 mm (ou 1 mm sur support dur, 2 mm recommandé pour bois)
 * - Épaisseur 61 à 120 µm : 2 mm
 * - Épaisseur 121 à 250 µm : 3 mm
 * - Épaisseur > 250 µm : ≥ 3 mm ou Méthode par incision en X (ISO 16276-2)
 */
export function getApplicableGridSpacing(
  coatingThicknessMicrons?: number | null,
  isWoodOrSoftSubstrate: boolean = true
): {
  gridSpacingMm: number;
  cutsCount: number;
  thicknessCategory: string;
  rationale: string;
} {
  const thickness = coatingThicknessMicrons ?? 60; // Valeur par défaut si non spécifié

  if (thickness <= 60) {
    if (isWoodOrSoftSubstrate) {
      return {
        gridSpacingMm: 2,
        cutsCount: 6,
        thicknessCategory: '≤ 60 µm (Support Bois / Tendre)',
        rationale: 'NF EN ISO 2409 §5.2.2 : Espacement de 2 mm recommandé pour supports bois et tendres ≤ 60 µm (6 incisions dans chaque direction).'
      };
    } else {
      return {
        gridSpacingMm: 1,
        cutsCount: 6,
        thicknessCategory: '≤ 60 µm (Support Rigide)',
        rationale: 'NF EN ISO 2409 §5.2.2 : Espacement de 1 mm pour revêtements durs ≤ 60 µm.'
      };
    }
  } else if (thickness <= 120) {
    return {
      gridSpacingMm: 2,
      cutsCount: 6,
      thicknessCategory: '61 µm à 120 µm',
      rationale: 'NF EN ISO 2409 §5.2.2 : Espacement de 2 mm pour revêtements de 61 µm à 120 µm (tous supports).'
    };
  } else if (thickness <= 250) {
    return {
      gridSpacingMm: 3,
      cutsCount: 6,
      thicknessCategory: '121 µm à 250 µm',
      rationale: 'NF EN ISO 2409 §5.2.2 : Espacement de 3 mm pour revêtements de 121 µm à 250 µm.'
    };
  } else {
    return {
      gridSpacingMm: 3,
      cutsCount: 6,
      thicknessCategory: '> 250 µm (Forte épaisseur)',
      rationale: 'NF EN ISO 2409 §5.2.2 : Pour épaisseurs > 250 µm, espacement spécial ≥ 3 mm ou méthode d\'incision en croix X (ISO 16276-2).'
    };
  }
}

/**
 * Calcul et vérification automatique du délai entre application et mesure
 */
export function calculateDelayCompliance(
  applicationDateStr?: string,
  measurementDateStr?: string,
  requiredMinimumHours: number = 168
): {
  elapsedTimeHours: number | null;
  formattedElapsedTime: string;
  status: 'CONFORME' | 'INSUFFICIENT_DELAY' | 'INVALID_DATE' | 'MISSING_APPLICATION_DATE';
  complianceText: 'CONFORME' | 'DÉLAI INSUFFISANT' | 'DATE INVALIDE' | 'DATE NON RENSEIGNÉE';
  message: string;
} {
  if (!applicationDateStr || applicationDateStr.trim() === '') {
    return {
      elapsedTimeHours: null,
      formattedElapsedTime: 'Non déterminée',
      status: 'MISSING_APPLICATION_DATE',
      complianceText: 'DATE NON RENSEIGNÉE',
      message: 'Date d\'application du lot non renseignée. Veuillez renseigner la date d\'application dans la définition du lot.'
    };
  }

  const appTime = new Date(applicationDateStr).getTime();
  if (isNaN(appTime)) {
    return {
      elapsedTimeHours: null,
      formattedElapsedTime: 'Date invalide',
      status: 'INVALID_DATE',
      complianceText: 'DATE INVALIDE',
      message: 'Format de la date d\'application invalide.'
    };
  }

  const measureTime = measurementDateStr ? new Date(measurementDateStr).getTime() : Date.now();
  if (isNaN(measureTime)) {
    return {
      elapsedTimeHours: null,
      formattedElapsedTime: 'Date invalide',
      status: 'INVALID_DATE',
      complianceText: 'DATE INVALIDE',
      message: 'Format de la date de mesure invalide.'
    };
  }

  const diffMs = measureTime - appTime;
  if (diffMs < 0) {
    return {
      elapsedTimeHours: null,
      formattedElapsedTime: 'Antérieure à application',
      status: 'INVALID_DATE',
      complianceText: 'DATE INVALIDE',
      message: 'La date de mesure ne peut pas être antérieure à la date d\'application de la finition.'
    };
  }

  const elapsedHours = diffMs / (1000 * 60 * 60);
  const days = Math.floor(elapsedHours / 24);
  const remainingHours = Math.floor(elapsedHours % 24);
  const minutes = Math.floor((elapsedHours * 60) % 60);

  const formattedElapsedTime =
    days > 0
      ? `${days} j ${remainingHours} h ${minutes > 0 ? minutes + ' min' : ''}`.trim()
      : `${Math.floor(elapsedHours)} h ${minutes} min`;

  if (elapsedHours < requiredMinimumHours) {
    return {
      elapsedTimeHours: Math.round(elapsedHours * 10) / 10,
      formattedElapsedTime,
      status: 'INSUFFICIENT_DELAY',
      complianceText: 'DÉLAI INSUFFISANT',
      message: `Délai de séchage/conditionnement insuffisant (${formattedElapsedTime} écoulés vs ${requiredMinimumHours} h requis par le protocole).`
    };
  }

  return {
    elapsedTimeHours: Math.round(elapsedHours * 10) / 10,
    formattedElapsedTime,
    status: 'CONFORME',
    complianceText: 'CONFORME',
    message: `Délai respecté (${formattedElapsedTime} écoulés pour un minimum requis de ${requiredMinimumHours} h).`
  };
}

export interface AdhesionCalculationOptions {
  referenceRaw?: AdhesionRawData | null;
  referenceStageId?: UUID | null;
  panelId?: UUID;
  stageId?: UUID;
  calculationVersion?: string;
}

/**
 * Moteur de calcul et d'évaluation métrologique pour l'Adhérence au quadrillage
 */
export function calculateAdhesion(
  raw: AdhesionRawData,
  countConfig: MeasurementCountConfiguration | undefined,
  ruleSet: ScientificRuleSet,
  options?: AdhesionCalculationOptions
): {
  computed: AdhesionComputedData;
  alerts: MeasurementAlert[];
} {
  const alerts: MeasurementAlert[] = [];
  const version = options?.calculationVersion || ADHESION_CALCULATION_VERSION;

  // 1. Validation de la classe d'adhérence
  let adhesionClass: number | null = null;
  let classDescription = 'Non mesurée';

  if (raw.adhesionClass !== null && raw.adhesionClass !== undefined && raw.adhesionClass !== ('' as any)) {
    const parsed = Number(raw.adhesionClass);
    if (!isNaN(parsed) && Number.isInteger(parsed) && parsed >= 0 && parsed <= 5) {
      adhesionClass = parsed;
      classDescription = ISO2409_CLASSES[parsed]?.description || `Classe ${parsed}`;
    } else {
      alerts.push({
        id: `alert-adh-invalid-${options?.stageId || ''}-${options?.panelId || ''}`,
        severity: 'BLOCKING',
        code: 'PHYSICAL_BOUNDS_EXCEEDED',
        message: `Classe d'adhérence ISO 2409 invalide : "${raw.adhesionClass}". La classe doit être un entier strict entre 0 et 5.`,
        familyId: 'ADHESION',
        stageId: options?.stageId,
        panelId: options?.panelId
      });
    }
  }

  // 2. Contrôle du délai d'application
  const delayCheck = calculateDelayCompliance(
    raw.applicationDateTime,
    raw.measurementDateTime,
    raw.requiredMinimumDelayHours || 168
  );

  if (delayCheck.status === 'INVALID_DATE') {
    alerts.push({
      id: `alert-adh-date-${options?.stageId || ''}-${options?.panelId || ''}`,
      severity: 'BLOCKING',
      code: 'MEASUREMENT_INVALID',
      message: delayCheck.message,
      familyId: 'ADHESION',
      stageId: options?.stageId,
      panelId: options?.panelId
    });
  } else if (delayCheck.status === 'INSUFFICIENT_DELAY') {
    alerts.push({
      id: `alert-adh-delay-${options?.stageId || ''}-${options?.panelId || ''}`,
      severity: 'WARNING',
      code: 'PROTOCOL_ADAPTED',
      message: delayCheck.message,
      familyId: 'ADHESION',
      stageId: options?.stageId,
      panelId: options?.panelId
    });
  } else if (delayCheck.status === 'MISSING_APPLICATION_DATE') {
    alerts.push({
      id: `alert-adh-missing-appdate-${options?.stageId || ''}-${options?.panelId || ''}`,
      severity: 'WARNING',
      code: 'MEASUREMENT_MISSING',
      message: delayCheck.message,
      familyId: 'ADHESION',
      stageId: options?.stageId,
      panelId: options?.panelId
    });
  }

  // 3. Référence T0 & Évolution
  let initialAdhesionClass: number | null = null;
  let deltaAdhesionClass: number | null = null;

  if (options?.referenceRaw?.adhesionClass !== undefined && options.referenceRaw?.adhesionClass !== null) {
    const refVal = Number(options.referenceRaw.adhesionClass);
    if (!isNaN(refVal) && refVal >= 0 && refVal <= 5) {
      initialAdhesionClass = refVal;
      if (adhesionClass !== null) {
        deltaAdhesionClass = adhesionClass - initialAdhesionClass;
      }
    }
  }

  // 4. Évaluation Qualité
  const isMissing = adhesionClass === null;
  const isInvalid = alerts.some((a) => a.severity === 'BLOCKING');
  const hasWarning = alerts.some((a) => a.severity === 'WARNING');

  const qualityAssessment: QualityAssessment = {
    expectedCount: 1,
    actualCount: isMissing ? 0 : 1,
    validCount: isMissing || isInvalid ? 0 : 1,
    suspectCount: 0,
    invalidCount: isInvalid ? 1 : 0,
    missingCount: isMissing ? 1 : 0,
    completenessPercent: isMissing ? 0 : 100,
    status: isInvalid ? 'INVALID' : hasWarning ? 'WARNING' : isMissing ? 'INVALID' : 'GOOD',
    warnings: alerts.map((a) => a.message)
  };

  const protocolStatus: ProtocolComplianceStatus = countConfig?.deviationFromStandard
    ? countConfig.justification?.trim()
      ? 'ADAPTED_JUSTIFIED'
      : 'ADAPTED_UNJUSTIFIED'
    : 'STANDARD';

  const computed: AdhesionComputedData = {
    adhesionClass,
    classDescription,
    initialAdhesionClass,
    deltaAdhesionClass,
    elapsedTimeHours: delayCheck.elapsedTimeHours,
    delayCompliance:
      delayCheck.status === 'CONFORME'
        ? 'CONFORME'
        : delayCheck.status === 'INSUFFICIENT_DELAY'
        ? 'NON_CONFORME'
        : 'NON_EVALUE',
    gridSpacingUsedMm: raw.gridSpacingMm || 2,
    criterionCategory: adhesionClass !== null ? `Classe ${adhesionClass} (ISO 2409)` : undefined,
    qualityAssessment,
    protocolStatus,
    computation: {
      calculationVersion: version,
      calculatedAt: new Date().toISOString()
    }
  };

  return { computed, alerts };
}
