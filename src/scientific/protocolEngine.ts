/**
 * QUV-Lab — Moteur de Conformité Protocolaire & Détection des Adaptations
 * Évalue si le plan de mesure configuré respecte la référence standard ou constitue une adaptation justifiée/injustifiée.
 */

import {
  MeasurementFamilyId,
  MeasurementCountConfiguration,
  MeasurementSeriesConfiguration,
  MeasurementProtocolDefinition,
  ProtocolComplianceStatus,
  MeasurementAlert,
  ScientificRuleSet
} from '../types/scientific';

export interface ProtocolEvaluationResult {
  status: ProtocolComplianceStatus;
  isAdapted: boolean;
  isCompliantWithStandard: boolean;
  alerts: MeasurementAlert[];
  deviationMessage?: string;
  protocolDefinition?: MeasurementProtocolDefinition;
}

/**
 * Construit un objet normalisé MeasurementProtocolDefinition à partir d'une configuration
 */
export function buildProtocolDefinition(
  config: MeasurementCountConfiguration | MeasurementSeriesConfiguration,
  ruleSet: ScientificRuleSet
): MeasurementProtocolDefinition {
  const isSeries = 'standardConfiguration' in config;
  const standardCount = isSeries
    ? config.standardConfiguration.totalReadings
    : config.standardRecommendedCount;
  const configuredCount = isSeries
    ? config.configuredConfiguration.totalReadings
    : config.configuredCount;

  return {
    familyId: config.familyId,
    origin: config.origin || (config.deviationFromStandard ? 'PROTOCOL_ADAPTATION' : 'NORMATIVE_REQUIREMENT'),
    standardReference: config.standardReference || ruleSet.standardReference,
    clause: config.clause,
    rationale: config.rationale,
    standardRecommendedCount: standardCount,
    configuredCount,
    isAdapted: config.deviationFromStandard,
    justification: config.justification,
    deviationReason: config.deviationReason,
    configuredBy: config.configuredBy,
    configuredAt: config.configuredAt
  };
}

/**
 * Évalue la conformité protocolaire d'une configuration scalaire (ex: Couleur, Persoz)
 */
export function evaluateCountProtocolCompliance(
  config: MeasurementCountConfiguration | undefined,
  ruleSet: ScientificRuleSet
): ProtocolEvaluationResult {
  if (!config) {
    return {
      status: 'INCOMPLETE',
      isAdapted: false,
      isCompliantWithStandard: false,
      alerts: [
        {
          id: 'alert-proto-missing',
          severity: 'BLOCKING',
          code: 'PROTOCOL_ADAPTATION_UNJUSTIFIED',
          message: 'Configuration du plan de mesure manquante.',
          familyId: 'UNKNOWN'
        }
      ]
    };
  }

  const standardRef = ruleSet.measurementConfigurations[config.familyId];
  const standardRecommended = standardRef?.standardRecommendedCount ?? 4;
  const isAdapted = config.configuredCount !== standardRecommended || config.mode === 'CUSTOM_JUSTIFIED';

  const alerts: MeasurementAlert[] = [];

  if (!isAdapted) {
    return {
      status: 'STANDARD',
      isAdapted: false,
      isCompliantWithStandard: true,
      alerts,
      protocolDefinition: buildProtocolDefinition(config, ruleSet)
    };
  }

  // Si adapté, vérifier la justification
  const hasJustification = Boolean(config.justification && config.justification.trim().length > 0);

  if (hasJustification) {
    alerts.push({
      id: `alert-proto-adapted-${config.familyId}`,
      severity: 'INFO',
      code: 'PROTOCOL_ADAPTED',
      message: `Protocole adapté et justifié : ${config.configuredCount} relevé(s) au lieu des ${standardRecommended} de référence. Justification : "${config.justification}"`,
      familyId: config.familyId
    });

    return {
      status: 'ADAPTED_JUSTIFIED',
      isAdapted: true,
      isCompliantWithStandard: false,
      alerts,
      deviationMessage: `Protocole adapté (${config.configuredCount}/${standardRecommended} pts) — Justifié : ${config.justification}`,
      protocolDefinition: buildProtocolDefinition(config, ruleSet)
    };
  }

  // Adaptation SANS justification : bloquant !
  alerts.push({
    id: `alert-proto-unjustified-${config.familyId}`,
    severity: 'BLOCKING',
    code: 'PROTOCOL_ADAPTATION_UNJUSTIFIED',
    message: `Protocole adapté non justifié : ${config.configuredCount} relevé(s) configuré(s) au lieu des ${standardRecommended} recommandés par ${ruleSet.standardReference}. Une justification obligatoire est requise.`,
    familyId: config.familyId
  });

  return {
    status: 'ADAPTED_UNJUSTIFIED',
    isAdapted: true,
    isCompliantWithStandard: false,
    alerts,
    deviationMessage: `Protocole adapté non justifié (${config.configuredCount}/${standardRecommended} pts) — Bloquant pour validation`,
    protocolDefinition: buildProtocolDefinition(config, ruleSet)
  };
}

/**
 * Évalue la conformité protocolaire d'une configuration multi-séries (ex: Brillance 2x2 vs 2x1)
 */
export function evaluateSeriesProtocolCompliance(
  config: MeasurementSeriesConfiguration | undefined,
  ruleSet: ScientificRuleSet
): ProtocolEvaluationResult {
  if (!config) {
    return {
      status: 'INCOMPLETE',
      isAdapted: false,
      isCompliantWithStandard: false,
      alerts: [
        {
          id: 'alert-proto-series-missing',
          severity: 'BLOCKING',
          code: 'PROTOCOL_ADAPTATION_UNJUSTIFIED',
          message: 'Configuration de séries de mesure manquante.',
          familyId: 'GLOSS'
        }
      ]
    };
  }

  const standardRef = ruleSet.seriesConfigurations?.[config.familyId];
  const stdSeries = standardRef?.standardConfiguration.seriesCount ?? 2;
  const stdReadings = standardRef?.standardConfiguration.readingsPerSeries ?? 2;

  const isAdapted =
    config.configuredConfiguration.seriesCount !== stdSeries ||
    config.configuredConfiguration.readingsPerSeries !== stdReadings ||
    config.mode === 'CUSTOM_JUSTIFIED';

  const alerts: MeasurementAlert[] = [];

  if (!isAdapted) {
    return {
      status: 'STANDARD',
      isAdapted: false,
      isCompliantWithStandard: true,
      alerts,
      protocolDefinition: buildProtocolDefinition(config, ruleSet)
    };
  }

  const hasJustification = Boolean(config.justification && config.justification.trim().length > 0);

  if (hasJustification) {
    alerts.push({
      id: `alert-proto-series-adapted-${config.familyId}`,
      severity: 'INFO',
      code: 'PROTOCOL_ADAPTED',
      message: `Structure de brillance adaptée et justifiée : ${config.configuredConfiguration.seriesCount} × ${config.configuredConfiguration.readingsPerSeries} (${config.configuredConfiguration.totalReadings} pts) au lieu de ${stdSeries} × ${stdReadings} (${stdSeries * stdReadings} pts). Justification : "${config.justification}"`,
      familyId: config.familyId
    });

    return {
      status: 'ADAPTED_JUSTIFIED',
      isAdapted: true,
      isCompliantWithStandard: false,
      alerts,
      deviationMessage: `Structure adaptée (${config.configuredConfiguration.seriesCount}×${config.configuredConfiguration.readingsPerSeries}) — Justifié`,
      protocolDefinition: buildProtocolDefinition(config, ruleSet)
    };
  }

  alerts.push({
    id: `alert-proto-series-unjustified-${config.familyId}`,
    severity: 'BLOCKING',
    code: 'PROTOCOL_ADAPTATION_UNJUSTIFIED',
    message: `Structure de mesure adaptée sans justification : ${config.configuredConfiguration.seriesCount} × ${config.configuredConfiguration.readingsPerSeries} au lieu de ${stdSeries} × ${stdReadings}. Une justification obligatoire est requise.`,
    familyId: config.familyId
  });

  return {
    status: 'ADAPTED_UNJUSTIFIED',
    isAdapted: true,
    isCompliantWithStandard: false,
    alerts,
    deviationMessage: `Structure adaptée sans justification (${config.configuredConfiguration.seriesCount}×${config.configuredConfiguration.readingsPerSeries}) — Bloquant`,
    protocolDefinition: buildProtocolDefinition(config, ruleSet)
  };
}
