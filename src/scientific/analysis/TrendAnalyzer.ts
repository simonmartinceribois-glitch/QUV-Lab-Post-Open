/**
 * QUV-Lab — Analyseur Temporel & Détecteur de Tendances (PROMPT 8 - Section 7, 8, 9, 10, 11, 16, 17)
 * Analyse l'évolution temporelle des grandeurs sans recalculer de données primaires.
 * Consomme exclusivement les données COMPUTED générées par le moteur scientifique.
 */

import { Trial, ExposureStage, BatchDefinition } from '../../types/trial';
import { ScientificRuleSet } from '../../types/scientific';
import { TrendFinding, FactualFinding, InterpretationFinding, TrendDirection } from '../../types/analysis';
import { getActiveExposedPanels, getActiveStages } from '../panelUtils';

export interface TemporalKineticsSeries {
  exposureHours: number;
  stageName: string;
  cycleIndex: number;
  stageType: string;
  hasColor: boolean;
  hasGloss: boolean;
  hasPersoz: boolean;
  hasObservations: boolean;
  meanDeltaE?: number | null;
  meanDeltaL?: number | null;
  meanDeltaA?: number | null;
  meanDeltaB?: number | null;
  meanGloss?: number | null;
  meanGlossRetentionPercent?: number | null;
  meanPersozSeconds?: number | null;
  meanPersozDeltaPercent?: number | null;
}

export function extractTemporalKinetics(
  trial: Trial,
  batchId: string
): TemporalKineticsSeries[] {
  const batch = trial.batches.find((b) => b.id === batchId);
  if (!batch) return [];

  // EXCLUSION STRICTE DU TÉMOIN T (conservé à l'obscurité)
  const activeExposedPanels = getActiveExposedPanels(batch.panels);
  const activeStages = getActiveStages(trial.stages);
  const series: TemporalKineticsSeries[] = [];

  for (const stage of activeStages) {
    let deltaESum = 0;
    let deltaLSum = 0;
    let deltaASum = 0;
    let deltaBSum = 0;
    let colorCount = 0;

    let glossSum = 0;
    let glossRetentionSum = 0;
    let glossCount = 0;
    let glossRetentionCount = 0;

    let persozSum = 0;
    let persozDeltaPercentSum = 0;
    let persozCount = 0;
    let persozDeltaCount = 0;

    let obsCount = 0;

    for (const panel of activeExposedPanels) {
      // 1. Couleur
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
          colorCount++;
        }
      }

      // 2. Brillance
      const glossAcq = trial.acquisitions[`${stage.id}__${panel.id}__GLOSS`];
      if (glossAcq && glossAcq.computed) {
        const comp = glossAcq.computed as {
          meanGloss?: number | null;
          retentionRatePercent?: number | null;
        };
        if (comp.meanGloss !== null && comp.meanGloss !== undefined) {
          glossSum += comp.meanGloss;
          glossCount++;
        }
        if (comp.retentionRatePercent !== null && comp.retentionRatePercent !== undefined) {
          glossRetentionSum += comp.retentionRatePercent;
          glossRetentionCount++;
        }
      }

      // 3. Persoz
      const persozAcq = trial.acquisitions[`${stage.id}__${panel.id}__PERSOZ`];
      if (persozAcq && persozAcq.computed) {
        const comp = persozAcq.computed as {
          meanDampingTime?: number | null;
          relativeHardnessVariationPercent?: number | null;
        };
        if (comp.meanDampingTime !== null && comp.meanDampingTime !== undefined) {
          persozSum += comp.meanDampingTime;
          persozCount++;
        }
        if (comp.relativeHardnessVariationPercent !== null && comp.relativeHardnessVariationPercent !== undefined) {
          persozDeltaPercentSum += comp.relativeHardnessVariationPercent;
          persozDeltaCount++;
        }
      }

      // 4. Observations
      const obsAcq = trial.acquisitions[`${stage.id}__${panel.id}__OBSERVATIONS`];
      if (obsAcq && obsAcq.raw) {
        obsCount++;
      }
    }

    if (colorCount > 0 || glossCount > 0 || persozCount > 0 || obsCount > 0) {
      series.push({
        exposureHours: stage.scheduledExposureHours,
        stageName: stage.name,
        cycleIndex: stage.cycleIndex,
        stageType: stage.stageType,
        hasColor: colorCount > 0,
        hasGloss: glossCount > 0,
        hasPersoz: persozCount > 0,
        hasObservations: obsCount > 0,
        meanDeltaE: colorCount > 0 ? +(deltaESum / colorCount).toFixed(2) : null,
        meanDeltaL: colorCount > 0 ? +(deltaLSum / colorCount).toFixed(2) : null,
        meanDeltaA: colorCount > 0 ? +(deltaASum / colorCount).toFixed(2) : null,
        meanDeltaB: colorCount > 0 ? +(deltaBSum / colorCount).toFixed(2) : null,
        meanGloss: glossCount > 0 ? +(glossSum / glossCount).toFixed(1) : null,
        meanGlossRetentionPercent: glossRetentionCount > 0 ? +(glossRetentionSum / glossRetentionCount).toFixed(1) : null,
        meanPersozSeconds: persozCount > 0 ? +(persozSum / persozCount).toFixed(1) : null,
        meanPersozDeltaPercent: persozDeltaCount > 0 ? +(persozDeltaPercentSum / persozDeltaCount).toFixed(1) : null
      });
    }
  }

  return series;
}

function determineTrendDirection(values: (number | null)[]): {
  direction: TrendDirection;
  isMonotone: boolean;
} {
  const cleanVals = values.filter((v): v is number => v !== null && !isNaN(v));
  if (cleanVals.length < 2) {
    return { direction: 'INSUFFICIENT_DATA', isMonotone: false };
  }

  let increasingCount = 0;
  let decreasingCount = 0;
  let stableCount = 0;

  for (let i = 1; i < cleanVals.length; i++) {
    const diff = cleanVals[i] - cleanVals[i - 1];
    if (Math.abs(diff) < 0.05) {
      stableCount++;
    } else if (diff > 0) {
      increasingCount++;
    } else {
      decreasingCount++;
    }
  }

  const totalTransitions = cleanVals.length - 1;
  const isStrictlyMonotone = increasingCount === totalTransitions || decreasingCount === totalTransitions;

  const first = cleanVals[0];
  const last = cleanVals[cleanVals.length - 1];
  const netDelta = last - first;

  if (Math.abs(netDelta) < 0.2) {
    return { direction: 'STABLE', isMonotone: true };
  }

  if (isStrictlyMonotone) {
    return { direction: netDelta > 0 ? 'INCREASING' : 'DECREASING', isMonotone: true };
  }

  // Évolution globale avec variations intermédiaires non monotones
  if (increasingCount > 0 && decreasingCount > 0) {
    return { direction: 'NON_MONOTONE', isMonotone: false };
  }

  return { direction: netDelta > 0 ? 'INCREASING' : 'DECREASING', isMonotone: false };
}

export function analyzeBatchTrends(
  trial: Trial,
  batch: BatchDefinition,
  ruleSet: ScientificRuleSet
): {
  factualFindings: FactualFinding[];
  trends: TrendFinding[];
  interpretations: InterpretationFinding[];
  limitations: string[];
} {
  const series = extractTemporalKinetics(trial, batch.id);
  const factualFindings: FactualFinding[] = [];
  const trends: TrendFinding[] = [];
  const interpretations: InterpretationFinding[] = [];
  const limitations: string[] = [];

  const stageT0 = series.find((s) => s.cycleIndex === 0);
  const finalStage = series.length > 0 ? series[series.length - 1] : undefined;
  const hasIntermediates = series.some((s) => s.cycleIndex > 0 && s.cycleIndex < (finalStage?.cycleIndex ?? 12));

  if (!stageT0) {
    limitations.push('Impossibilité de calculer les variations relatives en raison de l\'absence de mesures initiales T0.');
  }

  if (!hasIntermediates && series.length > 1) {
    limitations.push('La série temporelle intermédiaire est incomplète ou absente entre T0 et l\'étape finale.');
  }

  // --------------------------------------------------------------------------
  // 1. ANALYSE COULEUR (Section 7)
  // --------------------------------------------------------------------------
  const deltaEVals = series.map((s) => s.meanDeltaE ?? null);
  const deltaBVals = series.map((s) => s.meanDeltaB ?? null);
  const deltaLVals = series.map((s) => s.meanDeltaL ?? null);

  if (finalStage && finalStage.meanDeltaE !== null && finalStage.meanDeltaE !== undefined) {
    factualFindings.push({
      id: `FACT-COLOR-${batch.reference}`,
      level: 3,
      familyId: 'COLOR',
      title: `Variation colorimétrique globale (${batch.reference})`,
      description: `Une variation colorimétrique globale de ΔE*ab = ${finalStage.meanDeltaE.toFixed(2)} est observée à ${finalStage.exposureHours} h par rapport aux mesures initiales avant exposition.`,
      initialValue: 0,
      finalValue: finalStage.meanDeltaE,
      deltaValue: finalStage.meanDeltaE,
      unit: '',
      confidence: 'CERTAIN'
    });

    if (finalStage.meanDeltaB !== null && finalStage.meanDeltaB !== undefined) {
      if (finalStage.meanDeltaB > 0.5) {
        factualFindings.push({
          id: `FACT-COLOR-B-${batch.reference}`,
          level: 3,
          familyId: 'COLOR',
          title: `Évolution de l'axe jaune-bleu b* (${batch.reference})`,
          description: `Une augmentation de la composante b* de +${finalStage.meanDeltaB.toFixed(2)} est observée, correspondant à une évolution vers les valeurs positives de l'axe bleu-jaune.`,
          initialValue: 0,
          finalValue: finalStage.meanDeltaB,
          deltaValue: finalStage.meanDeltaB,
          unit: '',
          confidence: 'CERTAIN'
        });

        interpretations.push({
          id: `INTERP-COLOR-B-${batch.reference}`,
          level: 5,
          familyId: 'COLOR',
          title: 'Tendance au jaunissement',
          hypothesis: 'Cette évolution est compatible avec une tendance au jaunissement du revêtement sous exposition UV.',
          caveat: '⚠ Cette interprétation descriptive ne constitue pas la preuve d\'un mécanisme photochimique particulier sans analyse spectroscopique complémentaire.',
          provenance: 'LAB_HYPOTHESIS'
        });
      } else if (finalStage.meanDeltaB < -0.5) {
        factualFindings.push({
          id: `FACT-COLOR-B-NEG-${batch.reference}`,
          level: 3,
          familyId: 'COLOR',
          title: `Évolution de l'axe jaune-bleu b* (${batch.reference})`,
          description: `Une diminution de la composante b* de ${finalStage.meanDeltaB.toFixed(2)} est observée, orientée vers les valeurs négatives de l'axe bleu-jaune.`,
          confidence: 'CERTAIN'
        });
      }
    }

    if (finalStage.meanDeltaL !== null && finalStage.meanDeltaL !== undefined) {
      if (finalStage.meanDeltaL < -0.5) {
        factualFindings.push({
          id: `FACT-COLOR-L-${batch.reference}`,
          level: 3,
          familyId: 'COLOR',
          title: `Évolution de la clarté L* (${batch.reference})`,
          description: `Une diminution de la clarté L* de ${finalStage.meanDeltaL.toFixed(2)} est constatée entre T0 et ${finalStage.exposureHours} h.`,
          confidence: 'CERTAIN'
        });
        interpretations.push({
          id: `INTERP-COLOR-L-${batch.reference}`,
          level: 5,
          familyId: 'COLOR',
          title: 'Évolution de la clarté',
          hypothesis: 'Cette diminution de L* est compatible avec un assombrissement superficiel de la lasure ou du subjectile bois.',
          caveat: '⚠ Aucune dégradation structurelle n\'est démontrée par cette seule variation métrologique.',
          provenance: 'LAB_HYPOTHESIS'
        });
      }
    }

    // Tendance temporelle couleur
    if (series.length >= 3) {
      const colorTrend = determineTrendDirection(deltaEVals);
      trends.push({
        id: `TREND-COLOR-${batch.reference}`,
        level: 4,
        familyId: 'COLOR',
        metric: 'ΔE*ab',
        direction: colorTrend.direction,
        title: `Tendance temporelle ΔE*ab (${batch.reference})`,
        factualDescription: colorTrend.isMonotone
          ? `Une augmentation progressive de la variation globale ΔE*ab est observée sur l'ensemble de la série temporelle disponible (jusqu'à ${finalStage.exposureHours} h).`
          : `L'évolution de la variation globale ΔE*ab est non monotone sur les étapes intermédiaires disponibles, atteignant ${finalStage.meanDeltaE.toFixed(2)} à ${finalStage.exposureHours} h.`,
        intermediatePointsCount: series.length,
        isMonotone: colorTrend.isMonotone
      });
    }
  }

  // --------------------------------------------------------------------------
  // 2. ANALYSE BRILLANCE (Section 8)
  // --------------------------------------------------------------------------
  const glossVals = series.map((s) => s.meanGloss ?? null);

  if (stageT0?.meanGloss !== null && stageT0?.meanGloss !== undefined && finalStage?.meanGloss !== null && finalStage?.meanGloss !== undefined) {
    const g0 = stageT0.meanGloss;
    const gf = finalStage.meanGloss;
    const deltaG = +(gf - g0).toFixed(1);

    if (g0 === 0) {
      factualFindings.push({
        id: `FACT-GLOSS-ZERO-${batch.reference}`,
        level: 3,
        familyId: 'GLOSS',
        title: 'Brillance initiale nulle',
        description: 'La brillance initiale à T0 est de 0,0 GU. RÉTENTION NON CALCULABLE (Cause : valeur de référence nulle).',
        confidence: 'CERTAIN'
      });
    } else {
      const retention = finalStage.meanGlossRetentionPercent ?? +( (gf / g0) * 100 ).toFixed(1);

      factualFindings.push({
        id: `FACT-GLOSS-${batch.reference}`,
        level: 3,
        familyId: 'GLOSS',
        title: `Évolution de la brillance à 60° (${batch.reference})`,
        description: `La brillance à 60° évolue de ${g0.toFixed(1)} GU à ${gf.toFixed(1)} GU (ΔG = ${deltaG > 0 ? '+' : ''}${deltaG.toFixed(1)} GU), correspondant à une rétention relative calculée de ${retention.toFixed(1)} %.`,
        initialValue: g0,
        finalValue: gf,
        deltaValue: deltaG,
        unit: 'GU',
        confidence: 'CERTAIN'
      });

      interpretations.push({
        id: `INTERP-GLOSS-${batch.reference}`,
        level: 5,
        familyId: 'GLOSS',
        title: 'Modification de l\'état de surface',
        hypothesis: deltaG < 0
          ? 'La diminution de brillance peut être compatible avec une modification micrométrique de la rugosité ou de l\'état de surface du film de finition.'
          : 'Le maintien ou gain de brillance peut suggérer une relative stabilité optique du film protecteur.',
        caveat: '⚠ Cette constatation physique ne constitue pas la démonstration d\'un mécanisme chimique de dégradation du liant.',
        provenance: 'LAB_HYPOTHESIS'
      });
    }

    // Tendance temporelle brillance
    if (series.length >= 3) {
      const glossTrend = determineTrendDirection(glossVals);
      trends.push({
        id: `TREND-GLOSS-${batch.reference}`,
        level: 4,
        familyId: 'GLOSS',
        metric: 'Brillance 60°',
        direction: glossTrend.direction,
        title: `Tendance temporelle brillance 60° (${batch.reference})`,
        factualDescription: glossTrend.direction === 'DECREASING' && glossTrend.isMonotone
          ? 'Une diminution progressive et régulière de la brillance est observée sur la série temporelle disponible.'
          : glossTrend.direction === 'NON_MONOTONE'
          ? 'L\'évolution de la brillance est non monotone sur les étapes intermédiaires disponibles, avec une valeur finale inférieure à la valeur initiale.'
          : 'La brillance présente une stabilité relative sur les étapes mesurées.',
        intermediatePointsCount: series.length,
        isMonotone: glossTrend.isMonotone
      });
    }
  }

  // --------------------------------------------------------------------------
  // 3. ANALYSE PERSOZ (Section 9 - LAB_RECOMMENDATION)
  // --------------------------------------------------------------------------
  const persozVals = series.map((s) => s.meanPersozSeconds ?? null);

  if (stageT0?.meanPersozSeconds !== null && stageT0?.meanPersozSeconds !== undefined && finalStage?.meanPersozSeconds !== null && finalStage?.meanPersozSeconds !== undefined) {
    const p0 = stageT0.meanPersozSeconds;
    const pf = finalStage.meanPersozSeconds;
    const deltaP = +(pf - p0).toFixed(1);
    const deltaPercent = finalStage.meanPersozDeltaPercent ?? +( ((pf - p0) / p0) * 100 ).toFixed(1);

    factualFindings.push({
      id: `FACT-PERSOZ-${batch.reference}`,
      level: 3,
      familyId: 'PERSOZ',
      title: `Dureté pendulaire Persoz (${batch.reference}) [LAB_RECOMMENDATION]`,
      description: `La dureté pendulaire Persoz (mesure complémentaire de laboratoire) évolue de ${p0.toFixed(1)} s à ${pf.toFixed(1)} s, soit une variation de ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(1)} s (${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)} %).`,
      initialValue: p0,
      finalValue: pf,
      deltaValue: deltaP,
      unit: 's',
      confidence: 'CERTAIN'
    });

    interpretations.push({
      id: `INTERP-PERSOZ-${batch.reference}`,
      level: 5,
      familyId: 'PERSOZ',
      title: 'Évolution de la dureté superficielle',
      hypothesis: deltaP < 0
        ? 'Cette évolution peut être compatible avec une modification de la cohésion ou des propriétés mécaniques superficielles du revêtement.'
        : 'Cette augmentation de dureté peut suggérer un durcissement superficiel ou une réticulation résiduelle sous rayonnement thermique/UV.',
      caveat: '⚠ Rappel normatif : la dureté Persoz est un indicateur de laboratoire (ISO 1522 / recommandation interne) et ne fait pas l\'objet de critères de conformité dans la NF EN 927-6.',
      provenance: 'LAB_HYPOTHESIS'
    });

    if (series.length >= 3) {
      const pTrend = determineTrendDirection(persozVals);
      trends.push({
        id: `TREND-PERSOZ-${batch.reference}`,
        level: 4,
        familyId: 'PERSOZ',
        metric: 'Dureté Persoz',
        direction: pTrend.direction,
        title: `Tendance temporelle dureté Persoz (${batch.reference})`,
        factualDescription: pTrend.isMonotone && pTrend.direction === 'DECREASING'
          ? 'Une diminution continue du temps d\'amortissement Persoz est observée sur les cycles d\'exposition disponibles.'
          : 'L\'amortissement Persoz présente une variation globale mesurable entre les mesures initiales et les mesures en cours/fin d\'exposition.',
        intermediatePointsCount: series.length,
        isMonotone: pTrend.isMonotone
      });
    }
  }

  // --------------------------------------------------------------------------
  // 4. OBSERVATIONS VISUELLES (Section 10)
  // --------------------------------------------------------------------------
  const actualFinalStage = trial.stages.find((s) => s.stageType === 'FINAL_POST_EXPOSURE')
    || [...trial.stages].sort((a, b) => b.scheduledExposureHours - a.scheduledExposureHours)[0];

  if (actualFinalStage) {
    let recordedObsCount = 0;
    let blisteringMax = 0;
    let flakingMax = 0;
    let crackingMax = 0;
    let chalkingMax = 0;

    for (const panel of getActiveExposedPanels(batch.panels)) {
      const obsAcq = trial.acquisitions[`${actualFinalStage.id}__${panel.id}__OBSERVATIONS`];
      if (obsAcq && obsAcq.raw) {
        recordedObsCount++;
        const rawObs = obsAcq.raw as { observations?: Array<{ category: string; rating: number }> };
        if (rawObs.observations) {
          for (const item of rawObs.observations) {
            if (item.category === 'BLISTERING') blisteringMax = Math.max(blisteringMax, item.rating);
            if (item.category === 'FLAKING') flakingMax = Math.max(flakingMax, item.rating);
            if (item.category === 'CRACKING') crackingMax = Math.max(crackingMax, item.rating);
            if (item.category === 'CHALKING') chalkingMax = Math.max(chalkingMax, item.rating);
          }
        }
      }
    }

    if (recordedObsCount > 0) {
      const obsList: string[] = [];
      obsList.push(`Cloquage (ISO 4628-2) : ${blisteringMax === 0 ? 'aucun cloquage enregistré (cotation 0)' : `cotation maximale ${blisteringMax}`}`);
      obsList.push(`Écaillage (ISO 4628-5) : ${flakingMax === 0 ? 'aucun écaillage enregistré (cotation 0)' : `cotation maximale ${flakingMax}`}`);
      obsList.push(`Craquelage (ISO 4628-4) : ${crackingMax === 0 ? 'aucun craquelage enregistré (cotation 0)' : `cotation maximale ${crackingMax}`}`);
      obsList.push(`Farinage (ISO 4628-6) : ${chalkingMax === 0 ? 'aucun farinage enregistré (cotation 0)' : `cotation maximale ${chalkingMax}`}`);

      factualFindings.push({
        id: `FACT-OBS-${batch.reference}`,
        level: 3,
        familyId: 'OBSERVATIONS',
        title: `Observations visuelles enregistrées (${batch.reference})`,
        description: `Examen visuel à ${actualFinalStage.scheduledExposureHours} h : ${obsList.join(' ; ')}.`,
        confidence: 'CERTAIN'
      });
    } else {
      limitations.push(`Aucune observation visuelle n'a été saisie pour le lot ${batch.reference} à cette étape.`);
    }
  }

  return {
    factualFindings,
    trends,
    interpretations,
    limitations
  };
}
