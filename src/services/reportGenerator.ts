/**
 * QUV-Lab — Service de Génération et d'Audit du Rapport Scientifique (PROMPT 7)
 * Respecte rigoureusement la séparation RAW / COMPUTED, la factualité des conclusions
 * et la traçabilité des versions de règles et de calculs.
 */

import { Trial } from '../types/trial';
import {
  ScientificRuleSet,
  ScientificReport,
  ScientificReportMetadata,
  ScientificReportStatus,
  ScientificReportReviewComment,
  ColorComputedData,
  GlossComputedData,
  PersozComputedData,
  AdhesionComputedData,
  VisualObservationsComputedData
} from '../types/scientific';
import { generateUUID } from './trialIds';
import {
  getActiveE1E2E3Panels,
  isPersozEligiblePanel,
  isAdhesionEligiblePanel,
  isExposedE1E2E3Panel
} from '../scientific/panelUtils';
import { aggregateBatchColorExposed, PanelComputedItem } from '../scientific/aggregations';
import type { MeasurementFamilyId } from '../types/scientific';

/**
 * Admissibilité scientifique d'une acquisition COMPUTED à la restitution
 * (section COMPUTED du CSV rapport). Règle unique, sans duplication métier :
 * - PERSOZ : E1/E2/E3 à tous les jalons (T jamais).
 * - ADHÉSION : matrice T0/T, C1-C11 aucun, C12/E1-E3.
 * - COLOR/GLOSS : population exposée E1-E2-E3 (T exclu des stats exposées).
 * - OBSERVATIONS et autres : restitution existante inchangée.
 * Le CSV RAW reste exhaustif et n'utilise jamais ce filtre.
 */
export function isComputedExportAdmissible(
  familyId: MeasurementFamilyId | string,
  panel: { label?: string; roleCode?: string; role?: string },
  stage: { cycleIndex?: number }
): boolean {
  if (familyId === 'PERSOZ') return isPersozEligiblePanel(panel);
  if (familyId === 'ADHESION') return isAdhesionEligiblePanel(panel, stage);
  if (familyId === 'COLOR' || familyId === 'GLOSS') return isExposedE1E2E3Panel(panel);
  return true;
}

export const REPORT_SCHEMA_VERSION = '1.2.0';
export const REPORT_GENERATOR_VERSION = 'v1.2.0';

/**
 * Restitution fidèle d'une valeur expérimentale ou documentaire.
 * Retourne 'Non renseigné' pour undefined, null ou chaîne vide (ou espaces seuls).
 * Préserve scrupuleusement les valeurs numériques y compris 0.
 */
export function displayValue(value: unknown): string {
  if (value === undefined || value === null) {
    return 'Non renseigné';
  }
  if (typeof value === 'string' && value.trim() === '') {
    return 'Non renseigné';
  }
  return String(value);
}

export interface PreReportAuditResult {
  isComplete: boolean;
  canGenerate: boolean;
  missingCriticalElements: string[];
  warnings: string[];
  checklist: {
    trialIdentified: boolean;
    batchesIdentified: boolean;
    panelsIdentified: boolean;
    t0Available: boolean;
    intermediateStagesAnalyzable: boolean;
    final2016hAvailableOrFlagged: boolean;
    computationsAvailable: boolean;
    engineVersionAvailable: boolean;
    ruleSetAvailable: boolean;
    adaptationsTraced: boolean;
    alertsCataloged: boolean;
  };
}

/**
 * Section 32 : Audit des données avant rapport
 */
export function auditTrialBeforeReport(trial: Trial, ruleSet: ScientificRuleSet): PreReportAuditResult {
  const missingCriticalElements: string[] = [];
  const warnings: string[] = [];

  const trialIdentified = !!(trial.id && trial.metadata?.reference);
  if (!trialIdentified) {
    missingCriticalElements.push("Référence d'essai manquante.");
  }

  const batchesIdentified = Array.isArray(trial.batches) && trial.batches.length > 0;
  if (!batchesIdentified) {
    missingCriticalElements.push("Aucun lot d'éprouvettes défini dans l'essai.");
  }

  const allPanels = trial.batches.flatMap((b) => b.panels);
  const panelsIdentified = allPanels.length > 0;
  if (!panelsIdentified) {
    missingCriticalElements.push("Aucune éprouvette/panneau défini dans les lots.");
  }

  const stageT0 = trial.stages.find((s) => s.stageType === 'INITIAL_PRE_EXPOSURE' || s.cycleIndex === 0);
  const t0Available = !!stageT0 && (stageT0.status === 'VALIDATED' || stageT0.status === 'IN_PROGRESS');
  if (!t0Available) {
    missingCriticalElements.push("Étape initiale T0 manquante ou non mesurée (référence obligatoire).");
  }

  const intermediateStages = trial.stages.filter(
    (s) => s.stageType === 'INTERMEDIATE_DURING_EXPOSURE' || (s.cycleIndex > 0 && s.cycleIndex < 12)
  );
  const intermediateStagesAnalyzable = intermediateStages.some(
    (s) => s.status === 'VALIDATED' || s.status === 'IN_PROGRESS'
  );
  if (!intermediateStagesAnalyzable) {
    warnings.push("Aucune étape intermédiaire (168 h à 1848 h) n'a encore été mesurée.");
  }

  const stage2016 = trial.stages.find((s) => s.stageType === 'FINAL_POST_EXPOSURE' || s.cycleIndex === 12);
  const final2016hAvailable = !!stage2016 && stage2016.status === 'VALIDATED';
  const final2016hFlaggedUnreached =
    !!stage2016 &&
    !final2016hAvailable &&
    ['NOT_STARTED', 'IN_PROGRESS', 'INACTIVE', 'SKIPPED'].includes(stage2016.status);
  const final2016hAvailableOrFlagged = final2016hAvailable || final2016hFlaggedUnreached;

  if (!stage2016) {
    warnings.push("Étape finale C12 (2016 h) absente du plan d'exposition.");
  } else if (!final2016hAvailable) {
    warnings.push("Étape finale 2016 h non encore réalisée (essai en cours). Rapport partiel.");
  }

  // Vérification de la disponibilité des calculs computed
  const acquisitionsList = Object.values(trial.acquisitions || {});
  const acquisitionsWithRaw = acquisitionsList.filter((a) => a.raw !== null && a.raw !== undefined);
  const hasComputations = acquisitionsList.some((a) => a.computed !== null && a.computed !== undefined);

  let computationsAvailable = false;
  if (acquisitionsList.length === 0) {
    computationsAvailable = false;
    warnings.push("Aucune acquisition enregistrée : aucun calcul scientifique disponible.");
  } else if (acquisitionsWithRaw.length === 0) {
    computationsAvailable = false;
    warnings.push("Aucune donnée brute acquise : calculs non nécessaires ou indisponibles.");
  } else if (hasComputations) {
    computationsAvailable = true;
    if (!acquisitionsWithRaw.every((a) => a.computed !== null && a.computed !== undefined)) {
      warnings.push("Calculs partiels : certaines données brutes n'ont pas encore été calculées.");
    }
  } else {
    computationsAvailable = false;
    warnings.push("Calculs attendus mais absents : données brutes présentes sans résultat calculé.");
  }

  const engineVersionAvailable = !!ruleSet.version;
  const ruleSetAvailable = !!ruleSet.standardReference;

  // Adaptations tracées : présence et vérification des configurations de protocoles
  const hasFamilyConfigs = !!trial.config?.familyConfigs && Object.keys(trial.config.familyConfigs).length > 0;
  let adaptationsTraced = false;
  if (hasFamilyConfigs) {
    adaptationsTraced = true;
    const configs = Object.values(trial.config.familyConfigs);
    const hasDeviations = configs.some(
      (cfg: any) => cfg?.deviationFromStandard || cfg?.countConfig?.deviationFromStandard || cfg?.seriesConfig?.deviationFromStandard
    );
    if (hasDeviations) {
      warnings.push("Des dérogations ou adaptations de protocole sont configurées pour cet essai.");
    }
  } else {
    adaptationsTraced = false;
    warnings.push("Configuration du protocole absente : traçabilité des dérogations et adaptations indéterminée.");
  }

  // Alertes recensées : recensement effectif sur l'ensemble des acquisitions
  let blockingAlertsCount = 0;
  let warningAlertsCount = 0;
  if (acquisitionsList.length > 0) {
    acquisitionsList.forEach((acq) => {
      if (Array.isArray(acq.alerts)) {
        acq.alerts.forEach((al) => {
          if (al.severity === 'BLOCKING') blockingAlertsCount++;
          if (al.severity === 'WARNING') warningAlertsCount++;
        });
      }
    });
  }

  let alertsCataloged = false;
  if (acquisitionsList.length === 0) {
    alertsCataloged = false;
    warnings.push("Aucune acquisition enregistrée : recensement des alertes impossible.");
  } else {
    alertsCataloged = true;
    if (blockingAlertsCount > 0 || warningAlertsCount > 0) {
      warnings.push(`Alerte : ${blockingAlertsCount} alerte(s) bloquante(s) et ${warningAlertsCount} avertissement(s) recensés sur les acquisitions.`);
    }
  }

  const isComplete =
    trialIdentified &&
    batchesIdentified &&
    panelsIdentified &&
    t0Available &&
    final2016hAvailable &&
    missingCriticalElements.length === 0;

  const canGenerate = missingCriticalElements.length === 0;

  return {
    isComplete,
    canGenerate,
    missingCriticalElements,
    warnings,
    checklist: {
      trialIdentified,
      batchesIdentified,
      panelsIdentified,
      t0Available,
      intermediateStagesAnalyzable,
      final2016hAvailableOrFlagged,
      computationsAvailable,
      engineVersionAvailable,
      ruleSetAvailable,
      adaptationsTraced,
      alertsCataloged
    }
  };
}

/**
 * Génère le rapport scientifique complet en 19 sections + 6 Annexes (Sections 21, 22, 23, 24, 25)
 */
export function buildScientificReport(
  trial: Trial,
  ruleSet: ScientificRuleSet,
  options?: {
    operatorId?: string;
    versionNumber?: string;
  }
): ScientificReport {
  const audit = auditTrialBeforeReport(trial, ruleSet);
  const now = new Date().toISOString();
  const reportId = generateUUID();
  const existingReportsCount = trial.reports?.length || 0;
  const reportVersion = options?.versionNumber || `v${existingReportsCount + 1}.0`;

  const stageT0 = trial.stages.find((s) => s.stageType === 'INITIAL_PRE_EXPOSURE' || s.cycleIndex === 0);
  const stage2016 = trial.stages.find((s) => s.stageType === 'FINAL_POST_EXPOSURE' || s.cycleIndex === 12);
  const evaluatedStages = trial.stages.filter((s) => s.status === 'VALIDATED' || s.status === 'IN_PROGRESS');

  const allPanels = trial.batches.flatMap((b) => b.panels);
  const totalPanelsCount = allPanels.length;
  const activePanelsCount = allPanels.filter((p) => p.status === 'ACTIVE').length;
  const excludedPanelsCount = allPanels.filter((p) => p.status === 'EXCLUDED').length;

  // Détection des adaptations
  const adaptedFamilies: string[] = [];
  Object.entries(trial.config.familyConfigs).forEach(([fam, cfg]) => {
    if (cfg?.countConfig?.deviationFromStandard || cfg?.seriesConfig?.deviationFromStandard) {
      adaptedFamilies.push(fam);
    }
  });

  const protocolStatus =
    adaptedFamilies.length > 0 ? 'ADAPTED_JUSTIFIED' : 'STANDARD';

  // GATE 55 — SÉGRÉGATION TÉMOIN / EXPOSÉ (population E1/E2/E3 normalisée) :
  // Le panneau Témoin T, conservé à l'obscurité, ne doit JAMAIS entrer dans les calculs
  // statistiques ou agrégations des panneaux exposés E1, E2, E3.
  const activeExposedPanels = getActiveE1E2E3Panels(allPanels);
  const activeExposedPanelIds = new Set(activeExposedPanels.map((p) => p.id));

  // Synthèse des calculs sans JAMAIS recalculer localement
  let maxDeltaE: number | null = null;
  let maxDeltaEPanel: string | null = null;
  let minRetention: number | null = null;
  let minRetentionPanel: string | null = null;

  for (const acq of Object.values(trial.acquisitions)) {
    // Exclusion formelle du Témoin T et des éprouvettes non actives ou non exposées
    if (!activeExposedPanelIds.has(acq.panelId)) {
      continue;
    }

    if (acq.familyId === 'COLOR' && acq.computed) {
      const dE = (acq.computed as ColorComputedData).deltaE;
      if (typeof dE === 'number') {
        if (maxDeltaE === null || dE > maxDeltaE) {
          maxDeltaE = dE;
          maxDeltaEPanel = acq.panelId;
        }
      }
    }
    if (acq.familyId === 'GLOSS' && acq.computed) {
      const ret = (acq.computed as GlossComputedData).retentionRatePercent;
      if (typeof ret === 'number') {
        if (minRetention === null || ret < minRetention) {
          minRetention = ret;
          minRetentionPanel = acq.panelId;
        }
      }
    }
  }

  const metadata: ScientificReportMetadata = {
    reportId,
    trialId: trial.id,
    generatedAt: now,
    generatedBy: options?.operatorId?.trim() ? options.operatorId : null,
    reportVersion,
    schemaVersion: REPORT_SCHEMA_VERSION,
    calculationVersion: ruleSet?.version?.trim() ? ruleSet.version : null,
    scientificRuleSetId: ruleSet.id
  };

  let alertsCount = 0;
  Object.values(trial.acquisitions).forEach((acq) => {
    if (Array.isArray(acq.alerts)) {
      alertsCount += acq.alerts.length;
    }
  });

  const dims = trial.commonCharacteristics?.dimensions;
  const hasLength = dims?.lengthMm !== undefined && dims?.lengthMm !== null;
  const hasWidth = dims?.widthMm !== undefined && dims?.widthMm !== null;
  const hasThickness = dims?.thicknessMm !== undefined && dims?.thicknessMm !== null;

  const lengthDisplay = hasLength ? `${dims!.lengthMm} mm` : 'Non renseigné';
  const widthDisplay = hasWidth ? `${dims!.widthMm} mm` : 'Non renseigné';
  const thicknessDisplay = hasThickness ? `${dims!.thicknessMm} mm` : 'Non renseigné';

  let dimensionsLine = '';
  if (hasLength && hasWidth && hasThickness) {
    dimensionsLine = `Dimensions : ${dims!.lengthMm} × ${dims!.widthMm} × ${dims!.thicknessMm} mm (Longueur : ${lengthDisplay}, Largeur : ${widthDisplay}, Épaisseur : ${thicknessDisplay})`;
  } else {
    dimensionsLine = `Dimensions des éprouvettes :\n  Longueur : ${lengthDisplay}\n  Largeur : ${widthDisplay}\n  Épaisseur : ${thicknessDisplay}`;
  }

  const hasRecordedVisualObservations = Object.values(trial.acquisitions).some(
    (a) => a.familyId === 'OBSERVATIONS' && ((a.raw !== null && a.raw !== undefined) || (a.computed !== null && a.computed !== undefined))
  );

  const evaluatedExposureStages = evaluatedStages.filter((s) => (s.scheduledExposureHours || 0) > 0);
  const lastEvaluatedStage = evaluatedStages.length > 0 ? evaluatedStages[evaluatedStages.length - 1] : null;
  const lastEvaluatedHours =
    lastEvaluatedStage?.scheduledExposureHours !== undefined && lastEvaluatedStage?.scheduledExposureHours !== null
      ? `${lastEvaluatedStage.scheduledExposureHours} h`
      : 'Non renseigné';

  let kineticsAnalysisText = '';
  if (evaluatedExposureStages.length > 0) {
    const maxHours = evaluatedExposureStages[evaluatedExposureStages.length - 1].scheduledExposureHours;
    kineticsAnalysisText = `Analyse cinétique de la dégradation : Les données compilées permettent d'observer les courbes d'évolution temporelle depuis T0 (0 h) jusqu'aux étapes en cours d'exposition (168 h à ${maxHours} h) et l'étape finale à 2016 h.\nDernière étape effectivement évaluée : ${maxHours} h.\nDistinction rigoureuse : La dispersion intra-panneau (répétabilité de la mesure) est isolée de la dispersion inter-panneaux (homogénéité du lot).`;
  } else if (evaluatedStages.some((s) => s.cycleIndex === 0 || s.stageType === 'INITIAL_PRE_EXPOSURE')) {
    kineticsAnalysisText = `Analyse cinétique de la dégradation : Seule l'étape initiale T0 (0 h) est renseignée. Aucune étape d'exposition intermédiaire ou finale n'a encore été évaluée.\nDernière étape effectivement évaluée : T0 (0 h).\nDistinction rigoureuse : La dispersion intra-panneau (répétabilité de la mesure) est isolée de la dispersion inter-panneaux (homogénéité du lot).`;
  } else {
    kineticsAnalysisText = `Analyse cinétique de la dégradation : Aucune étape d'exposition n'a été évaluée pour cet essai.\nDernière étape effectivement évaluée : Non renseigné.\nDistinction rigoureuse : La dispersion intra-panneau (répétabilité de la mesure) est isolée de la dispersion inter-panneaux (homogénéité du lot).`;
  }

  const totalAcquisitionsCount = Object.keys(trial.acquisitions).length;
  const rawAcquisitionsCount = Object.values(trial.acquisitions).filter(
    (a) => a.raw !== null && a.raw !== undefined
  ).length;

  let blockingAlertsCount = 0;
  let warningAlertsCount = 0;
  Object.values(trial.acquisitions).forEach((acq) => {
    if (Array.isArray(acq.alerts)) {
      acq.alerts.forEach((al) => {
        if (al.severity === 'BLOCKING') blockingAlertsCount++;
        if (al.severity === 'WARNING') warningAlertsCount++;
      });
    }
  });

  const qualityAlertsSummary =
    totalAcquisitionsCount === 0
      ? `Bilan des anomalies : Non disponible — aucune acquisition enregistrée.`
      : alertsCount > 0
        ? `Bilan des anomalies : Alerte : ${alertsCount} anomalie(s) recensée(s).`
        : `Bilan des anomalies : Aucune alerte enregistrée sur les acquisitions analysées.`;

  const familiesWithData = ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'].filter((fam) =>
    Object.values(trial.acquisitions).some(
      (a) => a.familyId === fam && ((a.computed !== null && a.computed !== undefined) || (a.raw !== null && a.raw !== undefined))
    )
  );

  const isT0Validated = !!stageT0 && stageT0.status === 'VALIDATED';
  const t0SynthesisStatement = isT0Validated
    ? `L'étape de référence initiale T0 est validée.`
    : `L'étape de référence initiale T0 n'est pas validée (statut : ${displayValue(stageT0?.status)}).`;

  const dataPresenceStatement =
    familiesWithData.length > 0
      ? `Grandeurs physiques avec données enregistrées : ${familiesWithData.join(', ')}.`
      : `Aucune donnée expérimentale n'a encore été enregistrée pour les grandeurs physiques actives.`;

  const behaviorStatement =
    familiesWithData.length > 0
      ? `Le comportement au vieillissement est suivi selon les cinétiques des grandeurs actives mesurées.`
      : `Aucune cinétique de vieillissement ne peut être caractérisée en l'absence de mesures.`;

  const scientificSynthesisText = `Synthèse générale :\nL'essai ${trial.metadata.reference} regroupe ${trial.batches.length} lot(s) expérimental(aux).\n${t0SynthesisStatement}\n${dataPresenceStatement}\n${behaviorStatement}\nL'ensemble des résultats est conservé avec distinction stricte entre données brutes et résultats calculés.`;

  const sections = {
    identification: `Essai référence : ${trial.metadata.reference}\nTitre de l'étude : ${displayValue(trial.metadata.title)}\nClient / Projet : ${displayValue(trial.metadata.projectOrClient)}\nOpérateur de génération : ${displayValue(options?.operatorId)}\nDate d'émission : ${new Date(now).toLocaleString('fr-FR')}\nStatut de l'essai : ${trial.status} (Configuration : ${trial.configurationStatus})`,
    studyPurpose: `Caractérisation de la durabilité et du comportement au vieillissement artificiel accéléré de revêtements pour bois selon le référentiel d'exposition alternée UV / condensation NF EN 927-6:2018 (cycles de 168 heures, durée totale programmée de 2016 heures).\nLe module QUV concerne exclusivement le vieillissement artificiel.\nDescription du système : ${displayValue(trial.metadata.coatingSystemDescription)}\nDescription du support : ${displayValue(trial.metadata.substrateDescription)}`,
    normativeReferences: `RÉFÉRENTIEL NORMATIF DU MODULE QUV (Vieillissement artificiel exclusif) :\n` +
      `• RÉFÉRENTIEL PRINCIPAL (NORMATIF QUV) : NF EN 927-6:2018 (Peintures et vernis - Exposition des revêtements pour bois au vieillissement artificiel par des lampes UV fluorescentes et de l'eau).\n` +
      `• AUTRES RÉFÉRENTIELS APPLICABLES :\n` +
      `  - NF P 23-305:2026 : Uniquement lorsque ses exigences sont pertinentes pour le périmètre de l'essai QUV (revêtements de menuiseries extérieures) ; ne remplace pas les exigences spécifiques de NF EN 927-6.\n` +
      `  - INFIPERF / FCBA : Critères complémentaires de laboratoire (ex. dureté Persoz ISO 1522, seuils indicatifs de rétention) ; toujours identifié comme référentiel complémentaire et non comme exigence NF EN 927-6.\n` +
      `• HORS PÉRIMÈTRE QUV :\n` +
      `  - NF EN 927-3:2019 (Vieillissement naturel) : NE PAS utiliser pour le moteur de conformité QUV ni pour définir les calculs ou seuils QUV. Elle sera traitée ultérieurement dans le module de vieillissement naturel (VN).\n` +
      `• NORMES D'ÉVALUATION ET DE MESURE ASSOCIÉES :\n` +
      `  - Colorimétrie : ISO 7724 / CIE L*a*b* (Illuminant D65, Observateur 10°, ΔE*ab 1976).\n` +
      `  - Brillance : ISO 2813 (Réflectomètre géométrie 60° sens longitudinal et perpendiculaire au fil).\n` +
      `  - Dégradations de surface : ISO 4628 parties 1 à 6 (Cloquage, Écaillage, Craquelage, Farinage) & ISO 2409.`,
    materialsAndBatches: `Nombre total de lots : ${trial.batches.length}\n` +
      trial.batches
        .map(
          (b, i) =>
            `  Lot ${i + 1} [${b.reference}] : ${displayValue(b.coatingSystem)} | Support: ${displayValue(b.woodSpecies)} | Produit: ${displayValue(b.productReference)} | Fabricant: ${displayValue(b.manufacturerOrSupplier)} | Couches: ${displayValue(b.coatCount)} | Préparation: ${displayValue(b.substratePreparation)} | Application: ${displayValue(b.applicationMethod)} | Séchage: ${displayValue(b.dryingOrConditioningTime)}`
        )
        .join('\n'),
    panelsDefinition: `Nombre total d'éprouvettes : ${totalPanelsCount} (Actives : ${activePanelsCount}, Exclues : ${excludedPanelsCount})\n` +
      `${dimensionsLine}\n` +
      `Orientation du fil : ${displayValue(trial.commonCharacteristics?.woodGrainOrientation)}\n` +
      `Conditionnement : ${displayValue(trial.commonCharacteristics?.conditioningNotes)}\n` +
      `Référentiel normatif associé : Exigences de préparation et de stabilisation selon NF EN 927-6 §5 (rappel normatif distinct des données observées).` +
      (excludedPanelsCount > 0
        ? `\nÉprouvettes exclues : ` +
          allPanels
            .filter((p) => p.status === 'EXCLUDED')
            .map((p) => `${p.label} (Motif : ${displayValue(p.exclusionReason)}, par ${displayValue(p.excludedBy)} le ${displayValue(p.excludedAt)})`)
            .join(' ; ')
        : ''),
    experimentalConditions: `Enceinte de vieillissement accéléré type QUV / UV-A 340 nm.\nCycle standard 168 heures : 24 h condensation à 45°C suivi de 144 h d'exposition alternée UV-A (2,5 h à 60°C, irradiance 0,89 W/(m²·nm)) / pulvérisation d'eau (0,5 h à température ambiante).`,
    exposureSchedule: `Calendrier complet en 13 étapes (1 étape initiale + 12 cycles de 168 h) :\n` +
      trial.stages
        .map(
          (st) =>
            `  - [${st.stageType}] ${st.name} | Planifié : ${st.scheduledExposureHours} h | Réel : ${st.actualExposureHours !== undefined ? st.actualExposureHours + ' h' : 'Non mesuré'} | Statut : ${st.status}`
        )
        .join('\n'),
    measurementPlan: `Familles de mesure actives : ${trial.config.activeFamilies.join(', ')}\n• Couleur : ${trial.config.familyConfigs.COLOR?.enabled ? 'Active (4 points normatifs par éprouvette)' : 'Désactivée'}\n• Brillance : ${trial.config.familyConfigs.GLOSS?.enabled ? 'Active (2 points sens du fil + 2 points perpendiculaire)' : 'Désactivée'}\n• Persoz : ${trial.config.familyConfigs.PERSOZ?.enabled ? 'Active (3 mesures d\'amortissement - Labo)' : 'Désactivée'}\n• Adhérence au quadrillage : ${trial.config.familyConfigs.ADHESION?.enabled ? 'Active (NF EN ISO 2409:2020 - 6×6 incisions)' : 'Désactivée'}\n• Observations visuelles : ${trial.config.familyConfigs.OBSERVATIONS?.enabled ? 'Active (Évaluation ISO 4628)' : 'Désactivée'}`,
    colorResults: `Les coordonnées trichromatiques CIE L*a*b* et les variations différentielles ΔL*, Δa*, Δb*, ΔE*ab sont issues exclusivement du moteur scientifique QUV-Lab (version ${displayValue(ruleSet.version)}).\nÉtape initiale T0 : Référence absolue pour chaque éprouvette.\nProgression observée : ${
      typeof maxDeltaE === 'number'
        ? `Variation maximale ΔE* enregistrée : ${maxDeltaE.toFixed(2)} sur les éprouvettes évaluées.`
        : `Variation maximale ΔE* enregistrée : Non renseigné (aucune donnée COLOR COMPUTED admissible).`
    }\nConsulter l'Annexe B pour le détail des valeurs par éprouvette et par lot.`,
    glossResults: `Mesures de réflectance spéculaire sous géométrie 60°.\nÉtape initiale T0 : Niveau de brillance initial caractérisé par éprouvette.\nÉvolution temporelle : ${
      typeof minRetention === 'number'
        ? `Rétention résiduelle minimale de ${minRetention.toFixed(1)} % constatée sur la campagne.`
        : `Taux de rétention résiduelle : Non renseigné (aucune donnée GLOSS COMPUTED admissible).`
    }\nConsulter l'Annexe B pour les calculs de variation absolue ΔGloss et de taux de rétention résiduelle.`,
    persozResults: `Dureté superficielle par temps d'amortissement du pendule Persoz (secondes).\nNOTE MÉTHODOLOGIQUE : Cette grandeur constitue une recommandation interne du laboratoire (LAB_RECOMMENDATION) et ne constitue pas une exigence normative formelle de la NF EN 927-6.\nÉvolution : Suivi de la cinétique de réticulation / dégradation mécanique superficielle.`,
    adhesionResults: `Évaluation de la résistance à la séparation par quadrillage selon NF EN ISO 2409:2020.\nNOTE MÉTHODOLOGIQUE : L'essai au quadrillage constitue une méthode d'évaluation qualitative de la résistance du revêtement au détachement selon une grille de 6×6 incisions (classes 0 à 5), et ne doit en aucun cas être assimilé à une force d'adhérence quantitative en MPa.\nProtocole : Éprouvette témoin T à T0 (référence initiale), éprouvettes exposées à C12 (2016 h). Espacement de peigne 2 mm (≤ 120 µm) ou 3 mm (121–250 µm) selon l'épaisseur sèche du revêtement.`,
    visualObservations: `Cotations des défauts surfaciques selon les normes ISO 4628 (Cloquage, Écaillage, Craquelage, Farinage) et ISO 2409 (Quadrillage).\n${
      hasRecordedVisualObservations
        ? `Les observations visuelles enregistrées sont présentées dans les résultats correspondants.`
        : `Observations visuelles : Non renseigné.`
    }`,
    kineticsAnalysis: kineticsAnalysisText,
    qualityControl: `Contrôle qualité des acquisitions : Chaque mesure est qualifiée selon 4 niveaux (GOOD, ACCEPTABLE, WARNING, INVALID).\nToutes les données brutes (RAW) sont préservées dans leur intégralité sans modification ni arrondissement destructif.\n${qualityAlertsSummary}`,
    deviationsAndAdaptations: adaptedFamilies.length > 0
      ? `Adaptations de protocole enregistrées pour cet essai :\n` +
        adaptedFamilies
          .map((fam) => {
            const cfg = trial.config.familyConfigs[fam];
            const countCfg = cfg?.countConfig;
            const seriesCfg = cfg?.seriesConfig;
            return `  • Famille ${fam} : Statut ${countCfg?.mode || seriesCfg?.mode || 'ADAPTED'} | Justification : "${displayValue(countCfg?.justification || seriesCfg?.justification)}" (Configuré par ${displayValue(countCfg?.configuredBy || seriesCfg?.configuredBy)} le ${displayValue(countCfg?.configuredAt || seriesCfg?.configuredAt)})`;
          })
          .join('\n') +
        `\nNOTE IMPORTANTE : Une adaptation justifiée (ADAPTED_JUSTIFIED) ne constitue pas une conformité standard automatique à la NF EN 927-6.`
      : `Aucune adaptation de protocole. L'ensemble des acquisitions a suivi les paramètres standards par défaut du référentiel NF EN 927-6.`,
    calculationTraceability: `Traçabilité intégrale du moteur de calcul :\n• Moteur scientifique : QUV-Lab Scientific Engine ${displayValue(ruleSet.version)}\n• RuleSet ID : ${ruleSet.id} (Référence : ${ruleSet.standardReference})\n• Méthode d'écart-type : Échantillon n-1 (${ruleSet.statisticalRules.stdDevMethod})\n• Formule colorimétrique : ${ruleSet.colorimetry.differenceFormula} (${ruleSet.colorimetry.illuminant}/${ruleSet.colorimetry.observer})\n• Géométrie de brillance par défaut : ${ruleSet.statisticalRules.glossGeometryDefault}°\n• Date d'exécution du calcul : ${now}`,
    scientificSynthesis: scientificSynthesisText,
    factualConclusion: `Les résultats obtenus montrent l'évolution des propriétés mesurées au cours de l'exposition.\n\nLes éventuelles variations observées sont présentées par famille de mesure et comparées aux valeurs initiales T0.\n\nLes relevés présentant des alertes ou des adaptations de protocole sont identifiés dans les tableaux de résultats.\n\nLa présente synthèse ne constitue pas à elle seule une conclusion de conformité à la NF EN 927-6.`
  };

  const rawIntegrityStatement =
    totalAcquisitionsCount > 0
      ? `Intégrité RAW : vérification détaillée disponible dans les données d'acquisition et le journal d'audit (${rawAcquisitionsCount} relevé(s) brut(s) conservé(s) dans leur précision native d'acquisition sans altération).`
      : `Intégrité RAW : Non applicable — aucune donnée brute enregistrée.`;

  const qualityAssessmentStatement =
    totalAcquisitionsCount === 0
      ? `Alertes : Non disponible — aucune acquisition enregistrée.`
      : `Recensement des alertes : ${blockingAlertsCount} alerte(s) bloquante(s), ${warningAlertsCount} avertissement(s) répertoriés sans masquage sur l'ensemble des acquisitions.`;

  const annexes = {
    annexA_RawDataSummary: `ANNEXE A — DONNÉES DE MESURE BRUTES (RAW DATA)\nTotal acquisitions : ${totalAcquisitionsCount} relevé(s) enregistré(s).\n${rawIntegrityStatement}`,
    annexB_ComputedResultsSummary: `ANNEXE B — RÉSULTATS CALCULÉS (COMPUTED DATA)\nMoyennes arithmétiques, écarts-types d'échantillon, variations différentielles (ΔE*ab, ΔGloss, rétention %, ΔDureté) calculés par le moteur scientifique ${ruleSet.version ? `v${ruleSet.version}` : 'Non renseigné'}.`,
    annexC_QualityAssessmentSummary: `ANNEXE C — CONTRÔLE QUALITÉ DES MESURES\nSynthèse de qualification métrologique (VALID / SUSPECT / INVALID / MISSING).\n${qualityAssessmentStatement}`,
    annexD_ProtocolAdaptationsSummary: `ANNEXE D — ADAPTATIONS DE PROTOCOLE & DÉROGATIONS\nRegistre des modifications de paramétrage, motifs techniques et signatures opérateurs.`,
    annexE_AuditTrailSummary: `ANNEXE E — JOURNAL D'AUDIT SCIENTIFIQUE (AUDIT TRAIL)\nHistorique chronologique immuable des ${trial.auditTrail.length} événements enregistrés pour cet essai.`,
    annexF_ScientificVersionSummary: `ANNEXE F — RÉFÉRENTIEL SCIENTIFIQUE & VERSIONS\nRuleSet : ${ruleSet.id} | Standard : ${ruleSet.standardReference} | Schéma : ${REPORT_SCHEMA_VERSION} | Moteur : ${displayValue(ruleSet.version)}`
  };

  const chronologicalSummary =
    evaluatedStages.length > 0
      ? `l'analyse chronologique jusqu'à ${lastEvaluatedHours}`
      : `aucune étape d'exposition évaluée`;

  return {
    id: reportId,
    metadata,
    status: 'GENERATED' as ScientificReportStatus,
    title: `Rapport Scientifique d'Essai — ${trial.metadata.reference}`,
    executiveSummary: `Rapport d'essai de vieillissement accéléré NF EN 927-6 émis le ${new Date(now).toLocaleDateString('fr-FR')} pour l'essai ${trial.metadata.reference}. Comprend la synthèse des ${trial.batches.length} lot(s) et ${chronologicalSummary}.`,
    normativeReference: ruleSet.standardReference || 'NF EN 927-6',
    protocolStatus,
    isComplete: audit.isComplete,
    missingCriticalElements: audit.missingCriticalElements,
    sections,
    annexes,
    reviewComments: []
  };
}

/**
 * Exporte un rapport au format CSV complet et structuré
 */
export function exportReportToCsv(trial: Trial, report: ScientificReport, ruleSet: ScientificRuleSet): string {
  const lines: string[] = [];

  lines.push(`RAPPORT SCIENTIFIQUE QUV-LAB — NF EN 927-6`);
  lines.push(`Référence Essai;${trial.metadata.reference}`);
  lines.push(`Titre;${trial.metadata.title || ''}`);
  lines.push(`Rapport ID;${report.id}`);
  lines.push(`Version Rapport;${report.metadata.reportVersion}`);
  lines.push(`Date Génération;${report.metadata.generatedAt}`);
  lines.push(`Généré Par;${displayValue(report.metadata.generatedBy)}`);
  lines.push(`Moteur Scientifique;${report.metadata.calculationVersion ? `QUV-Lab v${report.metadata.calculationVersion}` : 'Non renseigné'}`);
  lines.push(`RuleSet ID;${report.metadata.scientificRuleSetId}`);
  lines.push(`Statut Protocole;${report.protocolStatus}`);
  lines.push(`Complétude;${report.isComplete ? 'COMPLET' : 'PARTIEL / EN COURS'}`);
  lines.push(``);

  // Section Lots & Éprouvettes
  lines.push(`=== MATRICE DES LOTS ET ÉPROUVETTES ===`);
  lines.push(`Lot Ref;Système;Essence;Produit;Couches;Nb Panneaux;Panneaux Actifs`);
  trial.batches.forEach((b) => {
    const activeP = b.panels.filter((p) => p.status === 'ACTIVE').length;
    lines.push(
      `"${b.reference}";"${displayValue(b.coatingSystem)}";"${displayValue(b.woodSpecies)}";"${displayValue(b.productReference)}";${displayValue(b.coatCount)};${b.panels.length};${activeP}`
    );
  });
  lines.push(``);

  // Section Résultats Calculés COMPUTED
  lines.push(`=== RÉSULTATS CALCULÉS PAR ÉTAPE (COMPUTED DATA) ===`);
  lines.push(
    `Étape;Heures Planifiées;Éprouvette;Lot;Famille;Moyenne / Valeur;Écart-Type;Δ vs T0;Rétention %;Qualité;Version Calcul;Calculé Le;ReferenceStageId;ReferencePanelId;ReferenceAcquisitionId;ReferenceRule`
  );

  trial.stages.forEach((st) => {
    trial.batches.forEach((b) => {
      b.panels.forEach((p) => {
        ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'].forEach((fam) => {
          const key = `${st.id}__${p.id}__${fam}`;
          const acq = trial.acquisitions[key];
          if (acq && acq.computed) {
            // Verrouillage scientifique COMPUTED : seules les populations
            // canoniques (famille + jalon) sont restituées. Le CSV RAW reste
            // exhaustif et n'applique jamais ce filtre.
            if (!isComputedExportAdmissible(fam, p, st)) return;
            let valStr = '';
            let stdStr = '';
            let deltaStr = '';
            let retStr = '';
            // Union pour les accès communs (qualityAssessment, computation) présents sur les 5 types ;
            // chaque branche ci-dessous affine avec le type de sa famille (PARTIE 1 narrowing).
            const comp = acq.computed as
              | ColorComputedData
              | GlossComputedData
              | PersozComputedData
              | AdhesionComputedData
              | VisualObservationsComputedData;

            if (fam === 'COLOR') {
              const compColor = acq.computed as ColorComputedData;
              valStr = `L*=${compColor.meanL?.toFixed(2) ?? '—'}, a*=${compColor.meanA?.toFixed(2) ?? '—'}, b*=${compColor.meanB?.toFixed(2) ?? '—'}`;
              stdStr = `sL=${compColor.stdDevL?.toFixed(2) ?? '—'}`;
              deltaStr = compColor.deltaE !== null && compColor.deltaE !== undefined ? `ΔE*=${compColor.deltaE.toFixed(2)}` : 'RÉF (T0)';
            } else if (fam === 'GLOSS') {
              const compGloss = acq.computed as GlossComputedData;
              valStr = compGloss.meanGloss !== null && compGloss.meanGloss !== undefined ? `${compGloss.meanGloss.toFixed(1)} GU` : '—';
              stdStr = compGloss.stdDevGloss !== null && compGloss.stdDevGloss !== undefined ? `${compGloss.stdDevGloss.toFixed(2)}` : '—';
              deltaStr = compGloss.deltaGloss !== null && compGloss.deltaGloss !== undefined ? `${compGloss.deltaGloss.toFixed(1)} GU` : 'RÉF (T0)';
              retStr = compGloss.retentionRatePercent !== null && compGloss.retentionRatePercent !== undefined ? `${compGloss.retentionRatePercent.toFixed(1)} %` : '';
            } else if (fam === 'PERSOZ') {
              const compPersoz = acq.computed as PersozComputedData;
              valStr = compPersoz.meanDampingTime !== null && compPersoz.meanDampingTime !== undefined ? `${compPersoz.meanDampingTime.toFixed(1)} s` : '—';
              stdStr = compPersoz.stdDevDampingTime !== null && compPersoz.stdDevDampingTime !== undefined ? `${compPersoz.stdDevDampingTime.toFixed(2)}` : '—';
              deltaStr = compPersoz.deltaDampingTime !== null && compPersoz.deltaDampingTime !== undefined ? `${compPersoz.deltaDampingTime.toFixed(1)} s` : 'RÉF (T0)';
            } else if (fam === 'ADHESION') {
              const compAdh = acq.computed as AdhesionComputedData;
              // Gate 57 : mesures individuelles + moyenne visibles ; repli scalaire legacy.
              const indiv = compAdh && Array.isArray(compAdh.individualResults) ? compAdh.individualResults : [];
              if (indiv.length > 1) {
                valStr = `${indiv.map((m) => `M${m.measurementIndex}=${m.adhesionClass ?? '—'}`).join(', ')} (moy. ${compAdh.panelMean ?? '—'})`;
              } else {
                valStr = compAdh.adhesionClass !== null && compAdh.adhesionClass !== undefined ? `Classe ${compAdh.adhesionClass}` : '—';
              }
              stdStr = compAdh.gridSpacingUsedMm ? `Peigne ${compAdh.gridSpacingUsedMm} mm` : '—';
              // Δ = variation moyenne de classement, indicateur complémentaire non normatif.
              deltaStr = compAdh.deltaAdhesionClass !== null && compAdh.deltaAdhesionClass !== undefined ? `${indiv.length > 1 ? 'Δmoy.(compl.)=' : 'ΔClasse='}${compAdh.deltaAdhesionClass >= 0 ? '+' : ''}${compAdh.deltaAdhesionClass}` : 'RÉF (T0)';
              retStr = compAdh.delayCompliance || '—';
            } else if (fam === 'OBSERVATIONS') {
              const compObs = acq.computed as VisualObservationsComputedData;
              valStr = displayValue(compObs.summary);
            }

            const qStatus = comp.qualityAssessment?.status || acq.status;
            const calcVer = comp.computation?.calculationVersion ?? ruleSet.version ?? '';
            const calcAt = comp.computation?.calculatedAt ?? acq.trace?.lastModifiedAt ?? acq.trace?.createdAt ?? '';
            // Traçabilité explicite de la référence (N/A si aucune utilisée).
            const refTrace = comp.referenceTrace;
            const refStage = refTrace?.referenceStageId ?? 'N/A';
            const refPanel = refTrace?.referencePanelId ?? 'N/A';
            const refAcq = refTrace?.referenceAcquisitionId ?? 'N/A';
            const refRule = refTrace?.referenceRule ?? 'N/A';

            lines.push(
              `"${st.name}";${st.scheduledExposureHours};"${p.label}";"${b.reference}";${fam};"${valStr}";"${stdStr}";"${deltaStr}";"${retStr}";${qStatus};"${calcVer}";"${calcAt}";${refStage};${refPanel};${refAcq};${refRule}`
            );
          }
        });
      });
    });
  });

  lines.push(``);
  lines.push(`=== COULEUR — STATISTIQUES INTER-PANNEAUX DES EXPOSÉS E1-E3 ===`);
  lines.push(
    `Étape;Heures Planifiées;Lot;COLOR_L_moy;COLOR_L_SD;COLOR_a_moy;COLOR_a_SD;COLOR_b_moy;COLOR_b_SD;DeltaE_moy;DeltaE_SD`
  );

  // Restitution des statistiques calculées par aggregateBatchColor (aucun recalcul
  // local) : moyennes des moyennes panneau E1/E2/E3, écarts-types échantillon n−1.
  // Étapes/panneaux sans données : champs vides, jamais de valeur fabriquée.
  trial.stages.forEach((st) => {
    trial.batches.forEach((b) => {
      const exposedPanels = getActiveE1E2E3Panels(b.panels);
      const colorItems: PanelComputedItem<ColorComputedData>[] = [];
      exposedPanels.forEach((p) => {
        const acq = trial.acquisitions[`${st.id}__${p.id}__COLOR`];
        if (acq?.computed) colorItems.push({ panel: p, computed: acq.computed as ColorComputedData });
      });
      if (colorItems.length === 0) return;
      const agg = aggregateBatchColorExposed(b.id, st.id, colorItems);
      const fmt = (v: number | null | undefined, decimals: number): string =>
        v !== null && v !== undefined ? v.toFixed(decimals) : '';
      lines.push(
        `"${st.name}";${st.scheduledExposureHours};"${b.reference}";${fmt(agg.color?.meanL, 3)};${fmt(agg.color?.stdDevL, 3)};${fmt(agg.color?.meanA, 3)};${fmt(agg.color?.stdDevA, 3)};${fmt(agg.color?.meanB, 3)};${fmt(agg.color?.stdDevB, 3)};${fmt(agg.meanDeltaE, 2)};${fmt(agg.interPanelStdDev, 2)}`
      );
    });
  });

  lines.push(``);
  lines.push(`=== CONCLUSION FACTUELLE ===`);
  lines.push(`"${report.sections.factualConclusion.replace(/\n/g, ' ')}"`);

  return lines.join('\n');
}

/**
 * Exporte l'ensemble des données brutes (RAW) au format CSV
 */
export function exportRawDataToCsv(trial: Trial): string {
  const lines: string[] = [];
  lines.push(`DONNÉES BRUTES ACQUISES (RAW DATA) — QUV-LAB`);
  lines.push(`Essai;${trial.metadata.reference}`);
  lines.push(`Date Export;${new Date().toISOString()}`);
  lines.push(``);
  lines.push(`StageId;StageName;CycleIndex;BatchId;BatchRef;PanelId;PanelLabel;FamilyId;PointIndex / Series;RawValue1;RawValue2;RawValue3;RawValue4;Source;Operateur;DateSaisie`);

  trial.stages.forEach((st) => {
    trial.batches.forEach((b) => {
      b.panels.forEach((p) => {
        ['COLOR', 'GLOSS', 'PERSOZ', 'ADHESION', 'OBSERVATIONS'].forEach((fam) => {
          const key = `${st.id}__${p.id}__${fam}`;
          const acq = trial.acquisitions[key];
          if (acq && acq.raw) {
            const raw = acq.raw as any;
            const src = acq.trace?.source ?? '';
            const op = acq.trace?.createdBy ?? '';
            const dt = acq.trace?.createdAt ?? '';

            if (fam === 'COLOR' && Array.isArray(raw.readings)) {
              raw.readings.forEach((r: any) => {
                lines.push(
                  `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";COLOR;${r.pointIndex};${r.L ?? ''};${r.a ?? ''};${r.b ?? ''};;${src};"${op}";"${dt}"`
                );
              });
            } else if (fam === 'GLOSS' && Array.isArray(raw.series)) {
              raw.series.forEach((s: any) => {
                if (Array.isArray(s.readings)) {
                  s.readings.forEach((r: any) => {
                    lines.push(
                      `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";GLOSS;"S${s.seriesIndex}_P${r.pointIndex}_${s.orientation}";${r.value ?? ''};;;;${src};"${op}";"${dt}"`
                    );
                  });
                }
              });
            } else if (fam === 'PERSOZ' && Array.isArray(raw.readings)) {
              raw.readings.forEach((r: any) => {
                lines.push(
                  `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";PERSOZ;${r.pointIndex};${r.dampingTimeSeconds ?? ''};;;;${src};"${op}";"${dt}"`
                );
              });
            } else if (fam === 'ADHESION' && (Array.isArray(raw.measurements) || raw.adhesionClass !== undefined)) {
              // Gate 57 : branche explicite multi-mesures, fallback scalaire legacy.
              // Une acquisition multi-mesures n'est jamais perdue dans le CSV.
              if (Array.isArray(raw.measurements)) {
                raw.measurements.forEach((m: any) => {
                  lines.push(
                    `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";ADHESION;"Mesure ${m.measurementIndex ?? ''} Classe ${m.adhesionClass ?? ''}";${raw.coatingThicknessMicrons ?? ''};${raw.gridSpacingMm ?? ''};${raw.elapsedTimeHours ?? ''};"${m.observation || ''}";${src};"${op}";"${dt}"`
                  );
                });
              } else {
                lines.push(
                  `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";ADHESION;"Classe ${raw.adhesionClass ?? ''}";${raw.coatingThicknessMicrons ?? ''};${raw.gridSpacingMm ?? ''};${raw.elapsedTimeHours ?? ''};"${raw.observation || ''}";${src};"${op}";"${dt}"`
                );
              }
            } else if (fam === 'OBSERVATIONS' && Array.isArray(raw.observations)) {
              raw.observations.forEach((obs: any) => {
                lines.push(
                  `"${st.id}";"${st.name}";${st.cycleIndex};"${b.id}";"${b.reference}";"${p.id}";"${p.label}";OBSERVATIONS;"${obs.category}";"${obs.rating}";"${obs.status}";"${obs.comment || ''}";;${src};"${op}";"${dt}"`
                );
              });
            }
          }
        });
      });
    });
  });

  return lines.join('\n');
}
