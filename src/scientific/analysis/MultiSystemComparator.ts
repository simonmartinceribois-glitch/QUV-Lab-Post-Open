/**
 * QUV-Lab — Comparateur Multi-Systèmes & Inter-Lots (PROMPT 8 - Section 14, 15, 31, 33, 34, 35)
 * Compare les différents lots et systèmes à une même étape d'exposition sans porter de jugement commercial
 * et sans inventer de hiérarchie qualitative.
 */

import { Trial, ExposureStage, BatchDefinition } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { SystemComparisonItem, DescriptiveRanking, ComparisonResult } from '../../types/analysis';
import { calculateStdDevByMethod, calculateCoefficientOfVariation } from '../statistics';
import { getActiveExposedPanels } from '../panelUtils';

export function compareSystemsAtStage(
  trial: Trial,
  stageId: string,
  ruleSet: ScientificRuleSet,
  batchIds?: string[]
): ComparisonResult {
  const stage = trial.stages.find((s) => s.id === stageId) || trial.stages[0];
  const targetBatches = batchIds && batchIds.length > 0
    ? trial.batches.filter((b) => batchIds.includes(b.id))
    : trial.batches;

  const items: SystemComparisonItem[] = [];
  const incompatibilities: string[] = [];
  const limitations: string[] = [];

  for (const batch of targetBatches) {
    // Exclusion absolue du Témoin T
    const activePanels = getActiveExposedPanels(batch.panels);
    const item: SystemComparisonItem = {
      batchId: batch.id,
      batchReference: batch.reference,
      productReference: batch.productReference,
      woodSpecies: batch.woodSpecies,
      manufacturerOrSupplier: batch.manufacturerOrSupplier,
      coatingSystem: batch.coatingSystem,
      panelCount: batch.panels.length,
      activePanelsCount: activePanels.length,
      isComplete: true
    };

    // 1. Couleur
    let deltaESum = 0;
    let deltaLSum = 0;
    let deltaASum = 0;
    let deltaBSum = 0;
    let colorCount = 0;
    const deltaEList: number[] = [];

    for (const panel of activePanels) {
      const colorAcq = trial.acquisitions[`${stage.id}__${panel.id}__COLOR`];
      if (colorAcq && colorAcq.computed) {
        const comp = colorAcq.computed as {
          deltaE?: number | null; deltaL?: number | null; deltaA?: number | null; deltaB?: number | null;
        };
        if (
          comp.deltaE !== null && comp.deltaE !== undefined &&
          comp.deltaL !== null && comp.deltaL !== undefined &&
          comp.deltaA !== null && comp.deltaA !== undefined &&
          comp.deltaB !== null && comp.deltaB !== undefined
        ) {
          deltaESum += comp.deltaE;
          deltaLSum += comp.deltaL;
          deltaASum += comp.deltaA;
          deltaBSum += comp.deltaB;
          deltaEList.push(comp.deltaE);
          colorCount++;
        }
      }
    }

    if (colorCount > 0) {
      const meanDeltaE = +(deltaESum / colorCount).toFixed(2);
      const stdDevDeltaE = calculateStdDevByMethod(deltaEList, ruleSet.statisticalRules?.stdDevMethod);
      item.color = {
        meanDeltaE,
        meanDeltaL: +(deltaLSum / colorCount).toFixed(2),
        meanDeltaA: +(deltaASum / colorCount).toFixed(2),
        meanDeltaB: +(deltaBSum / colorCount).toFixed(2),
        stdDevDeltaE: stdDevDeltaE !== null ? +stdDevDeltaE.toFixed(2) : null
      };
    } else {
      item.isComplete = false;
    }

    // 2. Brillance
    let glossInitialSum = 0;
    let glossInitialCount = 0;
    let glossCurrentSum = 0;
    let glossDeltaSum = 0;
    let glossDeltaCount = 0;
    let glossRetentionSum = 0;
    let glossCount = 0;
    let retentionCalculable = true;
    let uncalculableReason: string | undefined;
    const glossList: number[] = [];

    for (const panel of activePanels) {
      const glossAcq = trial.acquisitions[`${stage.id}__${panel.id}__GLOSS`];
      if (glossAcq && glossAcq.computed) {
        const comp = glossAcq.computed as {
          meanGloss?: number | null;
          deltaGloss?: number | null;
          retentionRatePercent?: number | null;
        };
        if (comp.meanGloss !== null && comp.meanGloss !== undefined) {
          glossCurrentSum += comp.meanGloss;
          glossList.push(comp.meanGloss);
          glossCount++;
        }
        if (comp.deltaGloss !== null && comp.deltaGloss !== undefined) {
          glossDeltaSum += comp.deltaGloss;
          glossDeltaCount++;
          // Valeur de référence T0 dérivée : meanGloss = référence + deltaGloss
          if (comp.meanGloss !== null && comp.meanGloss !== undefined) {
            glossInitialSum += comp.meanGloss - comp.deltaGloss;
            glossInitialCount++;
          }
        }
        if (comp.retentionRatePercent !== null && comp.retentionRatePercent !== undefined) {
          glossRetentionSum += comp.retentionRatePercent;
        } else if (comp.deltaGloss !== null && comp.deltaGloss !== undefined) {
          // Un ΔGloss existe mais pas de rétention : le moteur a explicitement signalé une référence T0 nulle
          retentionCalculable = false;
          uncalculableReason = 'Valeur de référence T0 nulle ou non disponible (voir alertes de la mesure)';
        }
      }
    }

    if (glossCount > 0) {
      const meanCurrent = +(glossCurrentSum / glossCount).toFixed(1);
      const meanInitial = glossInitialCount > 0 ? +(glossInitialSum / glossInitialCount).toFixed(1) : null;
      const meanDelta = glossDeltaCount > 0 ? +(glossDeltaSum / glossDeltaCount).toFixed(1) : null;
      const meanRetention = retentionCalculable && glossDeltaCount > 0 ? +(glossRetentionSum / glossDeltaCount).toFixed(1) : null;

      const stdDev = calculateStdDevByMethod(glossList, ruleSet.statisticalRules?.stdDevMethod);
      const cv = calculateCoefficientOfVariation(glossList, ruleSet.statisticalRules?.stdDevMethod);

      item.gloss = {
        meanInitialGU: meanInitial,
        meanCurrentGU: meanCurrent,
        meanDeltaGloss: meanDelta,
        glossRetentionPercent: meanRetention,
        retentionCalculable,
        reasonIfUncalculable: uncalculableReason,
        stdDevGloss: stdDev !== null ? +stdDev.toFixed(1) : null,
        cvPercent: cv !== null ? +cv.toFixed(1) : null
      };
    }

    // 3. Persoz
    let persozInitialSum = 0;
    let persozCurrentSum = 0;
    let persozDeltaSum = 0;
    let persozDeltaPercentSum = 0;
    let persozCount = 0;
    const persozList: number[] = [];

    for (const panel of activePanels) {
      const persozAcq = trial.acquisitions[`${stage.id}__${panel.id}__PERSOZ`];
      if (persozAcq && persozAcq.computed) {
        const comp = persozAcq.computed as {
          meanDampingTime?: number | null;
          deltaDampingTime?: number | null;
          relativeHardnessVariationPercent?: number | null;
        };
        if (comp.meanDampingTime !== null && comp.meanDampingTime !== undefined) {
          persozCurrentSum += comp.meanDampingTime;
          persozList.push(comp.meanDampingTime);
          persozCount++;
        }
        if (comp.deltaDampingTime !== null && comp.deltaDampingTime !== undefined) {
          persozDeltaSum += comp.deltaDampingTime;
        }
        if (comp.relativeHardnessVariationPercent !== null && comp.relativeHardnessVariationPercent !== undefined) {
          persozDeltaPercentSum += comp.relativeHardnessVariationPercent;
        }
      }
    }

    if (persozCount > 0) {
      const meanCurrent = +(persozCurrentSum / persozCount).toFixed(1);
      const stdDev = calculateStdDevByMethod(persozList, ruleSet.statisticalRules?.stdDevMethod);
      const cv = calculateCoefficientOfVariation(persozList, ruleSet.statisticalRules?.stdDevMethod);

      item.persoz = {
        meanInitialSeconds: null,
        meanCurrentSeconds: meanCurrent,
        deltaSeconds: +(persozDeltaSum / persozCount).toFixed(1),
        persozDeltaPercent: +(persozDeltaPercentSum / persozCount).toFixed(1),
        stdDevSeconds: stdDev !== null ? +stdDev.toFixed(1) : null,
        cvPercent: cv !== null ? +cv.toFixed(1) : null
      };
    }

    // 4. Observations
    let blisteringMax = 0;
    let flakingMax = 0;
    let crackingMax = 0;
    let chalkingMax = 0;
    let hasObs = false;

    for (const panel of activePanels) {
      const obsAcq = trial.acquisitions[`${stage.id}__${panel.id}__OBSERVATIONS`];
      if (obsAcq && obsAcq.raw) {
        hasObs = true;
        const rawObs = obsAcq.raw as { observations?: Array<{ category: string; rating: number }> };
        if (rawObs.observations) {
          for (const obs of rawObs.observations) {
            if (obs.category === 'BLISTERING') blisteringMax = Math.max(blisteringMax, obs.rating);
            if (obs.category === 'FLAKING') flakingMax = Math.max(flakingMax, obs.rating);
            if (obs.category === 'CRACKING') crackingMax = Math.max(crackingMax, obs.rating);
            if (obs.category === 'CHALKING') chalkingMax = Math.max(chalkingMax, obs.rating);
          }
        }
      }
    }

    if (hasObs) {
      const defects: string[] = [];
      if (blisteringMax > 0) defects.push(`Cloquage coté ${blisteringMax}`);
      if (flakingMax > 0) defects.push(`Écaillage coté ${flakingMax}`);
      if (crackingMax > 0) defects.push(`Craquelage coté ${crackingMax}`);
      if (chalkingMax > 0) defects.push(`Farinage coté ${chalkingMax}`);

      item.observations = {
        summary: defects.length === 0 ? 'Aucun défaut majeur coté (cotations 0)' : defects.join(', '),
        blisteringRating: blisteringMax,
        flakingRating: flakingMax,
        crackingRating: crackingMax,
        chalkingRating: chalkingMax,
        hasRecordedData: true
      };
    } else {
      item.observations = {
        summary: 'Données non renseignées',
        blisteringRating: 0,
        flakingRating: 0,
        crackingRating: 0,
        chalkingRating: 0,
        hasRecordedData: false
      };
    }

    items.push(item);
  }

  // --------------------------------------------------------------------------
  // CLASSEMENTS DESCRIPTIFS STRICTEMENT FACTUELS (Section 15)
  // --------------------------------------------------------------------------
  const rankings: DescriptiveRanking[] = [];

  // Couleur ΔE*ab
  const colorItems = items.filter((i) => i.color?.meanDeltaE !== null && i.color?.meanDeltaE !== undefined);
  if (colorItems.length >= 2) {
    const sorted = [...colorItems].sort((a, b) => a.color!.meanDeltaE! - b.color!.meanDeltaE!);
    const lowest = sorted[0];
    const highest = sorted[sorted.length - 1];

    rankings.push({
      familyId: 'COLOR',
      metric: 'ΔE*ab',
      metricLabel: 'Variation colorimétrique globale (ΔE*ab)',
      lowestBatchRef: lowest.batchReference,
      lowestValue: lowest.color!.meanDeltaE!,
      highestBatchRef: highest.batchReference,
      highestValue: highest.color!.meanDeltaE!,
      factualStatement: `Le système ${lowest.batchReference} présente la valeur moyenne de ΔE*ab la plus faible (${lowest.color!.meanDeltaE!.toFixed(2)}) et le système ${highest.batchReference} présente la valeur la plus élevée (${highest.color!.meanDeltaE!.toFixed(2)}) parmi les systèmes comparés à ${stage.scheduledExposureHours} h.`
    });
  }

  // Brillance : Rétention %
  const glossItems = items.filter((i) => i.gloss?.glossRetentionPercent !== null && i.gloss?.glossRetentionPercent !== undefined && i.gloss.retentionCalculable);
  if (glossItems.length >= 2) {
    const sorted = [...glossItems].sort((a, b) => b.gloss!.glossRetentionPercent! - a.gloss!.glossRetentionPercent!);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    rankings.push({
      familyId: 'GLOSS',
      metric: 'glossRetentionPercent',
      metricLabel: 'Rétention de brillance 60° (%)',
      lowestBatchRef: lowest.batchReference,
      lowestValue: lowest.gloss!.glossRetentionPercent!,
      highestBatchRef: highest.batchReference,
      highestValue: highest.gloss!.glossRetentionPercent!,
      factualStatement: `Le système ${highest.batchReference} présente la rétention de brillance la plus élevée (${highest.gloss!.glossRetentionPercent!.toFixed(1)} %) et le système ${lowest.batchReference} la rétention la plus faible (${lowest.gloss!.glossRetentionPercent!.toFixed(1)} %) parmi les lots disposant de données complètes à ${stage.scheduledExposureHours} h.`
    });
  }

  // Persoz : Variation relative %
  const persozItems = items.filter((i) => i.persoz?.persozDeltaPercent !== null && i.persoz?.persozDeltaPercent !== undefined);
  if (persozItems.length >= 2) {
    const sorted = [...persozItems].sort((a, b) => b.persoz!.persozDeltaPercent! - a.persoz!.persozDeltaPercent!);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];

    rankings.push({
      familyId: 'PERSOZ',
      metric: 'persozDeltaPercent',
      metricLabel: 'Variation relative de dureté Persoz (%) [LAB_RECOMMENDATION]',
      lowestBatchRef: lowest.batchReference,
      lowestValue: lowest.persoz!.persozDeltaPercent!,
      highestBatchRef: highest.batchReference,
      highestValue: highest.persoz!.persozDeltaPercent!,
      factualStatement: `L'évolution relative de la dureté Persoz s'échelonne de ${lowest.persoz!.persozDeltaPercent! > 0 ? '+' : ''}${lowest.persoz!.persozDeltaPercent!.toFixed(1)} % (${lowest.batchReference}) à ${highest.persoz!.persozDeltaPercent! > 0 ? '+' : ''}${highest.persoz!.persozDeltaPercent!.toFixed(1)} % (${highest.batchReference}) à cette étape.`
    });
  }

  if (items.some((i) => !i.isComplete)) {
    limitations.push('Certains systèmes comportent des données partielles à cette étape, limitant l\'exhaustivité de la comparaison descriptive.');
  }

  return {
    stageId: stage.id,
    stageName: stage.name,
    exposureHours: stage.scheduledExposureHours,
    items,
    rankings,
    incompatibilities,
    limitations
  };
}
