/**
 * QUV-Lab — Détecteur Factuel d'Anomalies (PROMPT 8 - Section 12, 13, 27, 28)
 * Recherche exclusivement les anomalies factuelles dans les données RAW, COMPUTED et le protocole
 * sans recalculer de données et sans porter de jugement subjectif.
 */

import { Trial, ExposureStage, BatchDefinition } from '../../types/trial';
import { ScientificRuleSet, MeasurementFamilyId } from '../../types/scientific';
import { AnalysisAnomaly } from '../../types/analysis';
import { getActiveFamiliesForStage } from '../panelUtils';

export function detectTrialAnomalies(
  trial: Trial,
  ruleSet: ScientificRuleSet,
  scope?: {
    stageId?: string;
    batchIds?: string[];
    families?: MeasurementFamilyId[];
  }
): AnalysisAnomaly[] {
  const anomalies: AnalysisAnomaly[] = [];
  let anomalyCounter = 1;

  const addAnomaly = (
    severity: AnalysisAnomaly['severity'],
    category: AnalysisAnomaly['category'],
    code: string,
    title: string,
    factualDescription: string,
    blocking: boolean,
    details?: {
      sourceReference?: string;
      affectedLotId?: string;
      affectedPanelId?: string;
      affectedStageId?: string;
    }
  ) => {
    anomalies.push({
      id: `ANOM-${trial.metadata.reference}-${category}-${anomalyCounter++}`,
      severity,
      category,
      code,
      title,
      factualDescription,
      blocking,
      affectedTrialId: trial.id,
      ...details
    });
  };

  const selectedStages = scope?.stageId
    ? trial.stages.filter((s) => s.id === scope.stageId)
    : trial.stages;

  const selectedBatches = scope?.batchIds && scope.batchIds.length > 0
    ? trial.batches.filter((b) => scope.batchIds!.includes(b.id))
    : trial.batches;

  const activeFamilies: MeasurementFamilyId[] = scope?.families && scope.families.length > 0
    ? scope.families
    : trial.config.activeFamilies;

  // --------------------------------------------------------------------------
  // A. ANOMALIES TEMPORELLES & STRUCTURALES
  // --------------------------------------------------------------------------
  const stageT0 = trial.stages.find((s) => s.cycleIndex === 0);
  if (!stageT0) {
    addAnomaly(
      'CRITICAL',
      'TEMPORAL',
      'INITIAL_STAGE_MISSING',
      'Étape initiale T0 absente',
      'L\'essai ne dispose pas de l\'étape T0 (mesures initiales avant exposition), rendant impossible tout calcul de variation temporelle.',
      true
    );
  }

  const stage2016 = trial.stages.find((s) => s.cycleIndex === 12);
  if (!stage2016) {
    addAnomaly(
      'WARNING',
      'TEMPORAL',
      'FINAL_STAGE_MISSING',
      'Étape finale 2016 h absente du calendrier',
      'Le calendrier ne comporte pas d\'étape finale à 2016 h selon le cycle standard NF EN 927-6.',
      false
    );
  }

  // --------------------------------------------------------------------------
  // B. ANOMALIES DE PROTOCOLE & ADAPTATIONS
  // --------------------------------------------------------------------------
  for (const familyId of activeFamilies) {
    const famConfig = trial.config.familyConfigs[familyId];
    if (!famConfig || !famConfig.enabled) continue;

    if (familyId === 'COLOR' && famConfig.countConfig) {
      const stdPoints = ruleSet.measurementConfigurations.COLOR?.standardRecommendedCount ?? 4;
      const configuredPoints = famConfig.countConfig.configuredCount;
      if (configuredPoints !== stdPoints) {
        if (famConfig.countConfig.deviationFromStandard && !famConfig.countConfig.justification) {
          addAnomaly(
            'CRITICAL',
            'PROTOCOL',
            'COLOR_ADAPTATION_UNJUSTIFIED',
            'Adaptation du plan colorimétrique non justifiée',
            `Le plan de mesure de la couleur est configuré à ${configuredPoints} points au lieu des ${stdPoints} points standard sans justification technique enregistrée.`,
            true,
            { sourceReference: 'NF EN 927-6 §6.3.2' }
          );
        } else {
          addAnomaly(
            'INFO',
            'PROTOCOL',
            'COLOR_ADAPTATION_JUSTIFIED',
            'Plan de mesure colorimétrique adapté et justifié',
            `Le plan de mesure de la couleur a été adapté à ${configuredPoints} points au lieu de ${stdPoints} points standard. Motif enregistré : "${famConfig.countConfig.justification}".`,
            false,
            { sourceReference: 'NF EN 927-6 §6.3.2' }
          );
        }
      }
    }

    if (familyId === 'GLOSS' && famConfig.seriesConfig) {
      const std = ruleSet.seriesConfigurations?.GLOSS?.standardConfiguration;
      const cfg = famConfig.seriesConfig.configuredConfiguration;
      if (std && (cfg.seriesCount !== std.seriesCount || cfg.readingsPerSeries !== std.readingsPerSeries)) {
        if (famConfig.seriesConfig.deviationFromStandard && !famConfig.seriesConfig.justification) {
          addAnomaly(
            'CRITICAL',
            'PROTOCOL',
            'GLOSS_SERIES_ADAPTATION_UNJUSTIFIED',
            'Adaptation de la grille de brillance non justifiée',
            `La configuration brillance (${cfg.seriesCount} séries × ${cfg.readingsPerSeries} points) diffère de la norme (${std.seriesCount} × ${std.readingsPerSeries}) sans justification enregistrée.`,
            true,
            { sourceReference: 'NF EN 927-6 §6.3.3' }
          );
        } else {
          addAnomaly(
            'INFO',
            'PROTOCOL',
            'GLOSS_SERIES_ADAPTATION_JUSTIFIED',
            'Grille de brillance adaptée et justifiée',
            `La configuration brillance a été adaptée (${cfg.seriesCount} séries × ${cfg.readingsPerSeries} points). Motif : "${famConfig.seriesConfig.justification}".`,
            false,
            { sourceReference: 'NF EN 927-6 §6.3.3' }
          );
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // C. ANOMALIES DE COMPLÉTUDE & MÉTROLOGIE PAR PANNEAU ET ÉTAPE
  // --------------------------------------------------------------------------
  for (const stage of selectedStages) {
    if (stage.status === 'INACTIVE') continue;
    const stageApplicableFamilies = getActiveFamiliesForStage(activeFamilies, stage);

    for (const batch of selectedBatches) {
      const activePanels = batch.panels.filter((p) => p.status === 'ACTIVE');

      for (const panel of activePanels) {
        for (const familyId of stageApplicableFamilies) {
          const acqKey = `${stage.id}__${panel.id}__${familyId}`;
          const acq = trial.acquisitions[acqKey];

          if (!acq) {
            // Uniquement si l'étape est entamée ou validée
            if (stage.status === 'IN_PROGRESS' || stage.status === 'VALIDATED') {
              addAnomaly(
                'WARNING',
                'DATA',
                'ACQUISITION_MISSING',
                `Acquisition manquante : ${familyId}`,
                `Aucune acquisition enregistrée pour le panneau ${panel.label} (${batch.reference}) à l'étape ${stage.name} pour la grandeur ${familyId}.`,
                false,
                {
                  affectedLotId: batch.id,
                  affectedPanelId: panel.id,
                  affectedStageId: stage.id
                }
              );
            }
            continue;
          }

          // Anomalies de statut d'acquisition
          if (acq.status === 'ERROR') {
            addAnomaly(
              'CRITICAL',
              'METROLOGY',
              'ACQUISITION_ERROR',
              `Données invalides : ${familyId} sur ${panel.label}`,
              `L'acquisition ${familyId} du panneau ${panel.label} à l'étape ${stage.name} comporte des erreurs bloquantes ou des valeurs invalides.`,
              true,
              {
                affectedLotId: batch.id,
                affectedPanelId: panel.id,
                affectedStageId: stage.id
              }
            );
          } else if (acq.status === 'PARTIAL') {
            addAnomaly(
              'WARNING',
              'DATA',
              'ACQUISITION_PARTIAL',
              `Série de mesures incomplète : ${familyId}`,
              `L'acquisition ${familyId} sur ${panel.label} (${stage.name}) ne comporte pas le nombre attendu de points de mesure.`,
              false,
              {
                affectedLotId: batch.id,
                affectedPanelId: panel.id,
                affectedStageId: stage.id
              }
            );
          }

          // Relayer les alertes du moteur scientifique
          if (acq.alerts && acq.alerts.length > 0) {
            for (const alert of acq.alerts) {
              addAnomaly(
                alert.severity === 'BLOCKING' ? 'CRITICAL' : alert.severity === 'WARNING' ? 'WARNING' : 'INFO',
                'METROLOGY',
                typeof alert.code === 'string' ? alert.code : 'MEASUREMENT_ALERT',
                `Alerte métrologique : ${familyId} (${panel.label})`,
                alert.message,
                alert.severity === 'BLOCKING',
                {
                  affectedLotId: batch.id,
                  affectedPanelId: panel.id,
                  affectedStageId: stage.id
                }
              );
            }
          }
        }
      }
    }
  }

  // --------------------------------------------------------------------------
  // D. CONTRADICTIONS ENTRE DONNÉES ET OBSERVATIONS (Section 28)
  // --------------------------------------------------------------------------
  for (const stage of selectedStages) {
    for (const batch of selectedBatches) {
      for (const panel of batch.panels) {
        const obsKey = `${stage.id}__${panel.id}__OBSERVATIONS`;
        const obsAcq = trial.acquisitions[obsKey];
        if (obsAcq && obsAcq.raw) {
          const rawObs = obsAcq.raw as { observations?: Array<{ category: string; rating: number; comment?: string }> };
          if (rawObs.observations) {
            for (const item of rawObs.observations) {
              if (item.rating === 0 && item.comment && /(important|sévère|marqué|fort|décollement)/i.test(item.comment)) {
                addAnomaly(
                  'CRITICAL',
                  'DATA',
                  'ANALYSIS_TEXT_CONTRADICTION',
                  `Contradiction observation / cotation (${panel.label})`,
                  `La cotation de ${item.category} est fixée à 0 (aucun défaut) alors que le commentaire textuel mentionne "${item.comment}".`,
                  true,
                  {
                    affectedLotId: batch.id,
                    affectedPanelId: panel.id,
                    affectedStageId: stage.id
                  }
                );
              }
            }
          }
        }
      }
    }
  }

  return anomalies;
}
