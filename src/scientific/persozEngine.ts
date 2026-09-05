/**
 * QUV-Lab — Moteur Scientifique : Famille Persoz (Dureté Pendulaire — NF EN ISO 1522)
 * Mesure complémentaire (Règle LABORATOIRE, non imposée par la NF EN 927-6).
 */

import {
  PersozRawData,
  PersozComputedData,
  MeasurementCountConfiguration,
  ScientificRuleSet,
  MeasurementAlert,
  ReadingValidity,
  UUID
} from '../types/scientific';
import {
  calculateMean,
  calculateStdDevByMethod,
  calculateCoefficientOfVariation,
  roundMetric
} from './statistics';
import {
  checkPersozValidity,
  buildQualityAssessment
} from './validity';
import { evaluateCountProtocolCompliance } from './protocolEngine';

export const PERSOZ_CALCULATION_VERSION = '1.2.0';

export interface PersozCalculationResult {
  computed: PersozComputedData;
  alerts: MeasurementAlert[];
}

/**
 * Moteur pur de calcul pour la dureté Persoz
 */
export function calculatePersoz(
  raw: PersozRawData,
  config: MeasurementCountConfiguration,
  ruleSet: ScientificRuleSet,
  options?: {
    referenceRaw?: PersozRawData | null;
    referenceStageId?: UUID | null;
    panelId?: UUID;
    stageId?: UUID;
    calculationVersion?: string;
  }
): PersozCalculationResult {
  const version = options?.calculationVersion || PERSOZ_CALCULATION_VERSION;
  const alerts: MeasurementAlert[] = [];
  const expectedCount = config.configuredCount;

  // 1. Validation des points de mesure
  const validValues: number[] = [];
  const validityStatuses: ReadingValidity[] = [];

  const readings = raw.readings || [];

  for (let i = 0; i < expectedCount; i++) {
    const point = readings[i];
    const val = point?.dampingTimeSeconds;

    const validity = checkPersozValidity(val);
    validityStatuses.push(validity);

    if (validity === 'INVALID') {
      alerts.push({
        id: `alert-persoz-inv-${i + 1}`,
        severity: 'BLOCKING',
        code: 'MEASUREMENT_INVALID',
        message: `Temps d'amortissement Persoz invalide (${val}) pour la répétition #${i + 1}. Doit être un nombre positif.`,
        familyId: 'PERSOZ',
        panelId: options?.panelId,
        stageId: options?.stageId,
        pointIndex: i + 1
      });
    } else if (validity === 'MISSING') {
      alerts.push({
        id: `alert-persoz-miss-${i + 1}`,
        severity: 'WARNING',
        code: 'MEASUREMENT_MISSING',
        message: `Répétition Persoz #${i + 1} manquante.`,
        familyId: 'PERSOZ',
        panelId: options?.panelId,
        stageId: options?.stageId,
        pointIndex: i + 1
      });
    } else {
      validValues.push(val!);
    }
  }

  // 2. Contrôle Qualité
  const qualityAssessment = buildQualityAssessment(validityStatuses, expectedCount);

  // 3. Statut Protocolaire
  const protocolEval = evaluateCountProtocolCompliance(config, ruleSet);
  alerts.push(...protocolEval.alerts);

  // 4. Moyenne, Écart-type et Coefficient de Variation
  const stdMethod = ruleSet.statisticalRules.stdDevMethod;
  const meanDampingTime = calculateMean(validValues);
  const stdDevDampingTime = calculateStdDevByMethod(validValues, stdMethod);
  const coefficientOfVariationPercent = calculateCoefficientOfVariation(validValues, stdMethod);

  // 5. Comparaison différentielle avec T0 (si disponible)
  let deltaDampingTime: number | null = null;
  let relativeHardnessVariationPercent: number | null = null;
  let refMean: number | null = null;

  if (options?.referenceRaw) {
    const refValidValues = (options.referenceRaw.readings || [])
      .map((r) => r.dampingTimeSeconds)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0);

    refMean = calculateMean(refValidValues);

    if (meanDampingTime !== null && refMean !== null) {
      deltaDampingTime = meanDampingTime - refMean;
      if (Math.abs(refMean) > 1e-6) {
        relativeHardnessVariationPercent = ((meanDampingTime - refMean) / refMean) * 100;
      }
    }
  }

  const computed: PersozComputedData = {
    pointsCount: expectedCount,
    validCount: validValues.length,
    initialMeanDampingTime: roundMetric(refMean, 1),
    meanDampingTime: roundMetric(meanDampingTime, 1),
    stdDevDampingTime: roundMetric(stdDevDampingTime, 2),
    coefficientOfVariationPercent: roundMetric(coefficientOfVariationPercent, 1),
    referenceStageId: options?.referenceStageId ?? null,
    deltaDampingTime: roundMetric(deltaDampingTime, 1),
    relativeHardnessVariationPercent: roundMetric(relativeHardnessVariationPercent, 1),
    criterionCategory: 'COMPLEMENTARY_CRITERION',
    qualityAssessment,
    protocolStatus: protocolEval.status,
    computation: {
      calculationVersion: version,
      calculatedAt: new Date().toISOString()
    }
  };

  return { computed, alerts };
}
