/**
 * QUV-Lab — Moteur Scientifique : Famille Brillance (NF EN 927-6 / ISO 2813)
 * Modélisation multi-séries (Sens du fil & Perpendiculaire), géométries, rétention et immuabilité de RAW.
 */

import {
  GlossRawData,
  GlossComputedData,
  MeasurementSeriesConfiguration,
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
  checkGlossValidity,
  buildQualityAssessment
} from './validity';
import { evaluateSeriesProtocolCompliance } from './protocolEngine';

export const GLOSS_CALCULATION_VERSION = '1.2.0';

export interface GlossCalculationResult {
  computed: GlossComputedData;
  alerts: MeasurementAlert[];
}

/**
 * Moteur pur de calcul pour la brillance
 */
export function calculateGloss(
  raw: GlossRawData,
  config: MeasurementSeriesConfiguration,
  ruleSet: ScientificRuleSet,
  options?: {
    referenceRaw?: GlossRawData | null;
    referenceStageId?: UUID | null;
    panelId?: UUID;
    stageId?: UUID;
    calculationVersion?: string;
  }
): GlossCalculationResult {
  const version = options?.calculationVersion || GLOSS_CALCULATION_VERSION;
  const alerts: MeasurementAlert[] = [];

  const expectedSeriesCount = config.configuredConfiguration.seriesCount;
  const expectedReadingsPerSeries = config.configuredConfiguration.readingsPerSeries;
  const totalExpectedReadings = config.configuredConfiguration.totalReadings;

  // 1. Contrôle de la géométrie de mesure
  const configuredGeometry = ruleSet.statisticalRules.glossGeometryDefault || '60';
  const actualGeometry = raw.instrumentMetadata?.geometry;

  if (actualGeometry && actualGeometry !== configuredGeometry) {
    alerts.push({
      id: `alert-gloss-geom-mismatch`,
      severity: 'WARNING',
      code: 'GEOMETRY_MISMATCH',
      message: `Géométrie instrumentale (${actualGeometry}°) différente de la géométrie standard configurée (${configuredGeometry}°).`,
      familyId: 'GLOSS',
      panelId: options?.panelId,
      stageId: options?.stageId
    });
  }

  // 2. Traitement des séries et validation des points
  const allValidValues: number[] = [];
  const allValidityStatuses: ReadingValidity[] = [];
  const seriesStats = [];

  const seriesList = raw.series || [];

  for (let sIdx = 0; sIdx < expectedSeriesCount; sIdx++) {
    const series = seriesList[sIdx];
    const rawOrientation = series?.orientation;
    const orientation = rawOrientation || config.configuredConfiguration.orientations?.[sIdx] || `Série #${sIdx + 1}`;

    if (!rawOrientation && (!config.configuredConfiguration.orientations || !config.configuredConfiguration.orientations[sIdx])) {
      alerts.push({
        id: `alert-gloss-orient-missing-${sIdx + 1}`,
        severity: 'WARNING',
        code: 'STATISTICAL_WARNING',
        message: `Orientation non spécifiée pour la série de brillance #${sIdx + 1}.`,
        familyId: 'GLOSS',
        panelId: options?.panelId,
        stageId: options?.stageId,
        seriesIndex: sIdx + 1
      });
    }

    const seriesValidValues: number[] = [];

    for (let rIdx = 0; rIdx < expectedReadingsPerSeries; rIdx++) {
      const reading = series?.readings?.[rIdx];
      const val = reading?.value;

      const validity = checkGlossValidity(val);
      allValidityStatuses.push(validity);

      if (validity === 'INVALID') {
        alerts.push({
          id: `alert-gloss-inv-${sIdx + 1}-${rIdx + 1}`,
          severity: 'BLOCKING',
          code: 'MEASUREMENT_INVALID',
          message: `Mesure de brillance invalide (${val} GU) dans ${orientation} #${rIdx + 1}.`,
          familyId: 'GLOSS',
          panelId: options?.panelId,
          stageId: options?.stageId,
          seriesIndex: sIdx + 1,
          pointIndex: rIdx + 1
        });
      } else if (validity === 'MISSING') {
        alerts.push({
          id: `alert-gloss-miss-${sIdx + 1}-${rIdx + 1}`,
          severity: 'WARNING',
          code: 'MEASUREMENT_MISSING',
          message: `Mesure de brillance manquante dans ${orientation} #${rIdx + 1}.`,
          familyId: 'GLOSS',
          panelId: options?.panelId,
          stageId: options?.stageId,
          seriesIndex: sIdx + 1,
          pointIndex: rIdx + 1
        });
      } else {
        seriesValidValues.push(val!);
        allValidValues.push(val!);
      }
    }

    // Statistiques de la série
    const seriesMean = calculateMean(seriesValidValues);
    const seriesStdDev = calculateStdDevByMethod(seriesValidValues, ruleSet.statisticalRules.stdDevMethod);

    seriesStats.push({
      seriesIndex: sIdx + 1,
      orientation,
      mean: roundMetric(seriesMean, 2),
      stdDev: roundMetric(seriesStdDev, 2),
      validCount: seriesValidValues.length
    });
  }

  // 3. Contrôle Qualité global du relevé
  const qualityAssessment = buildQualityAssessment(allValidityStatuses, totalExpectedReadings);

  // 4. Évaluation de la conformité du protocole
  const protocolEval = evaluateSeriesProtocolCompliance(config, ruleSet);
  alerts.push(...protocolEval.alerts);

  // 5. Moyenne et Écart-type globaux
  const meanGloss = calculateMean(allValidValues);
  const stdDevGloss = calculateStdDevByMethod(allValidValues, ruleSet.statisticalRules.stdDevMethod);

  // Contrôle statistique de dispersion selon le RuleSet
  const maxDispersionPercent = ruleSet.statisticalRules.maxGlossDispersionPercent ?? 15;
  if (meanGloss !== null && meanGloss > 0 && stdDevGloss !== null) {
    const cv = (stdDevGloss / meanGloss) * 100;
    if (cv > maxDispersionPercent) {
      alerts.push({
        id: `alert-gloss-dispersion-high`,
        severity: 'WARNING',
        code: 'STATISTICAL_WARNING',
        message: `Dispersion relative de brillance élevée (${roundMetric(cv, 1)}% > seuil max autorisé de ${maxDispersionPercent}%).`,
        familyId: 'GLOSS',
        panelId: options?.panelId,
        stageId: options?.stageId
      });
    }
  }

  // 6. Comparaison inter-étapes avec T0 (si fourni)
  let deltaGloss: number | null = null;
  let retentionRatePercent: number | null = null;

  if (options?.referenceRaw) {
    const refValues: number[] = [];
    (options.referenceRaw.series || []).forEach((s) => {
      (s.readings || []).forEach((r) => {
        if (typeof r.value === 'number' && Number.isFinite(r.value) && r.value >= 0) {
          refValues.push(r.value);
        }
      });
    });

    const refMean = calculateMean(refValues);
    const refStdDev = calculateStdDevByMethod(refValues, ruleSet.statisticalRules.stdDevMethod);

    if (meanGloss !== null && refMean !== null) {
      deltaGloss = meanGloss - refMean;

      // Protection division par zéro (T0 = 0 GU)
      if (Math.abs(refMean) < 1e-6) {
        retentionRatePercent = null;
        alerts.push({
          id: `alert-gloss-ref-zero`,
          severity: 'WARNING',
          code: 'REFERENCE_VALUE_ZERO',
          message: 'La brillance initiale T0 est égale à 0 GU. Le taux de rétention de brillance (%) ne peut pas être calculé.',
          familyId: 'GLOSS',
          panelId: options?.panelId,
          stageId: options?.stageId
        });
      } else {
        retentionRatePercent = (meanGloss / refMean) * 100;
      }
    } else {
      alerts.push({
        id: `alert-gloss-ref-miss`,
        severity: 'WARNING',
        code: 'REFERENCE_STAGE_MISSING',
        message: "L'étape de référence T0 ne contient pas de mesure de brillance valide pour calculer la rétention.",
        familyId: 'GLOSS',
        panelId: options?.panelId,
        stageId: options?.stageId
      });
    }
  }

  // 7. Détection du Mode et Alerte Spécifique INFIPERF (Rétention < 50%)
  let detectedMode: 'NORMATIVE_4' | 'SIMPLIFIED_2' | 'NORMATIVE_6' = 'NORMATIVE_4';
  if (raw.mode) {
    detectedMode = raw.mode;
  } else if (totalExpectedReadings === 2) {
    detectedMode = 'SIMPLIFIED_2';
  } else if (totalExpectedReadings === 6) {
    detectedMode = 'NORMATIVE_6';
  } else {
    detectedMode = 'NORMATIVE_4';
  }

  let infiperfAlert: { active: boolean; message: string; source: 'INFIPERF / FCBA'; severity: 'WARNING' } | undefined = undefined;
  if (retentionRatePercent !== null && retentionRatePercent < 50) {
    infiperfAlert = {
      active: true,
      message: 'Alerte — rétention de brillant < 50 % (Critère d\'étude INFIPERF / FCBA)',
      source: 'INFIPERF / FCBA',
      severity: 'WARNING'
    };
    alerts.push({
      id: `alert-gloss-infiperf-50`,
      severity: 'WARNING',
      code: 'STATISTICAL_WARNING',
      message: `Alerte : Taux de rétention de brillant de ${roundMetric(retentionRatePercent, 1)} % (< seuil indicatif d'alerte de 50 % selon référence INFIPERF / FCBA). Critère complémentaire, distinct de la conformité NF EN 927-6.`,
      familyId: 'GLOSS',
      panelId: options?.panelId,
      stageId: options?.stageId
    });
  }

  const computed: GlossComputedData = {
    totalReadings: totalExpectedReadings,
    validCount: allValidValues.length,
    glossMode: detectedMode,
    initialMeanGloss: options?.referenceRaw ? roundMetric(calculateMean((options.referenceRaw.series || []).flatMap(s => (s.readings || []).map(r => r.value).filter((v): v is number => typeof v === 'number' && Number.isFinite(v)))), 2) : null,
    initialStdDevGloss: options?.referenceRaw ? roundMetric(calculateStdDevByMethod((options.referenceRaw.series || []).flatMap(s => (s.readings || []).map(r => r.value).filter((v): v is number => typeof v === 'number' && Number.isFinite(v))), ruleSet.statisticalRules.stdDevMethod), 2) : null,
    meanGloss: roundMetric(meanGloss, 2),
    stdDevGloss: roundMetric(stdDevGloss, 2),
    seriesStats,
    referenceStageId: options?.referenceStageId ?? null,
    deltaGloss: roundMetric(deltaGloss, 2),
    deltaGlossStdDev: null,
    retentionRatePercent: roundMetric(retentionRatePercent, 1),
    infiperfAlert,
    criterionCategory: 'NORMATIVE_REQUIREMENT',
    qualityAssessment,
    protocolStatus: protocolEval.status,
    computation: {
      calculationVersion: version,
      calculatedAt: new Date().toISOString()
    }
  };

  return { computed, alerts };
}
