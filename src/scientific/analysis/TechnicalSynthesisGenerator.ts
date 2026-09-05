/**
 * QUV-Lab — Générateur de Synthèse Technique (PROMPT 8 - Section 19, 20, 21, 22, 23, 45, 51)
 * Rédige une synthèse technique factuelle et concise de 6 phrases maximum, conforme aux pratiques
 * de rédaction de rapports scientifiques de laboratoire d'essais (CERIBOIS / FCBA).
 */

import { Trial, BatchDefinition, ExposureStage } from '../../types/trial';
import { ScientificRuleSet } from '../../types/scientific';
import { extractTemporalKinetics } from './TrendAnalyzer';
import { getActiveExposedPanels } from '../panelUtils';

export interface TechnicalSynthesisOptions {
  batchId?: string;
  referenceStageId?: string;
  targetStageId?: string;
  studyCriteriaGlossRetentionPercent?: number; // ex: 50
  maxSentences?: number;
}

export function generateTechnicalSynthesis(
  trial: Trial,
  ruleSet: ScientificRuleSet,
  options?: TechnicalSynthesisOptions
): {
  synthesisText: string;
  sentenceCount: number;
  limitations: string[];
  protocolAdaptations: string[];
} {
  const sentences: string[] = [];
  const limitations: string[] = [];
  const protocolAdaptations: string[] = [];

  // Sélection du lot principal ou premier lot
  const targetBatch: BatchDefinition | undefined = options?.batchId
    ? trial.batches.find((b) => b.id === options.batchId)
    : trial.batches[0];

  if (!targetBatch) {
    return {
      synthesisText: 'Aucun lot de panneaux n\'est défini pour cet essai.',
      sentenceCount: 1,
      limitations: ['Absence de lots dans l\'essai'],
      protocolAdaptations: []
    };
  }

  // Étape de référence (T0) et étape finale/cible
  const stageT0 = trial.stages.find((s) => s.cycleIndex === 0) || trial.stages[0];
  const targetStage = options?.targetStageId
    ? trial.stages.find((s) => s.id === options.targetStageId)
    : trial.stages[trial.stages.length - 1] || stageT0;

  if (!targetStage) {
    throw new Error(`Jalon cible introuvable pour la synthèse (targetStageId=${options?.targetStageId || 'non défini'}).`);
  }

  const targetExposureHours = targetStage.scheduledExposureHours || (targetStage.cycleIndex * 168);
  const kinetics = extractTemporalKinetics(trial, targetBatch.id);
  const finalKinetics = kinetics.find((k) => k.exposureHours === targetExposureHours) || kinetics[kinetics.length - 1];

  // --------------------------------------------------------------------------
  // PHRASE 1 — IDENTIFICATION DE L'ESSAI ET DU SYSTÈME
  // --------------------------------------------------------------------------
  const trialRef = trial.metadata.reference || 'Essai QUV';
  const systemName = targetBatch.coatingSystem || targetBatch.productReference || 'système lasure étudié';
  const manufacturer = targetBatch.manufacturerOrSupplier ? `de ${targetBatch.manufacturerOrSupplier}` : 'fabricant non renseigné';
  const species = targetBatch.woodSpecies || trial.commonCharacteristics?.materialType || 'essence non précisée';

  sentences.push(
    `L'essai de vieillissement accéléré QUV (${trialRef}) a été conduit jusqu'à ${targetExposureHours} h selon la norme NF EN 927-6 sur le système "${systemName}" (${manufacturer}) appliqué sur ${species}.`
  );

  // --------------------------------------------------------------------------
  // PHRASE 2 — DURETÉ PERSOZ (LAB_RECOMMENDATION)
  // --------------------------------------------------------------------------
  const t0Kinetics = kinetics.find((k) => k.cycleIndex === 0);

  if (t0Kinetics?.meanPersozSeconds !== null && t0Kinetics?.meanPersozSeconds !== undefined && finalKinetics?.meanPersozSeconds !== null && finalKinetics?.meanPersozSeconds !== undefined) {
    const p0 = t0Kinetics.meanPersozSeconds;
    const pf = finalKinetics.meanPersozSeconds;
    const deltaP = +(pf - p0).toFixed(1);
    const deltaPercent = finalKinetics.meanPersozDeltaPercent ?? +( ((pf - p0) / p0) * 100 ).toFixed(1);

    sentences.push(
      `À ${targetExposureHours} h, la dureté pendulaire Persoz évolue de ${p0.toFixed(0)} s à ${pf.toFixed(0)} s, soit une variation de ${deltaP > 0 ? '+' : ''}${deltaP.toFixed(0)} s (${deltaPercent > 0 ? '+' : ''}${deltaPercent.toFixed(1)} %).`
    );
  } else {
    limitations.push('Données de dureté pendulaire Persoz non disponibles à cette étape.');
  }

  // --------------------------------------------------------------------------
  // PHRASE 3 — VARIATION COLORIMÉTRIQUE (CIELAB)
  // --------------------------------------------------------------------------
  if (finalKinetics?.meanDeltaE !== null && finalKinetics?.meanDeltaE !== undefined) {
    const dE = finalKinetics.meanDeltaE.toFixed(2);
    const dL = finalKinetics.meanDeltaL !== null && finalKinetics.meanDeltaL !== undefined
      ? `${finalKinetics.meanDeltaL > 0 ? '+' : ''}${finalKinetics.meanDeltaL.toFixed(2)}`
      : 'ND';
    const dB = finalKinetics.meanDeltaB !== null && finalKinetics.meanDeltaB !== undefined
      ? `${finalKinetics.meanDeltaB > 0 ? '+' : ''}${finalKinetics.meanDeltaB.toFixed(2)}`
      : 'ND';

    sentences.push(
      `Une variation colorimétrique globale de ΔE*ab = ${dE} est mesurée, avec ΔL* = ${dL} et Δb* = ${dB}.`
    );
  } else {
    limitations.push('Mesures colorimétriques non disponibles à cette étape.');
  }

  // --------------------------------------------------------------------------
  // PHRASE 4 — BRILLANCE 60° ET RÉTENTION
  // --------------------------------------------------------------------------
  if (t0Kinetics?.meanGloss !== null && t0Kinetics?.meanGloss !== undefined && finalKinetics?.meanGloss !== null && finalKinetics?.meanGloss !== undefined) {
    const g0 = t0Kinetics.meanGloss;
    const gf = finalKinetics.meanGloss;
    if (g0 === 0) {
      sentences.push(
        `La brillance à 60° évolue de 0,0 GU à ${gf.toFixed(1)} GU ; le taux de rétention n'est pas calculable en raison d'une valeur de référence nulle.`
      );
    } else {
      const retention = finalKinetics.meanGlossRetentionPercent ?? +( (gf / g0) * 100 ).toFixed(1);
      const studyCriteria = options?.studyCriteriaGlossRetentionPercent ?? 50;

      if (studyCriteria && studyCriteria > 0) {
        const criteriaText = retention >= studyCriteria
          ? `Cette valeur est supérieure au critère indicatif de ${studyCriteria} % défini dans le protocole de l'étude.`
          : `Cette valeur est inférieure au critère indicatif de ${studyCriteria} % défini dans le protocole de l'étude.`;

        sentences.push(
          `La brillance à 60° diminue de ${g0.toFixed(1)} GU à ${gf.toFixed(1)} GU, correspondant à une rétention de ${retention.toFixed(1)} %, ${criteriaText.toLowerCase()}`
        );
      } else {
        sentences.push(
          `La brillance à 60° évolue de ${g0.toFixed(1)} GU à ${gf.toFixed(1)} GU, correspondant à un taux de rétention de ${retention.toFixed(1)} %.`
        );
      }
    }
  } else {
    limitations.push('Mesures de brillance non disponibles à cette étape.');
  }

  // --------------------------------------------------------------------------
  // PHRASE 5 — OBSERVATIONS VISUELLES
  // --------------------------------------------------------------------------
  const activePanels = getActiveExposedPanels(targetBatch.panels);
  let hasRecordedObs = false;
  let maxBlister = 0;
  let maxFlake = 0;

  for (const p of activePanels) {
    const obsAcq = trial.acquisitions[`${targetStage.id}__${p.id}__OBSERVATIONS`];
    if (obsAcq && obsAcq.raw) {
      hasRecordedObs = true;
      const rawObs = obsAcq.raw as { observations?: Array<{ category: string; rating: number }> };
      if (rawObs.observations) {
        for (const o of rawObs.observations) {
          if (o.category === 'BLISTERING') maxBlister = Math.max(maxBlister, o.rating);
          if (o.category === 'FLAKING') maxFlake = Math.max(maxFlake, o.rating);
        }
      }
    }
  }

  if (hasRecordedObs) {
    if (maxBlister === 0 && maxFlake === 0) {
      sentences.push(
        'L\'examen visuel des éprouvettes ne met en évidence aucun cloquage ni écaillage (cotations 0 selon ISO 4628).'
      );
    } else {
      sentences.push(
        `L'examen visuel révèle des altérations avec une cotation maximale de ${maxBlister} pour le cloquage et ${maxFlake} pour l'écaillage.`
      );
    }
  } else {
    limitations.push('Aucune observation visuelle n\'a été enregistrée pour cette étape.');
  }

  // --------------------------------------------------------------------------
  // PHRASE 6 — SYNTHÈSE DESCRIPTIVE GLOBALE
  // --------------------------------------------------------------------------
  sentences.push(
    'Les résultats mettent ainsi en évidence des évolutions mesurables des propriétés physico-optiques du système entre les mesures initiales avant exposition et les mesures après exposition.'
  );

  // --------------------------------------------------------------------------
  // ADAPTATIONS DU PROTOCOLE (Section 23)
  // --------------------------------------------------------------------------
  const colorCfg = trial.config.familyConfigs.COLOR?.countConfig;
  if (colorCfg && colorCfg.configuredCount !== 4 && colorCfg.justification) {
    protocolAdaptations.push(
      `Les mesures colorimétriques ont été réalisées selon un plan adapté de ${colorCfg.configuredCount} points (au lieu de 4 standard) ; cette adaptation est documentée dans le protocole de l'essai ("${colorCfg.justification}").`
    );
  }

  const glossCfg = trial.config.familyConfigs.GLOSS?.seriesConfig;
  if (glossCfg && (glossCfg.configuredConfiguration.seriesCount !== 2 || glossCfg.configuredConfiguration.readingsPerSeries !== 2) && glossCfg.justification) {
    protocolAdaptations.push(
      `La configuration de mesure de la brillance a été adaptée (${glossCfg.configuredConfiguration.seriesCount}×${glossCfg.configuredConfiguration.readingsPerSeries}) avec justification enregistrée ("${glossCfg.justification}").`
    );
  }

  // Tronquer si maxSentences spécifié
  const max = options?.maxSentences || 6;
  const finalSentences = sentences.slice(0, max);

  return {
    synthesisText: finalSentences.join(' '),
    sentenceCount: finalSentences.length,
    limitations,
    protocolAdaptations
  };
}
