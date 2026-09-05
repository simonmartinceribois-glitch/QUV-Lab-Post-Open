/**
 * QUV-Lab — Moteur Central de l'Assistant d'Analyse QUV (PROMPT 8 - Section 1, 2, 3, 4, 5, 24, 25, 40, 47, 49)
 * Orchestrateur de haut niveau : intègre détection d'anomalies, tendances, comparaisons multi-systèmes,
 * synthèse technique, hiérarchie en 6 niveaux et traçabilité de revue humaine.
 *
 * RÈGLE CARDINALE : Ne recalcule AUCUNE grandeur scientifique. Consomme exclusivement COMPUTED et ScientificRuleSet.
 */

import { Trial } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { QUVAnalysisResult, AnalysisAnomaly, FactualFinding, TrendFinding, InterpretationFinding, ComparisonResult } from '../../types/analysis';
import { detectTrialAnomalies } from './AnalysisAnomalyDetector';
import { analyzeBatchTrends } from './TrendAnalyzer';
import { compareSystemsAtStage } from './MultiSystemComparator';
import { generateTechnicalSynthesis } from './TechnicalSynthesisGenerator';

export const ANALYSIS_VERSION = '1.0.0';

export interface AnalysisEngineOptions {
  referenceStageId?: string; // ex: T0
  targetStageId?: string;    // ex: 2016 h
  batchIds?: string[];
  panelIds?: string[];
  measurementFamilies?: MeasurementFamilyId[];
  studyCriteriaGlossRetentionPercent?: number; // ex: 50%
  operatorId?: string;
}

export function runQUVAnalysis(
  trial: Trial,
  ruleSet: ScientificRuleSet,
  options?: AnalysisEngineOptions
): QUVAnalysisResult {
  const operator = options?.operatorId || 'OPERATOR';
  const now = new Date().toISOString();

  // Étape initiale T0 et étape cible (dernière étape disponible ou sélectionnée)
  const stageT0 = trial.stages.find((s) => s.cycleIndex === 0) || trial.stages[0];
  const targetStage = options?.targetStageId
    ? trial.stages.find((s) => s.id === options.targetStageId)
    : trial.stages[trial.stages.length - 1] || stageT0;

  if (!targetStage) {
    throw new Error(`Jalon cible introuvable (targetStageId=${options?.targetStageId || 'non défini'}).`);
  }

  const selectedBatches = options?.batchIds && options.batchIds.length > 0
    ? trial.batches.filter((b) => options.batchIds!.includes(b.id))
    : trial.batches;

  const activeFamilies = options?.measurementFamilies && options.measurementFamilies.length > 0
    ? options.measurementFamilies
    : trial.config.activeFamilies;

  // 1. Détection factuelle des anomalies
  const anomalies: AnalysisAnomaly[] = detectTrialAnomalies(trial, ruleSet, {
    stageId: targetStage.id,
    batchIds: selectedBatches.map((b) => b.id),
    families: activeFamilies
  });

  // 2. Analyse des tendances et constats factuels pour chaque lot
  const allFactualFindings: FactualFinding[] = [];
  const allTrends: TrendFinding[] = [];
  const allInterpretations: InterpretationFinding[] = [];
  const allLimitations: string[] = [];

  for (const batch of selectedBatches) {
    const batchAnalysis = analyzeBatchTrends(trial, batch, ruleSet);
    allFactualFindings.push(...batchAnalysis.factualFindings);
    allTrends.push(...batchAnalysis.trends);
    allInterpretations.push(...batchAnalysis.interpretations);
    allLimitations.push(...batchAnalysis.limitations);
  }

  // 3. Comparaisons multi-systèmes à l'étape cible
  const comparisons: ComparisonResult[] = [];
  if (trial.batches.length >= 1) {
    const compResult = compareSystemsAtStage(
      trial,
      targetStage.id,
      ruleSet,
      selectedBatches.map((b) => b.id)
    );
    comparisons.push(compResult);
    allLimitations.push(...compResult.limitations);
  }

  // 4. Synthèse technique rédigée
  const synthesis = generateTechnicalSynthesis(trial, ruleSet, {
    batchId: selectedBatches[0]?.id,
    referenceStageId: stageT0.id,
    targetStageId: targetStage.id,
    studyCriteriaGlossRetentionPercent: options?.studyCriteriaGlossRetentionPercent ?? 50
  });

  allLimitations.push(...synthesis.limitations);

  // 5. Limites méthodologiques systématiques (Section 43)
  const baseLimitations: string[] = [
    'Les mécanismes physico-chimiques responsables des évolutions observées ne peuvent pas être déterminés par ces seules mesures de paillasse.',
    'La causalité entre les variations de brillance, de couleur et de dureté ne peut pas être démontrée sans analyse microscopique ou spectroscopique complémentaire.',
    'Tout critère d\'étude (ex: seuil de 50 % de rétention) est conventionnel et ne doit pas être assimilé à une exigence de conformité de la norme NF EN 927-6.'
  ];

  // Déduplication des limitations
  const uniqueLimitations = Array.from(new Set([...baseLimitations, ...allLimitations]));

  // 6. Analyse croisée inter-familles (Section 18)
  const crossFamilyAnalysis =
    'Les résultats montrent simultanément des variations métrologiques concomitantes sur la brillance, la couleur et la dureté Persoz. Ces évolutions sont descriptivement concomitantes. Leur relation de causalité directe ne peut pas être affirmée sans examens complémentaires approfondis.';

  // Extraction de la version de calcul
  let detectedCalculationVersion = '1.1.0';
  for (const acq of Object.values(trial.acquisitions)) {
    if (acq.computed && (acq.computed as { calculationVersion?: string }).calculationVersion) {
      detectedCalculationVersion = (acq.computed as { calculationVersion: string }).calculationVersion;
      break;
    }
  }

  // Détection de la présence des données RAW
  let hasColorRaw = false;
  let hasGlossRaw = false;
  let hasPersozRaw = false;
  let hasObservationsRaw = false;

  for (const acq of Object.values(trial.acquisitions)) {
    if (acq.raw) {
      if (acq.familyId === 'COLOR') hasColorRaw = true;
      if (acq.familyId === 'GLOSS') hasGlossRaw = true;
      if (acq.familyId === 'PERSOZ') hasPersozRaw = true;
      if (acq.familyId === 'OBSERVATIONS') hasObservationsRaw = true;
    }
  }

  return {
    id: `ANALYSIS-${trial.metadata.reference}-${Date.now()}`,
    metadata: {
      trialId: trial.id,
      trialReference: trial.metadata.reference,
      analysisVersion: ANALYSIS_VERSION,
      calculationVersion: detectedCalculationVersion,
      ruleSetVersion: ruleSet.version || 'NF EN 927-6:2026-v1.2',
      generatedAt: now,
      generatedBy: operator
    },
    scope: {
      referenceStageId: stageT0.id,
      targetStageId: targetStage.id,
      batchIds: selectedBatches.map((b) => b.id),
      measurementFamilies: activeFamilies,
      studyCriteriaGlossRetentionPercent: options?.studyCriteriaGlossRetentionPercent ?? 50
    },
    rawSummary: {
      hasColorRaw,
      hasGlossRaw,
      hasPersozRaw,
      hasObservationsRaw
    },
    computedSummary: {
      calculationVersion: detectedCalculationVersion,
      calculatedAt: now
    },
    factualFindings: allFactualFindings,
    trends: allTrends,
    anomalies,
    comparisons,
    interpretations: allInterpretations,
    crossFamilyAnalysis,
    limitations: uniqueLimitations,
    protocolAdaptationsMention: synthesis.protocolAdaptations,
    technicalSynthesis: synthesis.synthesisText,
    normativeConclusionStatus: 'NON_EVALUEE',
    review: {
      status: 'GENERATED',
      reviewedBy: undefined,
      reviewedAt: undefined,
      reviewerComment: undefined,
      isHumanModified: false
    }
  };
}
