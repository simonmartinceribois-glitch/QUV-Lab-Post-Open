/**
 * QUV-Lab — Référentiel Scientifique Découplé (NF EN 927-6 & Procédures Laboratoire)
 * Bannit tout hard-coding normatif dans les composants ou les fonctions de calcul.
 */

import {
  ScientificRuleSet,
  MeasurementCountConfiguration,
  MeasurementSeriesConfiguration,
  MeasurementFamilyId,
  ScientificRuleOrigin,
  RuleSource
} from '../types/scientific';

/**
 * Référentiel Scientifique par Défaut (v1.2)
 * Distingue explicitement les 4 origines :
 * - NORMATIVE_REQUIREMENT : NF EN 927-6:2018 (Couleur 4 pts cl. 6.3.2, Brillance 2x2 60° cl. 6.3.3)
 * - LAB_RECOMMENDATION : Dureté Persoz 3 reps (ISO 1522 / procédure labo, non-normative pour 927-6)
 * - METROLOGICAL_CHOICE : Écart-type échantillon n-1, seuils d'alerte dispersion
 * - PROTOCOL_ADAPTATION : Toute configuration s'écartant du standard (avec justification obligatoire)
 */
export function getDefaultScientificRuleSet(): ScientificRuleSet {
  return {
    id: 'rule-set-nf-en-927-6-2018',
    standardReference: 'NF EN 927-6',
    version: '2018 / Moteur v1.2.0',
    effectiveDate: '2018-10-01T00:00:00Z',
    sourceReference: 'NF EN 927-6:2018 — Peintures et vernis - Produits de peinture et systèmes de peinture pour le bois extérieur - Partie 6 : Vieillissement artificiel des revêtements pour bois par exposition à des lampes UV fluorescentes et à l’eau',
    status: 'VERIFIED',
    validatedBy: 'Laboratoire R&D Matériaux & Finitions Bois',
    validatedAt: '2026-08-30T00:00:00Z',

    colorimetry: {
      illuminant: 'D65',
      observer: '10°',
      geometry: '45_0',
      differenceFormula: 'CIE_1976',
      physicalBounds: {
        minL: 0,
        maxL: 100,
        minA: -128,
        maxA: 127,
        minB: -128,
        maxB: 127
      }
    },

    statisticalRules: {
      stdDevMethod: 'SAMPLE', // s = sqrt(sum(x - mean)^2 / (n - 1))
      glossGeometryDefault: '60',
      maxGlossDispersionPercent: 15,
      maxColorStdDev: 2.0
    },

    measurementConfigurations: {
      COLOR: {
        familyId: 'COLOR',
        mode: 'STANDARD_DEFAULT',
        origin: 'NORMATIVE_REQUIREMENT',
        standardReference: 'NF EN 927-6',
        clause: '6.3.2',
        rationale: 'Mesure de couleur CIE L*a*b* en 4 points représentatifs de la surface exposée',
        standardRecommendedCount: 4,
        configuredCount: 4,
        deviationFromStandard: false,
        configuredBy: 'SYSTEM',
        configuredAt: '2026-08-30T00:00:00Z',
        ruleSource: 'NORMATIVE_REQUIREMENT'
      },
      PERSOZ: {
        familyId: 'PERSOZ',
        mode: 'STANDARD_DEFAULT',
        origin: 'LAB_RECOMMENDATION',
        standardReference: 'NF EN ISO 1522 / Procédure Interne Labo',
        clause: 'Méthode B (Amortissement pendulaire)',
        rationale: 'Mesure de dureté pendulaire Persoz en 3 répétitions (non-imposée par NF EN 927-6)',
        standardRecommendedCount: 3,
        configuredCount: 3,
        deviationFromStandard: false,
        configuredBy: 'SYSTEM',
        configuredAt: '2026-08-30T00:00:00Z',
        ruleSource: 'LAB_RECOMMENDATION'
      },
      ADHESION: {
        familyId: 'ADHESION',
        mode: 'STANDARD_DEFAULT',
        origin: 'NORMATIVE_REQUIREMENT',
        standardReference: 'NF EN ISO 2409:2020',
        clause: '§5 & §6 (Essai de quadrillage)',
        rationale: 'Évaluation de la résistance du revêtement à la séparation par quadrillage (6×6 incisions, espacement selon épaisseur sèche)',
        standardRecommendedCount: 1,
        configuredCount: 1,
        deviationFromStandard: false,
        configuredBy: 'SYSTEM',
        configuredAt: '2026-08-30T00:00:00Z',
        ruleSource: 'NORMATIVE_REQUIREMENT'
      }
    },

    seriesConfigurations: {
      GLOSS: {
        familyId: 'GLOSS',
        mode: 'STANDARD_DEFAULT',
        origin: 'NORMATIVE_REQUIREMENT',
        standardReference: 'NF EN 927-6',
        clause: '6.3.3',
        rationale: 'Mesure de brillance spéculaire sous géométrie 60° (2 séries sens du fil + 2 perpendiculaires)',
        standardConfiguration: {
          seriesCount: 2,
          readingsPerSeries: 2,
          totalReadings: 4,
          orientations: ['GRAIN_DIRECTION', 'PERPENDICULAR_DIRECTION'],
          description: '2 mesures sens du fil + 2 mesures perpendiculaire au fil'
        },
        configuredConfiguration: {
          seriesCount: 2,
          readingsPerSeries: 2,
          totalReadings: 4,
          orientations: ['GRAIN_DIRECTION', 'PERPENDICULAR_DIRECTION'],
          description: '2 mesures sens du fil + 2 mesures perpendiculaire au fil'
        },
        deviationFromStandard: false,
        configuredBy: 'SYSTEM',
        configuredAt: '2026-08-30T00:00:00Z',
        ruleSource: 'NORMATIVE_REQUIREMENT'
      }
    }
  };
}

/**
 * Créer ou adapter une configuration de nombre de mesures pour une famille scalaire
 */
export function createCountConfiguration(
  familyId: MeasurementFamilyId,
  configuredCount: number,
  ruleSet: ScientificRuleSet,
  options?: {
    justification?: string;
    operatorId?: string;
  }
): MeasurementCountConfiguration {
  const ref = ruleSet.measurementConfigurations[familyId] || {
    standardRecommendedCount: 4,
    origin: 'NORMATIVE_REQUIREMENT' as ScientificRuleOrigin,
    ruleSource: 'NORMATIVE_REQUIREMENT' as RuleSource,
    standardReference: ruleSet.standardReference,
    clause: 'N/A',
    rationale: 'Configuration de mesure'
  };

  const isStandard = configuredCount === ref.standardRecommendedCount;
  const justification = options?.justification?.trim() || '';
  const origin: ScientificRuleOrigin = isStandard
    ? (ref.origin || 'NORMATIVE_REQUIREMENT')
    : 'PROTOCOL_ADAPTATION';

  const isLabOrigin = ref.origin === 'LAB_RECOMMENDATION' || ref.ruleSource === 'LABORATORY' || ref.ruleSource === 'LAB_RECOMMENDATION';
  const ruleSource: RuleSource = isLabOrigin ? 'LABORATORY' : (ref.ruleSource || origin);

  return {
    familyId,
    mode: isStandard ? 'STANDARD_DEFAULT' : 'CUSTOM_JUSTIFIED',
    origin,
    standardReference: ref.standardReference || ruleSet.standardReference,
    clause: ref.clause,
    rationale: ref.rationale,
    standardRecommendedCount: ref.standardRecommendedCount,
    configuredCount,
    deviationFromStandard: !isStandard,
    justification: isStandard ? undefined : justification,
    deviationReason: isStandard
      ? undefined
      : `Adaptation du plan de mesure (${configuredCount} relevés au lieu des ${ref.standardRecommendedCount} recommandés)`,
    configuredBy: options?.operatorId || 'OPERATOR',
    configuredAt: new Date().toISOString(),
    ruleSource
  };
}

/**
 * Créer ou adapter une configuration multi-séries (ex: Brillance 2x2 vs 2x1)
 */
export function createSeriesConfiguration(
  familyId: MeasurementFamilyId,
  seriesCount: number,
  readingsPerSeries: number,
  ruleSet: ScientificRuleSet,
  options?: {
    orientations?: string[];
    justification?: string;
    operatorId?: string;
  }
): MeasurementSeriesConfiguration {
  const ref = ruleSet.seriesConfigurations?.[familyId] || {
    origin: 'NORMATIVE_REQUIREMENT' as ScientificRuleOrigin,
    standardReference: ruleSet.standardReference,
    clause: '6.3.3',
    rationale: 'Mesure de brillance spéculaire sous 60°',
    standardConfiguration: {
      seriesCount: 2,
      readingsPerSeries: 2,
      totalReadings: 4,
      orientations: ['GRAIN_DIRECTION', 'PERPENDICULAR_DIRECTION'],
      description: '2 mesures sens du fil + 2 mesures perpendiculaire'
    },
    ruleSource: 'NORMATIVE_REQUIREMENT' as RuleSource
  };

  const total = seriesCount * readingsPerSeries;
  const isStandard =
    seriesCount === ref.standardConfiguration.seriesCount &&
    readingsPerSeries === ref.standardConfiguration.readingsPerSeries;

  const justification = options?.justification?.trim() || '';
  const origin: ScientificRuleOrigin = isStandard
    ? (ref.origin || 'NORMATIVE_REQUIREMENT')
    : 'PROTOCOL_ADAPTATION';

  const isLabOrigin = ref.origin === 'LAB_RECOMMENDATION' || ref.ruleSource === 'LABORATORY' || ref.ruleSource === 'LAB_RECOMMENDATION';
  const ruleSource: RuleSource = isLabOrigin ? 'LABORATORY' : (ref.ruleSource || origin);

  return {
    familyId,
    mode: isStandard ? 'STANDARD_DEFAULT' : 'CUSTOM_JUSTIFIED',
    origin,
    standardReference: ref.standardReference || ruleSet.standardReference,
    clause: ref.clause,
    rationale: ref.rationale,
    standardConfiguration: { ...ref.standardConfiguration },
    configuredConfiguration: {
      seriesCount,
      readingsPerSeries,
      totalReadings: total,
      orientations: options?.orientations || ref.standardConfiguration.orientations,
      description: `${seriesCount} séries de ${readingsPerSeries} mesure(s) (${total} mesures au total)`
    },
    deviationFromStandard: !isStandard,
    justification: isStandard ? undefined : justification,
    deviationReason: isStandard
      ? undefined
      : `Adaptation de la structure de mesure (${seriesCount} × ${readingsPerSeries} au lieu de ${ref.standardConfiguration.seriesCount} × ${ref.standardConfiguration.readingsPerSeries})`,
    configuredBy: options?.operatorId || 'OPERATOR',
    configuredAt: new Date().toISOString(),
    ruleSource
  };
}
