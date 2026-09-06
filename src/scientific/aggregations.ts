/**
 * QUV-Lab — Agrégations Scientifiques & Statistiques Inter-Panneaux
 * Règle stricte : L'écart-type intra-panneau (répétabilité de la mesure, calculé dans
 * colorEngine/glossEngine/persozEngine) est strictement distingué de l'écart-type
 * inter-panneaux (dispersion entre éprouvettes physiquement distinctes d'un même lot).
 *
 * Choix métrologique délibéré : l'écart-type inter-panneaux utilise TOUJOURS la formule
 * d'échantillon (n-1), quel que soit `ruleSet.statisticalRules.stdDevMethod`. Ce paramètre
 * ne gouverne que la répétabilité intra-panneau (relevés répétés sur un même panneau, où
 * POPULATION peut avoir un sens selon la convention retenue). Les panneaux d'un lot sont
 * par nature un échantillon prélevé dans la population des panneaux possibles du lot — la
 * dispersion inter-panneaux est donc toujours une estimation d'échantillon, indépendamment
 * de la convention choisie pour la répétabilité de mesure. Ce n'est pas un oubli de câblage
 * du paramètre configurable : c'est un choix scientifique volontairement invariant.
 */

import {
  BatchAggregationStats,
  MeasurementFamilyId,
  ColorComputedData,
  GlossComputedData,
  UUID,
  ComputationMetadata
} from '../types/scientific';
import {
  calculateMean,
  calculateSampleStdDev,
  roundMetric
} from './statistics';

export const AGGREGATION_CALCULATION_VERSION = '1.1.0';

/**
 * Calcule l'agrégation des mesures d'un lot pour la famille Couleur (inter-panneaux).
 *
 * CONTRAT SCIENTIFIQUE IMPÉRATIF (GATE 55 — D-8) :
 * Les données transmises dans `panelComputedList` doivent provenir EXCLUSIVEMENT des
 * panneaux exposés actifs (E1, E2, E3). Le panneau Témoin T, conservé à l'obscurité,
 * ne doit JAMAIS être injecté dans cette liste d'agrégation.
 * Le filtrage doit être garanti en amont par l'appelant à l'aide de `getActiveExposedPanels()`.
 *
 * @param batchId Identifiant du lot
 * @param stageId Identifiant de l'étape
 * @param panelComputedList Liste des résultats calculés des panneaux exposés actifs uniquement
 */
export function aggregateBatchColor(
  batchId: UUID,
  stageId: UUID,
  panelComputedList: ColorComputedData[]
): BatchAggregationStats {
  const activePanels = panelComputedList.filter((p) => p.validCount > 0);
  const deltaEValues = activePanels
    .map((p) => p.deltaE)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const meanDeltaE = calculateMean(deltaEValues);
  const interPanelStdDevDeltaE = calculateSampleStdDev(deltaEValues);

  const computation: ComputationMetadata = {
    calculationVersion: AGGREGATION_CALCULATION_VERSION,
    calculatedAt: new Date().toISOString()
  };

  return {
    batchId,
    stageId,
    familyId: 'COLOR',
    panelsCount: panelComputedList.length,
    activePanelsCount: activePanels.length,
    interPanelMean: roundMetric(meanDeltaE, 3),
    interPanelStdDev: roundMetric(interPanelStdDevDeltaE, 3),
    meanDeltaE: roundMetric(meanDeltaE, 3),
    computation
  };
}

/**
 * Calcule l'agrégation des mesures d'un lot pour la famille Brillance (inter-panneaux).
 *
 * CONTRAT SCIENTIFIQUE IMPÉRATIF (GATE 55 — D-8) :
 * Les données transmises dans `panelComputedList` doivent provenir EXCLUSIVEMENT des
 * panneaux exposés actifs (E1, E2, E3). Le panneau Témoin T, conservé à l'obscurité,
 * ne doit JAMAIS être injecté dans cette liste d'agrégation.
 * Le filtrage doit être garanti en amont par l'appelant à l'aide de `getActiveExposedPanels()`.
 *
 * @param batchId Identifiant du lot
 * @param stageId Identifiant de l'étape
 * @param panelComputedList Liste des résultats calculés des panneaux exposés actifs uniquement
 */
export function aggregateBatchGloss(
  batchId: UUID,
  stageId: UUID,
  panelComputedList: GlossComputedData[]
): BatchAggregationStats {
  const activePanels = panelComputedList.filter((p) => p.validCount > 0);
  const glossValues = activePanels
    .map((p) => p.meanGloss)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const deltaGlossValues = activePanels
    .map((p) => p.deltaGloss)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const retentionValues = activePanels
    .map((p) => p.retentionRatePercent)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const meanGloss = calculateMean(glossValues);
  const interPanelStdDevGloss = calculateSampleStdDev(glossValues);
  const meanDeltaGloss = calculateMean(deltaGlossValues);
  const meanGlossRetentionPercent = calculateMean(retentionValues);

  const computation: ComputationMetadata = {
    calculationVersion: AGGREGATION_CALCULATION_VERSION,
    calculatedAt: new Date().toISOString()
  };

  return {
    batchId,
    stageId,
    familyId: 'GLOSS',
    panelsCount: panelComputedList.length,
    activePanelsCount: activePanels.length,
    interPanelMean: roundMetric(meanGloss, 2),
    interPanelStdDev: roundMetric(interPanelStdDevGloss, 2),
    meanDeltaGloss: roundMetric(meanDeltaGloss, 2),
    meanGlossRetentionPercent: roundMetric(meanGlossRetentionPercent, 1),
    computation
  };
}

export interface PanelComputedItem<T> {
  panel: { id?: string; label?: string; roleCode?: string; role?: string };
  computed: T;
}

export function aggregateBatchColorExposed(
  batchId: UUID,
  stageId: UUID,
  panelComputedList: PanelComputedItem<ColorComputedData>[]
): BatchAggregationStats & {
  color?: {
    meanL: number | null;
    stdDevL: number | null;
    meanA: number | null;
    stdDevA: number | null;
    meanB: number | null;
    stdDevB: number | null;
  };
} {
  const exposedItems = panelComputedList.filter(
    (item) => !item.panel || (item.panel.label !== 'T' && item.panel.role !== 'WITNESS' && item.panel.roleCode !== 'T')
  );
  const deltaEValues = exposedItems
    .map((item) => item.computed.deltaE)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const lValues = exposedItems
    .map((item) => item.computed.meanL)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const aValues = exposedItems
    .map((item) => item.computed.meanA)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const bValues = exposedItems
    .map((item) => item.computed.meanB)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const meanDeltaE = calculateMean(deltaEValues);
  const interPanelStdDevDeltaE = calculateSampleStdDev(deltaEValues);

  return {
    batchId,
    stageId,
    familyId: 'COLOR',
    panelsCount: panelComputedList.length,
    activePanelsCount: exposedItems.length,
    interPanelMean: meanDeltaE !== null ? roundMetric(meanDeltaE, 3) : null,
    interPanelStdDev: interPanelStdDevDeltaE !== null ? roundMetric(interPanelStdDevDeltaE, 3) : null,
    meanDeltaE: meanDeltaE !== null ? roundMetric(meanDeltaE, 3) : null,
    color: {
      meanL: lValues.length > 0 ? roundMetric(calculateMean(lValues)!, 3) : null,
      stdDevL: lValues.length > 1 ? roundMetric(calculateSampleStdDev(lValues)!, 3) : null,
      meanA: aValues.length > 0 ? roundMetric(calculateMean(aValues)!, 3) : null,
      stdDevA: aValues.length > 1 ? roundMetric(calculateSampleStdDev(aValues)!, 3) : null,
      meanB: bValues.length > 0 ? roundMetric(calculateMean(bValues)!, 3) : null,
      stdDevB: bValues.length > 1 ? roundMetric(calculateSampleStdDev(bValues)!, 3) : null
    },
    computation: {
      calculationVersion: AGGREGATION_CALCULATION_VERSION,
      calculatedAt: new Date().toISOString()
    }
  };
}

export function aggregateBatchPersozExposed(
  batchId: UUID,
  stageId: UUID,
  panelComputedList: PanelComputedItem<any>[]
): {
  batchId: UUID;
  stageId: UUID;
  meanDampingTime: number | null;
  interPanelStdDev: number | null;
} {
  const exposedItems = panelComputedList.filter(
    (item) => !item.panel || (item.panel.label !== 'T' && item.panel.role !== 'WITNESS' && item.panel.roleCode !== 'T')
  );
  const dampingValues = exposedItems
    .map((item) => item.computed.meanDampingTime)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));

  const mean = calculateMean(dampingValues);
  const std = calculateSampleStdDev(dampingValues);

  return {
    batchId,
    stageId,
    meanDampingTime: mean !== null ? roundMetric(mean, 2) : null,
    interPanelStdDev: std !== null ? roundMetric(std, 2) : null
  };
}
