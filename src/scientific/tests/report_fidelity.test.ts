/**
 * QUV-Lab — Suite de Tests de Fidélité du Rapport Scientifique & Restitution Documentaire
 * Vérifie rigoureusement les exigences RF-01 à RF-17 :
 * - Aucune donnée expérimentale manquante ne doit être remplacée par une valeur fictive (Chêne, 3, P120, etc.)
 * - Préservation scrupuleuse des vraies valeurs numériques (y compris 0)
 * - Restitution fidèle des données réelles renseignées
 * - Audit pré-rapport sans flags codés en dur à true
 * - Séparation stricte entre données observées et rappels normatifs
 * - Fidélité documentaire du CSV export
 */

import {
  auditTrialBeforeReport,
  buildScientificReport,
  exportReportToCsv,
  displayValue
} from '../../services/reportGenerator';
import { getDefaultScientificRuleSet } from '../ruleSet';
import { generateStandardExposureStages } from '../../services/trialStore';
import type { Trial, BatchDefinition, PanelDefinition } from '../../types/trial';

export interface ReportFidelityTestResult {
  id: string;
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
}

let trialCounter = 0;

function createBaseTrial(): Trial {
  trialCounter++;
  const trialId = `trial-rf-${trialCounter}`;
  const stages = generateStandardExposureStages(trialId);
  const batchId = `${trialId}-batch-1`;

  const panels: PanelDefinition[] = [
    { id: `${trialId}-p-T`, batchId, index: 1, label: 'T', role: 'WITNESS', roleCode: 'T', status: 'ACTIVE' },
    { id: `${trialId}-p-E1`, batchId, index: 2, label: '1', role: 'EXPOSED_1', roleCode: 'E1', status: 'ACTIVE' },
    { id: `${trialId}-p-E2`, batchId, index: 3, label: '2', role: 'EXPOSED_2', roleCode: 'E2', status: 'ACTIVE' },
    { id: `${trialId}-p-E3`, batchId, index: 4, label: '3', role: 'EXPOSED_3', roleCode: 'E3', status: 'ACTIVE' }
  ];

  const batch: BatchDefinition = {
    id: batchId,
    trialId,
    reference: `LOT-RF-${trialCounter}`,
    orderIndex: 1,
    coatingSystem: 'Système A',
    woodSpecies: 'Épicéa',
    productReference: 'PROD-001',
    manufacturerOrSupplier: 'Fournisseur X',
    coatCount: 2,
    substratePreparation: 'P180',
    applicationMethod: 'Pistolet',
    dryingOrConditioningTime: '14 jours',
    dryFilmThicknessMicrons: 100,
    applicationDate: '2026-09-01T00:00:00Z',
    panels
  };

  return {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    metadata: {
      reference: `QUV-RF-${trialCounter}`,
      title: 'Étude RF',
      projectOrClient: 'Client RF',
      coatingSystemDescription: 'Système lasure',
      substrateDescription: 'Bois résineux',
      createdBy: 'OPERATOR_RF'
    },
    status: 'IN_PROGRESS',
    configurationStatus: 'EDITABLE',
    config: {
      standardReference: 'NF EN 927-6',
      activeFamilies: ['COLOR', 'GLOSS'],
      familyConfigs: {
        COLOR: { familyId: 'COLOR', enabled: true } as any,
        GLOSS: { familyId: 'GLOSS', enabled: true } as any
      }
    },
    scheduleConfig: {
      cycleDurationHours: 168,
      maxCycles: 12,
      initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
      intermediateCycles: [],
      finalCycle: { cycleIndex: 12, mandatory: true }
    },
    commonCharacteristics: {
      woodGrainOrientation: 'Sur dosse',
      conditioningNotes: 'Conditionnement 20°C / 65% HR 28 jours',
      dimensions: {
        lengthMm: 150,
        widthMm: 75,
        thicknessMm: 20,
        unit: 'mm'
      }
    },
    stages,
    batches: [batch],
    acquisitions: {},
    auditTrail: [],
    mediaReferences: []
  } as unknown as Trial;
}

export function runReportFidelityTests(): {
  results: ReportFidelityTestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: ReportFidelityTestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  function record(id: string, name: string, passed: boolean, expected: string, actual: string) {
    results.push({ id, name, passed, expected, actual });
  }

  // =========================================================================
  // RF-01 : woodSpecies absent / non renseigné -> 'Non renseigné' (jamais 'Chêne')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].woodSpecies = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsNonRenseigne = section.includes('Support: Non renseigné');
    const doesNotContainChene = !section.includes('Support: Chêne');
    const displayValueOk = displayValue(undefined) === 'Non renseigné' && displayValue('') === 'Non renseigné' && displayValue(null) === 'Non renseigné';

    record(
      'RF-01',
      'woodSpecies absent / indéfini / vide restitué comme "Non renseigné" sans fallback "Chêne"',
      containsNonRenseigne && doesNotContainChene && displayValueOk,
      'Support: Non renseigné, aucun fallback Chêne',
      `Section: ${section.split('\n')[1]}`
    );
  }

  // =========================================================================
  // RF-02 : woodSpecies présent ('Épicéa', 'Chêne', 'Pin sylvestre') -> fidèlement restitué
  // =========================================================================
  {
    const speciesList = ['Épicéa', 'Chêne', 'Pin sylvestre'];
    let allValid = true;
    const recordedOutputs: string[] = [];

    speciesList.forEach((sp) => {
      const trial = createBaseTrial();
      trial.batches[0].woodSpecies = sp;
      const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
      const section = report.sections.materialsAndBatches;
      const expectedStr = `Support: ${sp}`;
      if (!section.includes(expectedStr)) {
        allValid = false;
      }
      recordedOutputs.push(expectedStr);
    });

    record(
      'RF-02',
      'woodSpecies présent (Épicéa, Chêne, Pin sylvestre) fidèlement restitué sans altération',
      allValid,
      'Restitution exacte de chaque essence renseignée',
      recordedOutputs.join(' | ')
    );
  }

  // =========================================================================
  // RF-03 : coatCount absent / non renseigné -> 'Non renseigné' (jamais '3')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].coatCount = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsNonRenseigne = section.includes('Couches: Non renseigné');
    const doesNotContainThree = !section.includes('Couches: 3');

    record(
      'RF-03',
      'coatCount absent restitué comme "Non renseigné" sans fallback silencieux "3"',
      containsNonRenseigne && doesNotContainThree,
      'Couches: Non renseigné, pas de fallback 3',
      `Section: ${section.split('\n')[1]}`
    );
  }

  // =========================================================================
  // RF-04 : coatCount = 0 -> '0' préservé scrupuleusement (pas 'Non renseigné')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].coatCount = 0;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsZero = section.includes('Couches: 0');
    const helperOk = displayValue(0) === '0';

    record(
      'RF-04',
      'coatCount = 0 préservé scrupuleusement comme "0" (valeur numérique valide, non assimilée à vide)',
      containsZero && helperOk,
      'Couches: 0, displayValue(0) === "0"',
      `Section: ${section.split('\n')[1]}, helper: ${displayValue(0)}`
    );
  }

  // =========================================================================
  // RF-05 : substratePreparation absent -> 'Non renseigné' (jamais 'P120')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].substratePreparation = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsNonRenseigne = section.includes('Préparation: Non renseigné');
    const doesNotContainP120 = !section.includes('Préparation: P120');

    record(
      'RF-05',
      'substratePreparation absent restitué comme "Non renseigné" sans fallback "P120"',
      containsNonRenseigne && doesNotContainP120,
      'Préparation: Non renseigné, aucun fallback P120',
      `Section: ${section.split('\n')[1]}`
    );
  }

  // =========================================================================
  // RF-06 : applicationMethod absent -> 'Non renseigné' (jamais 'Pinceau')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].applicationMethod = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsNonRenseigne = section.includes('Application: Non renseigné');
    const doesNotContainPinceau = !section.includes('Application: Pinceau');

    record(
      'RF-06',
      'applicationMethod absent restitué comme "Non renseigné" sans fallback "Pinceau"',
      containsNonRenseigne && doesNotContainPinceau,
      'Application: Non renseigné, aucun fallback Pinceau',
      `Section: ${section.split('\n')[1]}`
    );
  }

  // =========================================================================
  // RF-07 : dryingOrConditioningTime absent -> 'Non renseigné' (jamais '7 jours')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].dryingOrConditioningTime = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.materialsAndBatches;

    const containsNonRenseigne = section.includes('Séchage: Non renseigné');
    const doesNotContain7Jours = !section.includes('Séchage: 7 jours');

    record(
      'RF-07',
      'dryingOrConditioningTime absent restitué comme "Non renseigné" sans fallback "7 jours"',
      containsNonRenseigne && doesNotContain7Jours,
      'Séchage: Non renseigné, aucun fallback 7 jours',
      `Section: ${section.split('\n')[1]}`
    );
  }

  // =========================================================================
  // RF-08 : Dimensions d'éprouvettes incomplètes ou absentes -> 'Non renseigné', pas de 150/75/15 inventé
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.commonCharacteristics!.dimensions = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.panelsDefinition;

    const noDefaultDimensions = !section.includes('150 × 75 × 15 mm');
    const mentionsLengthNonRenseigne = section.includes('Longueur : Non renseigné');
    const mentionsWidthNonRenseigne = section.includes('Largeur : Non renseigné');
    const mentionsThicknessNonRenseigne = section.includes('Épaisseur : Non renseigné');

    record(
      'RF-08',
      'Dimensions totalement absentes restituées sans dimensions inventées 150/75/15',
      noDefaultDimensions && mentionsLengthNonRenseigne && mentionsWidthNonRenseigne && mentionsThicknessNonRenseigne,
      'Chaque dimension absente est "Non renseigné", aucun 150x75x15 inventé',
      `Section: ${section}`
    );
  }

  // =========================================================================
  // RF-09 : Dimensions d'éprouvettes complètes (120x60x18 mm) -> fidèlement restituées
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.commonCharacteristics!.dimensions = {
      lengthMm: 120,
      widthMm: 60,
      thicknessMm: 18,
      unit: 'mm'
    };
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.panelsDefinition;

    const containsExactDims = section.includes('120 × 60 × 18 mm');

    record(
      'RF-09',
      'Dimensions réelles spécifiées (120 × 60 × 18 mm) fidèlement restituées',
      containsExactDims,
      'Dimensions : 120 × 60 × 18 mm',
      `Section: ${section}`
    );
  }

  // =========================================================================
  // RF-10 : woodGrainOrientation absent -> 'Non renseigné' (jamais 'Sur quartier (NF EN 927-6)')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.commonCharacteristics!.woodGrainOrientation = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.panelsDefinition;

    const containsNonRenseigne = section.includes('Orientation du fil : Non renseigné');
    const doesNotContainFallback = !section.includes('Orientation du fil : Sur quartier (NF EN 927-6)');

    record(
      'RF-10',
      'woodGrainOrientation absent restitué comme "Non renseigné" sans fallback "Sur quartier"',
      containsNonRenseigne && doesNotContainFallback,
      'Orientation du fil : Non renseigné, aucun fallback',
      `Section: ${section}`
    );
  }

  // =========================================================================
  // RF-11 : conditioningNotes absent -> 'Non renseigné' (jamais 'Stabilisation selon NF EN 927-6 §5')
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.commonCharacteristics!.conditioningNotes = undefined as any;
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.panelsDefinition;

    const containsNonRenseigne = section.includes('Conditionnement : Non renseigné');
    const doesNotContainFallback = !section.includes('Conditionnement : Stabilisation selon NF EN 927-6 §5');

    record(
      'RF-11',
      'conditioningNotes absent restitué comme "Non renseigné" sans fallback "Stabilisation selon NF EN 927-6 §5"',
      containsNonRenseigne && doesNotContainFallback,
      'Conditionnement : Non renseigné, aucun fallback',
      `Section: ${section}`
    );
  }

  // =========================================================================
  // RF-12 : Le rappel normatif NF EN 927-6 §5 est explicitement qualifié comme tel
  // =========================================================================
  {
    const trial = createBaseTrial();
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const section = report.sections.panelsDefinition;

    const normativeDistinctionPresent =
      section.includes('Référentiel normatif associé : Exigences de préparation et de stabilisation selon NF EN 927-6 §5 (rappel normatif distinct des données observées).');

    record(
      'RF-12',
      'Distinction stricte entre conditionnement observé et rappel normatif NF EN 927-6 §5',
      normativeDistinctionPresent,
      'Présence explicite de la mention "rappel normatif distinct des données observées"',
      `Section: ${section}`
    );
  }

  // =========================================================================
  // RF-13 : auditTrialBeforeReport : final2016hAvailableOrFlagged vérifie réellement l'étape 2016 h
  // =========================================================================
  {
    const trialWithoutC12 = createBaseTrial();
    trialWithoutC12.stages = trialWithoutC12.stages.filter((s) => s.cycleIndex !== 12 && s.stageType !== 'FINAL_POST_EXPOSURE');
    const auditNoC12 = auditTrialBeforeReport(trialWithoutC12, ruleSet);

    const trialWithInProgressC12 = createBaseTrial();
    const stage12 = trialWithInProgressC12.stages.find((s) => s.cycleIndex === 12)!;
    stage12.status = 'IN_PROGRESS';
    const auditInProgressC12 = auditTrialBeforeReport(trialWithInProgressC12, ruleSet);

    const trialWithValidatedC12 = createBaseTrial();
    const stage12Val = trialWithValidatedC12.stages.find((s) => s.cycleIndex === 12)!;
    stage12Val.status = 'VALIDATED';
    const auditValidatedC12 = auditTrialBeforeReport(trialWithValidatedC12, ruleSet);

    const c12CheckValid =
      auditNoC12.checklist.final2016hAvailableOrFlagged === false &&
      auditInProgressC12.checklist.final2016hAvailableOrFlagged === true &&
      auditValidatedC12.checklist.final2016hAvailableOrFlagged === true &&
      auditNoC12.warnings.some((w) => w.includes('C12 (2016 h) absente'));

    record(
      'RF-13',
      'auditTrialBeforeReport vérifie réellement la présence et l\'état de l\'étape C12 2016h (pas de true forcé)',
      c12CheckValid,
      'Absente -> false + warning ; Présente -> true',
      `Sans C12: ${auditNoC12.checklist.final2016hAvailableOrFlagged}, En cours: ${auditInProgressC12.checklist.final2016hAvailableOrFlagged}`
    );
  }

  // =========================================================================
  // RF-14 : auditTrialBeforeReport : computationsAvailable vérifie réellement les calculs
  // =========================================================================
  {
    const trialNoAcq = createBaseTrial();
    trialNoAcq.acquisitions = {};
    const auditNoAcq = auditTrialBeforeReport(trialNoAcq, ruleSet);

    const trialWithRawNoComp = createBaseTrial();
    const stageT0 = trialWithRawNoComp.stages[0];
    const panelE1 = trialWithRawNoComp.batches[0].panels[1];
    trialWithRawNoComp.acquisitions[`${stageT0.id}__${panelE1.id}__COLOR`] = {
      id: 'acq-1',
      trialId: trialWithRawNoComp.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trialWithRawNoComp.batches[0].id,
      familyId: 'COLOR',
      status: 'MEASURED',
      raw: { points: [{ l: 50, a: 0, b: 0 }] } as any,
      computed: null,
      alerts: []
    } as any;
    const auditRawNoComp = auditTrialBeforeReport(trialWithRawNoComp, ruleSet);

    const trialWithComp = createBaseTrial();
    trialWithComp.acquisitions[`${stageT0.id}__${panelE1.id}__COLOR`] = {
      id: 'acq-1',
      trialId: trialWithComp.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trialWithComp.batches[0].id,
      familyId: 'COLOR',
      status: 'COMPUTED',
      raw: { points: [{ l: 50, a: 0, b: 0 }] } as any,
      computed: { deltaE: 0, meanL: 50 } as any,
      alerts: []
    } as any;
    const auditWithComp = auditTrialBeforeReport(trialWithComp, ruleSet);

    const computationsCheckValid =
      auditNoAcq.checklist.computationsAvailable === false &&
      auditRawNoComp.checklist.computationsAvailable === false &&
      auditWithComp.checklist.computationsAvailable === true;

    record(
      'RF-14',
      'auditTrialBeforeReport valide réellement computationsAvailable sans flag forcé',
      computationsCheckValid,
      'Sans acq -> false, RAW sans computed -> false, Avec computed -> true',
      `NoAcq: ${auditNoAcq.checklist.computationsAvailable}, RawNoComp: ${auditRawNoComp.checklist.computationsAvailable}, WithComp: ${auditWithComp.checklist.computationsAvailable}`
    );
  }

  // =========================================================================
  // RF-15 : auditTrialBeforeReport : adaptationsTraced vérifie la configuration de protocole
  // =========================================================================
  {
    const trialNoConfig = createBaseTrial();
    trialNoConfig.config = {
      standardReference: 'NF EN 927-6',
      activeFamilies: [],
      familyConfigs: {} as any
    };
    const auditNoConfig = auditTrialBeforeReport(trialNoConfig, ruleSet);

    const trialWithConfig = createBaseTrial();
    const auditWithConfig = auditTrialBeforeReport(trialWithConfig, ruleSet);

    const adaptationsCheckValid =
      auditNoConfig.checklist.adaptationsTraced === false &&
      auditWithConfig.checklist.adaptationsTraced === true;

    record(
      'RF-15',
      'auditTrialBeforeReport valide réellement adaptationsTraced selon la configuration du protocole',
      adaptationsCheckValid,
      'Sans config -> false, Avec config -> true',
      `NoConfig: ${auditNoConfig.checklist.adaptationsTraced}, WithConfig: ${auditWithConfig.checklist.adaptationsTraced}`
    );
  }

  // =========================================================================
  // RF-16 : auditTrialBeforeReport : alertsCataloged vérifie le recensement des alertes
  // =========================================================================
  {
    const trialNoAcq = createBaseTrial();
    trialNoAcq.acquisitions = {};
    const auditNoAcq = auditTrialBeforeReport(trialNoAcq, ruleSet);

    const trialWithAlerts = createBaseTrial();
    const stageT0 = trialWithAlerts.stages[0];
    const panelE1 = trialWithAlerts.batches[0].panels[1];
    trialWithAlerts.acquisitions[`${stageT0.id}__${panelE1.id}__COLOR`] = {
      id: 'acq-alert',
      trialId: trialWithAlerts.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trialWithAlerts.batches[0].id,
      familyId: 'COLOR',
      status: 'MEASURED',
      raw: { points: [{ l: 50, a: 0, b: 0 }] } as any,
      computed: null,
      alerts: [
        { id: 'al-1', severity: 'WARNING', message: 'Dispersion élevée' }
      ]
    } as any;
    const auditWithAlerts = auditTrialBeforeReport(trialWithAlerts, ruleSet);

    const alertsCheckValid =
      auditNoAcq.checklist.alertsCataloged === false &&
      auditWithAlerts.checklist.alertsCataloged === true &&
      auditWithAlerts.warnings.some((w) => w.includes('1 avertissement(s) recensés'));

    record(
      'RF-16',
      'auditTrialBeforeReport recense réellement les alertes sur l\'ensemble des acquisitions',
      alertsCheckValid,
      'Sans acq -> false, Avec acq/alertes -> true + warning recensé',
      `NoAcq: ${auditNoAcq.checklist.alertsCataloged}, WithAlerts: ${auditWithAlerts.checklist.alertsCataloged}`
    );
  }

  // =========================================================================
  // RF-17 : CSV export (exportReportToCsv) sans fallbacks silencieux ('Chêne', 3)
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.batches[0].woodSpecies = undefined as any;
    trial.batches[0].coatCount = undefined as any;
    trial.batches[0].coatingSystem = undefined as any;
    trial.batches[0].productReference = undefined as any;

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const csv = exportReportToCsv(trial, report, ruleSet);

    const batchLines = csv
      .split('\n')
      .filter((l) => l.startsWith(`"${trial.batches[0].reference}"`));
    const batchLine = batchLines[0] || '';

    const noFallbackChene = !batchLine.includes('"Chêne"');
    const noFallback3 = !batchLine.includes(';3;');
    const containsNonRenseigne = batchLine.includes('"Non renseigné"') && batchLine.includes(';Non renseigné;');

    record(
      'RF-17',
      'exportReportToCsv restitue "Non renseigné" dans la matrice des lots sans injecter de fallbacks "Chêne" ou 3',
      noFallbackChene && noFallback3 && containsNonRenseigne,
      'Pas de "Chêne", pas de ";3;", présence de "Non renseigné"',
      `Ligne CSV: ${batchLine}`
    );
  }

  // =========================================================================
  // RF-18 : Aucun COLOR COMPUTED admissible → jamais ΔE = 0 (ou 0.00)
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.acquisitions = {};
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });

    const colorText = report.sections.colorResults;
    const noZeroDeltaE = !colorText.includes('0.00') && !colorText.includes('ΔE* enregistrée : 0');
    const hasExplicitNonRenseigne = colorText.includes('Non renseigné') || colorText.includes('aucune donnée COLOR COMPUTED');

    record(
      'RF-18',
      'Aucun COLOR COMPUTED admissible : jamais ΔE = 0 ni 0.00 par défaut',
      noZeroDeltaE && hasExplicitNonRenseigne,
      'Pas de "0.00", mention explicite de donnée non renseignée ou indisponible',
      `Texte: ${colorText}`
    );
  }

  // =========================================================================
  // RF-19 : Aucun GLOSS retention → jamais 100 % par défaut dans le CSV
  // =========================================================================
  {
    const trial = createBaseTrial();
    const stageT0 = trial.stages[0];
    const panelE1 = trial.batches[0].panels[1];
    trial.acquisitions[`${stageT0.id}__${panelE1.id}__GLOSS`] = {
      id: 'acq-gloss-t0',
      trialId: trial.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trial.batches[0].id,
      familyId: 'GLOSS',
      status: 'MEASURED',
      raw: {} as any,
      computed: {
        meanGloss: 45.2,
        stdDevGloss: 1.1,
        retentionRatePercent: null
      } as any,
      trace: { createdAt: '2026-09-01T00:00:00Z', source: 'MANUAL_KEYPAD' } as any
    } as any;

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const csv = exportReportToCsv(trial, report, ruleSet);

    const glossCsvLine = csv
      .split('\n')
      .find((l) => l.includes(';GLOSS;') && l.includes(`"${panelE1.label}"`)) || '';

    const retField = glossCsvLine.split(';')[8]?.replace(/"/g, '') || '';
    const no100Percent = retField !== '100 %' && retField !== '100%';

    record(
      'RF-19',
      'Aucun GLOSS retention : jamais 100 % par défaut dans le CSV',
      no100Percent,
      'retStr !== "100 %" lorsque retentionRatePercent est absent',
      `retField: "${retField}", ligne: ${glossCsvLine}`
    );
  }

  // =========================================================================
  // RF-20 : OBSERVATION sans summary → jamais "Aspect conforme"
  // =========================================================================
  {
    const trial = createBaseTrial();
    const stageT0 = trial.stages[0];
    const panelE1 = trial.batches[0].panels[1];
    trial.acquisitions[`${stageT0.id}__${panelE1.id}__OBSERVATIONS`] = {
      id: 'acq-obs-t0',
      trialId: trial.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trial.batches[0].id,
      familyId: 'OBSERVATIONS',
      status: 'MEASURED',
      raw: {} as any,
      computed: {
        summary: undefined
      } as any,
      trace: { createdAt: '2026-09-01T00:00:00Z', source: 'MANUAL_KEYPAD' } as any
    } as any;

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const csv = exportReportToCsv(trial, report, ruleSet);

    const obsCsvLine = csv
      .split('\n')
      .find((l) => l.includes(';OBSERVATIONS;') && l.includes(`"${panelE1.label}"`)) || '';

    const noAspectConforme = !obsCsvLine.includes('Aspect conforme');
    const containsNonRenseigne = obsCsvLine.includes('Non renseigné');

    record(
      'RF-20',
      'OBSERVATION sans summary : jamais "Aspect conforme" par défaut dans le CSV',
      noAspectConforme && containsNonRenseigne,
      'Absence de "Aspect conforme" et présence de "Non renseigné"',
      `Ligne CSV: ${obsCsvLine}`
    );
  }

  // =========================================================================
  // RF-21 : Aucune observation → jamais "Aucun défaut majeur"
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.acquisitions = {};
    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });

    const obsSection = report.sections.visualObservations;
    const noAucunDefaut = !obsSection.includes('Aucun défaut') && !obsSection.includes('arrêt anticipé');
    const indicatesNonRenseigne = obsSection.includes('Non renseigné');

    record(
      'RF-21',
      'Aucune observation : jamais "Aucun défaut majeur" ni conclusion favorable fabriquée',
      noAucunDefaut && indicatesNonRenseigne,
      'Pas de "Aucun défaut", mention "Non renseigné"',
      `Section visualObservations: ${obsSection}`
    );
  }

  // =========================================================================
  // RF-22 : Aucun T0 validé → jamais "T0 validé pour l'ensemble des grandeurs"
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.stages[0].status = 'NOT_STARTED';
    trial.acquisitions = {};

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const synthesis = report.sections.scientificSynthesis;

    const noUniversalT0Claim =
      !synthesis.includes('ont été validées pour l\'ensemble des grandeurs') &&
      !synthesis.includes('T0 ont été validées');
    const indicatesNotValidated = synthesis.includes('n\'est pas validée') || synthesis.includes('NOT_STARTED');

    record(
      'RF-22',
      'Aucun T0 validé : jamais d\'affirmation que les T0 sont validés pour l\'ensemble des grandeurs',
      noUniversalT0Claim && indicatesNotValidated,
      'Pas de fausse affirmation de validation T0, mention explicite du statut non validé',
      `Synthèse: ${synthesis}`
    );
  }

  // =========================================================================
  // RF-23 : Aucune étape évaluée → jamais "168 h à 0 h" ni résultat cinétique fictif
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.stages.forEach((s) => (s.status = 'NOT_STARTED'));
    trial.acquisitions = {};

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const kinetics = report.sections.kineticsAnalysis;

    const no168to0h = !kinetics.includes('168 h à 0 h');
    const indicatesNonRenseigne = kinetics.includes('Dernière étape effectivement évaluée : Non renseigné');

    record(
      'RF-23',
      'Aucune étape évaluée : jamais "168 h à 0 h" ni résultat cinétique fictif',
      no168to0h && indicatesNonRenseigne,
      'Pas de "168 h à 0 h", étape évaluée indiquée "Non renseigné"',
      `Analyse cinétique: ${kinetics}`
    );
  }

  // =========================================================================
  // RF-24 : Aucune donnée RAW → jamais "Intégrité : 100 %" sans contrôle réel
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.acquisitions = {};

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const annexA = report.annexes.annexA_RawDataSummary;

    const no100Percent = !annexA.includes('100%') && !annexA.includes('100 %');
    const indicatesNoData = annexA.includes('Total acquisitions : 0') || annexA.includes('aucune donnée brute');

    record(
      'RF-24',
      'Aucune acquisition brute : jamais d\'affirmation "Intégrité : 100%"',
      no100Percent && indicatesNoData,
      'Pas de "100%", indication claire de l\'absence de données brutes',
      `Annexe A: ${annexA}`
    );
  }

  // =========================================================================
  // RF-25 : Aucune acquisition → aucune affirmation statique sur le recensement des alertes
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.acquisitions = {};

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const annexC = report.annexes.annexC_QualityAssessmentSummary;
    const qcSection = report.sections.qualityControl;

    const noStaticClaim = !annexC.includes('Tous les avertissements et anomalies sont répertoriés sans masquage');
    const indicatesNotAvailable =
      annexC.includes('Non disponible — aucune acquisition enregistrée') &&
      qcSection.includes('Non disponible — aucune acquisition enregistrée');

    record(
      'RF-25',
      'Aucune acquisition : pas d\'affirmation que les alertes sont recensées sans masquage',
      noStaticClaim && indicatesNotAvailable,
      'Pas d\'affirmation statique, mention explicite "Non disponible — aucune acquisition"',
      `Annexe C: ${annexC} | Section QC: ${qcSection}`
    );
  }

  // =========================================================================
  // RF-26 : Rapport incomplet → aucune conclusion scientifique favorable fabriquée
  // =========================================================================
  {
    const trial = createBaseTrial();
    trial.acquisitions = {};
    trial.stages.forEach((s) => (s.status = 'NOT_STARTED'));

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });
    const synthesis = report.sections.scientificSynthesis;
    const factualConclusion = report.sections.factualConclusion;

    const noFavorableFabrication =
      !synthesis.includes('validées pour l\'ensemble') &&
      !report.sections.visualObservations.includes('Aucun défaut') &&
      !report.sections.colorResults.includes('0.00') &&
      !factualConclusion.includes('conforme');

    const synthesisMentionsNoData = synthesis.includes('Aucune cinétique de vieillissement ne peut être caractérisée');

    record(
      'RF-26',
      'Rapport incomplet : aucune conclusion scientifique favorable fabriquée en l\'absence de données',
      noFavorableFabrication && synthesisMentionsNoData,
      'Pas de conclusions favorables inventées, synthèse réservée',
      `Synthèse: ${synthesis}`
    );
  }

  // =========================================================================
  // RF-27 : Présence d'une vraie valeur numérique 0 → 0 doit rester 0
  // =========================================================================
  {
    const trial = createBaseTrial();
    const stageT0 = trial.stages[0];
    const panelE1 = trial.batches[0].panels[1];

    trial.acquisitions[`${stageT0.id}__${panelE1.id}__COLOR`] = {
      id: 'acq-color-zero',
      trialId: trial.id,
      stageId: stageT0.id,
      panelId: panelE1.id,
      batchId: trial.batches[0].id,
      familyId: 'COLOR',
      status: 'MEASURED',
      raw: { readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }] } as any,
      computed: {
        meanL: 50,
        meanA: 0,
        meanB: 0,
        deltaE: 0
      } as any,
      trace: { createdAt: '2026-09-01T00:00:00Z', source: 'MANUAL_KEYPAD' } as any
    } as any;

    const report = buildScientificReport(trial, ruleSet, { operatorId: 'OP' });

    const colorSection = report.sections.colorResults;
    const hasRealZero = colorSection.includes('Variation maximale ΔE* enregistrée : 0.00');
    const displayZeroIsPreserved = displayValue(0) === '0';

    record(
      'RF-27',
      'Vraie valeur numérique 0 : scrupuleusement préservée et restituée (ΔE=0, displayValue(0)="0")',
      hasRealZero && displayZeroIsPreserved,
      'ΔE réel 0.00 affiché et displayValue(0) === "0"',
      `Section Color: ${colorSection}, displayValue(0): "${displayValue(0)}"`
    );
  }

  // =========================================================================
  // RF-28 : Test d'intégration global adversarial — aucune fabrication dans le rapport et le CSV
  // =========================================================================
  {
    const trialMinimal = createBaseTrial();
    trialMinimal.acquisitions = {};
    trialMinimal.stages[0].status = 'IN_PROGRESS';
    const stage2016 = trialMinimal.stages.find((s) => s.cycleIndex === 12);
    if (stage2016) stage2016.status = 'NOT_STARTED';

    const report = buildScientificReport(trialMinimal, ruleSet, { operatorId: 'OP' });
    const csv = exportReportToCsv(trialMinimal, report, ruleSet);

    const allReportText = Object.values(report.sections).join('\n') + '\n' + Object.values(report.annexes).join('\n');

    const noFabricatedDeltaE = !report.sections.colorResults.includes('0.00');
    const noFabricatedGlossRetention = !report.sections.glossResults.includes('100.0 %') && !csv.includes(';100 %;');
    const noFabricatedAspectConforme = !csv.includes('Aspect conforme') && !allReportText.includes('Aspect conforme');
    const noFabricatedAucunDefaut = !allReportText.includes('Aucun défaut');
    const noFabricatedT0Valide = !allReportText.includes('T0 ont été validées') && !allReportText.includes('T0 est validée');
    const noFabricatedIntegrite100 = !allReportText.includes('Intégrité : 100%');

    const globalAdversarialValid =
      noFabricatedDeltaE &&
      noFabricatedGlossRetention &&
      noFabricatedAspectConforme &&
      noFabricatedAucunDefaut &&
      noFabricatedT0Valide &&
      noFabricatedIntegrite100;

    record(
      'RF-28',
      'Test d\'intégration global adversarial : aucune fabrication dans le rapport et le CSV sur trial minimal',
      globalAdversarialValid,
      'Pas de ΔE=0.00, 100%, Aspect conforme, Aucun défaut, T0 validé, Intégrité 100%',
      `DeltaE OK: ${noFabricatedDeltaE}, Gloss OK: ${noFabricatedGlossRetention}, Obs OK: ${noFabricatedAspectConforme}, Defaut OK: ${noFabricatedAucunDefaut}, T0 OK: ${noFabricatedT0Valide}, Integ OK: ${noFabricatedIntegrite100}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed: results.length - passed
    }
  };
}
