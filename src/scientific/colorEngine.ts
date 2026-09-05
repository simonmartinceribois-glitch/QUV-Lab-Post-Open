/**
 * QUV-Lab — Moteur Scientifique : Famille Couleur (NF EN 927-6 / CIE L*a*b*)
 * Calculs purs, déterministes, versionnés, avec traçabilité et immuabilité stricte de RAW.
 */

import {
  ColorRawData,
  ColorComputedData,
  MeasurementCountConfiguration,
  ScientificRuleSet,
  MeasurementAlert,
  ReadingValidity,
  UUID
} from '../types/scientific';
import {
  calculateMean,
  calculateStdDevByMethod,
  roundMetric
} from './statistics';
import {
  checkColorCoordinateValidity,
  buildQualityAssessment
} from './validity';
import { evaluateCountProtocolCompliance } from './protocolEngine';

export const COLOR_CALCULATION_VERSION = '1.2.0';

export interface ColorCalculationResult {
  computed: ColorComputedData;
  alerts: MeasurementAlert[];
}

/**
 * Moteur pur de calcul pour la couleur
 */
export function calculateColor(
  raw: ColorRawData,
  config: MeasurementCountConfiguration,
  ruleSet: ScientificRuleSet,
  options?: {
    referenceRaw?: ColorRawData | null;
    referenceStageId?: UUID | null;
    panelId?: UUID;
    stageId?: UUID;
    calculationVersion?: string;
  }
): ColorCalculationResult {
  const version = options?.calculationVersion || COLOR_CALCULATION_VERSION;
  const alerts: MeasurementAlert[] = [];
  const expectedCount = config.configuredCount;

  // 1. Validation de chaque point L*, a*, b*
  const validL: number[] = [];
  const validA: number[] = [];
  const validB: number[] = [];
  const validityStatuses: ReadingValidity[] = [];

  const readings = raw.readings || [];

  for (let i = 0; i < expectedCount; i++) {
    const point = readings[i];
    if (!point) {
      validityStatuses.push('MISSING');
      alerts.push({
        id: `alert-col-miss-${i + 1}`,
        severity: 'WARNING',
        code: 'MEASUREMENT_MISSING',
        message: `Point de mesure couleur #${i + 1} manquant.`,
        familyId: 'COLOR',
        panelId: options?.panelId,
        stageId: options?.stageId,
        pointIndex: i + 1
      });
      continue;
    }

    const valL = checkColorCoordinateValidity('L', point.L, ruleSet);
    const valA = checkColorCoordinateValidity('a', point.a, ruleSet);
    const valB = checkColorCoordinateValidity('b', point.b, ruleSet);

    if (valL === 'INVALID' || valA === 'INVALID' || valB === 'INVALID') {
      validityStatuses.push('INVALID');
      alerts.push({
        id: `alert-col-inv-${i + 1}`,
        severity: 'BLOCKING',
        code: 'MEASUREMENT_INVALID',
        message: `Point couleur #${i + 1} invalide (L*=${point.L}, a*=${point.a}, b*=${point.b}). Bornes physiques [0..100] / [-128..127].`,
        familyId: 'COLOR',
        panelId: options?.panelId,
        stageId: options?.stageId,
        pointIndex: i + 1
      });
    } else if (valL === 'MISSING' || valA === 'MISSING' || valB === 'MISSING') {
      validityStatuses.push('MISSING');
      alerts.push({
        id: `alert-col-inc-${i + 1}`,
        severity: 'WARNING',
        code: 'MEASUREMENT_MISSING',
        message: `Point couleur #${i + 1} incomplet.`,
        familyId: 'COLOR',
        panelId: options?.panelId,
        stageId: options?.stageId,
        pointIndex: i + 1
      });
    } else {
      validityStatuses.push('VALID');
      validL.push(point.L!);
      validA.push(point.a!);
      validB.push(point.b!);
    }
  }

  // 2. Contrôle Qualité du relevé
  const qualityAssessment = buildQualityAssessment(validityStatuses, expectedCount);

  // 3. Statut Protocolaire
  const protocolEval = evaluateCountProtocolCompliance(config, ruleSet);
  alerts.push(...protocolEval.alerts);

  // 4. Calcul des Moyennes et Écarts-types (sur valeurs VALID)
  const meanL = calculateMean(validL);
  const meanA = calculateMean(validA);
  const meanB = calculateMean(validB);

  const stdMethod = ruleSet.statisticalRules.stdDevMethod;
  const stdDevL = calculateStdDevByMethod(validL, stdMethod);
  const stdDevA = calculateStdDevByMethod(validA, stdMethod);
  const stdDevB = calculateStdDevByMethod(validB, stdMethod);

  // Contrôle statistique d'hétérogénéité
  const maxAllowedStdDev = ruleSet.statisticalRules.maxColorStdDev ?? 2.0;
  if (stdDevL !== null && stdDevL > maxAllowedStdDev) {
    alerts.push({
      id: `alert-col-std-l`,
      severity: 'WARNING',
      code: 'STATISTICAL_WARNING',
      message: `Dispersion L* élevée sur le panneau (s=${roundMetric(stdDevL)} > ${maxAllowedStdDev}).`,
      familyId: 'COLOR',
      panelId: options?.panelId,
      stageId: options?.stageId
    });
  }

  // Chroma C* et Hue h*
  let chromaC: number | null = null;
  let hueH: number | null = null;

  if (meanA !== null && meanB !== null) {
    chromaC = Math.sqrt(Math.pow(meanA, 2) + Math.pow(meanB, 2));
    let deg = Math.atan2(meanB, meanA) * (180 / Math.PI);
    if (deg < 0) deg += 360;
    hueH = deg;
  }

  // 5. Calculs différentiels par rapport à T0 (si fourni)
  let deltaL: number | null = null;
  let deltaA: number | null = null;
  let deltaB: number | null = null;
  let deltaE: number | null = null;
  let deltaC: number | null = null;
  let deltaH: number | null = null;

  let refMeanL: number | null = null;
  let refMeanA: number | null = null;
  let refMeanB: number | null = null;

  if (options?.referenceRaw) {
    const refValidL = (options.referenceRaw.readings || [])
      .map((r) => r.L)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const refValidA = (options.referenceRaw.readings || [])
      .map((r) => r.a)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    const refValidB = (options.referenceRaw.readings || [])
      .map((r) => r.b)
      .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

    refMeanL = calculateMean(refValidL);
    refMeanA = calculateMean(refValidA);
    refMeanB = calculateMean(refValidB);

    if (
      meanL !== null &&
      meanA !== null &&
      meanB !== null &&
      refMeanL !== null &&
      refMeanA !== null &&
      refMeanB !== null
    ) {
      deltaL = meanL - refMeanL;
      deltaA = meanA - refMeanA;
      deltaB = meanB - refMeanB;

      // CIE 1976 ΔE*ab
      deltaE = Math.sqrt(Math.pow(deltaL, 2) + Math.pow(deltaA, 2) + Math.pow(deltaB, 2));

      // ΔC* (différence de saturation) et ΔH* (différence de teinte)
      const refChroma = Math.sqrt(Math.pow(refMeanA, 2) + Math.pow(refMeanB, 2));
      if (chromaC !== null) {
        deltaC = chromaC - refChroma;
        const dE2 = Math.pow(deltaE, 2);
        const dL2 = Math.pow(deltaL, 2);
        const dC2 = Math.pow(deltaC, 2);
        const diffH2 = dE2 - dL2 - dC2;
        deltaH = diffH2 > 0 ? Math.sqrt(diffH2) : 0;
      }
    } else {
      alerts.push({
        id: `alert-col-ref-inc`,
        severity: 'WARNING',
        code: 'REFERENCE_STAGE_MISSING',
        message: "L'étape de référence T0 ne contient pas assez de points valides pour calculer ΔE*.",
        familyId: 'COLOR',
        panelId: options?.panelId,
        stageId: options?.stageId
      });
    }
  }

  const computed: ColorComputedData = {
    pointsCount: expectedCount,
    validCount: validL.length,
    meanL: roundMetric(meanL, 3),
    meanA: roundMetric(meanA, 3),
    meanB: roundMetric(meanB, 3),
    stdDevL: roundMetric(stdDevL, 3),
    stdDevA: roundMetric(stdDevA, 3),
    stdDevB: roundMetric(stdDevB, 3),
    chromaC: roundMetric(chromaC, 3),
    hueH: roundMetric(hueH, 2),
    referenceStageId: options?.referenceStageId ?? null,
    initialMeanL: roundMetric(refMeanL, 3),
    initialMeanA: roundMetric(refMeanA, 3),
    initialMeanB: roundMetric(refMeanB, 3),
    deltaL: roundMetric(deltaL, 3),
    deltaA: roundMetric(deltaA, 3),
    deltaB: roundMetric(deltaB, 3),
    deltaE: roundMetric(deltaE, 3),
    deltaC: roundMetric(deltaC, 3),
    deltaH: roundMetric(deltaH, 3),
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
