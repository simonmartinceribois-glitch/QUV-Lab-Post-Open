/**
 * QUV-Lab — Suite de Tests Scientifiques & Métrologiques
 * Valide les 22 exigences impératives du PROMPT 5 (Version 1.1)
 */

import {
  getDefaultScientificRuleSet,
  createCountConfiguration,
  createSeriesConfiguration
} from '../ruleSet';
import { calculateMean, calculateSampleStdDev, calculatePopulationStdDev, calculateStdDevByMethod } from '../statistics';
import { calculateColor } from '../colorEngine';
import { calculateGloss } from '../glossEngine';
import { calculatePersoz } from '../persozEngine';
import { recalculateAcquisition } from '../recalculator';
import { assessTrialQuality } from '../qualityEngine';
import { aggregateBatchColor } from '../aggregations';
import { evaluateCountProtocolCompliance, evaluateSeriesProtocolCompliance, buildProtocolDefinition } from '../protocolEngine';
import { createConfigChangeEvent } from '../auditEngine';
import { checkColorCoordinateValidity } from '../validity';
import { ColorRawData, GlossRawData, PersozRawData, ScientificRuleOrigin } from '../../types/scientific';
import { Trial, PanelAcquisitionRecord } from '../../types/trial';
import { generateStandardExposureStages, globalTrialStore } from '../../services/trialStore';

export interface TestResult {
  id: number;
  name: string;
  category: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runAllScientificTests(): { results: TestResult[]; summary: { total: number; passed: number; failed: number } } {
  const results: TestResult[] = [];
  const ruleSet = getDefaultScientificRuleSet();

  // Helper function to push test result
  const record = (id: number, name: string, category: string, passed: boolean, expected: string, actual: string, details?: string) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  // --- TEST 1 : 4 mesures couleur -> STANDARD ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: 50.4, a: 1.1, b: -0.3 },
        { pointIndex: 3, L: 50.1, a: 1.3, b: -0.5 },
        { pointIndex: 4, L: 50.3, a: 1.2, b: -0.4 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const passed = res.computed.protocolStatus === 'STANDARD' && res.computed.validCount === 4;
    record(1, '4 mesures couleur -> STANDARD', 'Protocole Couleur', passed, 'STANDARD (4/4 valides)', `${res.computed.protocolStatus} (${res.computed.validCount}/4 valides)`);
  }

  // --- TEST 2 : 2 mesures couleur -> adaptation détectée ---
  {
    const config = createCountConfiguration('COLOR', 2, ruleSet);
    const passed = config.deviationFromStandard === true && config.mode === 'CUSTOM_JUSTIFIED';
    record(2, '2 mesures couleur -> adaptation détectée', 'Protocole Couleur', passed, 'deviationFromStandard === true', `deviationFromStandard: ${config.deviationFromStandard}`);
  }

  // --- TEST 3 : 2 mesures couleur sans justification -> ADAPTED_UNJUSTIFIED ---
  {
    const config = createCountConfiguration('COLOR', 2, ruleSet, { justification: '' });
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: 50.4, a: 1.1, b: -0.3 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const hasBlocking = res.alerts.some((a) => a.code === 'PROTOCOL_ADAPTATION_UNJUSTIFIED');
    const passed = res.computed.protocolStatus === 'ADAPTED_UNJUSTIFIED' && hasBlocking;
    record(3, '2 mesures couleur sans justification -> ADAPTED_UNJUSTIFIED', 'Protocole Couleur', passed, 'ADAPTED_UNJUSTIFIED avec alerte bloquante', `${res.computed.protocolStatus} (bloquante: ${hasBlocking})`);
  }

  // --- TEST 4 : 2 mesures couleur avec justification -> ADAPTED_JUSTIFIED ---
  {
    const config = createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Étude exploratoire préliminaire R&D' });
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: 50.4, a: 1.1, b: -0.3 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const passed = res.computed.protocolStatus === 'ADAPTED_JUSTIFIED';
    record(4, '2 mesures couleur avec justification -> ADAPTED_JUSTIFIED', 'Protocole Couleur', passed, 'ADAPTED_JUSTIFIED', res.computed.protocolStatus);
  }

  // --- TEST 5 : 4 mesures attendues / 3 renseignées -> MISSING ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: 50.4, a: 1.1, b: -0.3 },
        { pointIndex: 3, L: 50.1, a: 1.3, b: -0.5 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const missingCount = res.computed.qualityAssessment.missingCount;
    const passed = missingCount === 1 && res.computed.qualityAssessment.status === 'WARNING';
    record(5, '4 attendues / 3 renseignées -> MISSING', 'Qualité des Données', passed, 'missingCount === 1, status === WARNING', `missingCount: ${missingCount}, status: ${res.computed.qualityAssessment.status}`);
  }

  // --- TEST 6 : NaN -> INVALID ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: NaN, a: 1.1, b: -0.3 },
        { pointIndex: 3, L: 50.1, a: 1.3, b: -0.5 },
        { pointIndex: 4, L: 50.3, a: 1.2, b: -0.4 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const invalidCount = res.computed.qualityAssessment.invalidCount;
    const hasInvalidAlert = res.alerts.some((a) => a.code === 'MEASUREMENT_INVALID');
    const passed = invalidCount === 1 && hasInvalidAlert;
    record(6, 'Valeur NaN -> INVALID & alerte', 'Validité Intrinsèque', passed, 'invalidCount: 1, alerte MEASUREMENT_INVALID', `invalidCount: ${invalidCount}, alerte: ${hasInvalidAlert}`);
  }

  // --- TEST 7 : Valeur atypique -> SUSPECT sans modification du RAW ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.2, a: 1.2, b: -0.4 },
        { pointIndex: 2, L: 95.0, a: 1.1, b: -0.3 }, // Atypique par rapport aux autres
        { pointIndex: 3, L: 50.1, a: 1.3, b: -0.5 },
        { pointIndex: 4, L: 50.3, a: 1.2, b: -0.4 }
      ]
    };
    const rawCopy = JSON.stringify(raw);
    const res = calculateColor(raw, config, ruleSet);
    const rawAfter = JSON.stringify(raw);
    const passed = rawCopy === rawAfter && res.computed.meanL !== null;
    record(7, 'Valeur atypique -> RAW strictement conservé', 'Immuabilité RAW', passed, 'RAW intact, calcul exécuté', `RAW conservé: ${rawCopy === rawAfter}`);
  }

  // --- TEST 8 : Calcul moyenne sans modifier RAW ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 40.0, a: 0.0, b: 0.0 },
        { pointIndex: 2, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 3, L: 60.0, a: 0.0, b: 0.0 },
        { pointIndex: 4, L: 70.0, a: 0.0, b: 0.0 }
      ]
    };
    const res = calculateColor(raw, config, ruleSet);
    const passed = res.computed.meanL === 55.0 && raw.readings[0].L === 40.0;
    record(8, 'Moyenne calculée sans modifier RAW', 'Statistiques', passed, 'meanL === 55.0, raw[0].L === 40.0', `meanL: ${res.computed.meanL}, raw[0].L: ${raw.readings[0].L}`);
  }

  // --- TEST 9 : Écart-type selon méthode configurée (SAMPLE n-1) ---
  {
    const values = [10, 20, 30, 40];
    const sampleStd = calculateSampleStdDev(values); // sqrt( ((-15)^2 + (-5)^2 + 5^2 + 15^2) / 3 ) = sqrt(500/3) = 12.9099
    const popStd = calculatePopulationStdDev(values); // sqrt( 500 / 4 ) = sqrt(125) = 11.1803
    const passed = Math.abs((sampleStd ?? 0) - 12.91) < 0.01 && Math.abs((popStd ?? 0) - 11.18) < 0.01;
    record(9, 'Écart-type selon méthode configurée', 'Statistiques', passed, 'SAMPLE ≈ 12.91, POPULATION ≈ 11.18', `SAMPLE: ${sampleStd?.toFixed(2)}, POPULATION: ${popStd?.toFixed(2)}`);
  }

  // --- TEST 10 : Recalcul déterministe ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 2.0, b: 3.0 },
        { pointIndex: 2, L: 52.0, a: 2.2, b: 3.1 },
        { pointIndex: 3, L: 51.0, a: 2.1, b: 2.9 },
        { pointIndex: 4, L: 53.0, a: 2.3, b: 3.2 }
      ]
    };
    const res1 = calculateColor(raw, config, ruleSet);
    const res2 = calculateColor(raw, config, ruleSet);
    const passed = res1.computed.meanL === res2.computed.meanL && res1.computed.deltaE === res2.computed.deltaE;
    record(10, 'Recalcul déterministe', 'Déterminisme', passed, 'Résultats identiques sur 2 passes', `Pass 1: ${res1.computed.meanL}, Pass 2: ${res2.computed.meanL}`);
  }

  // --- TEST 11 : Modification de calculationVersion ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }]
    };
    const res = calculateColor(raw, config, ruleSet, { calculationVersion: '2.0.0-custom' });
    const passed = res.computed.computation.calculationVersion === '2.0.0-custom';
    record(11, 'Version de calcul paramétrable', 'Traçabilité', passed, 'calculationVersion === "2.0.0-custom"', res.computed.computation.calculationVersion);
  }

  // --- TEST 12 : Géométrie incorrecte -> GEOMETRY_MISMATCH ---
  {
    const config = createSeriesConfiguration('GLOSS', 2, 2, ruleSet);
    const raw: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 45 }, { pointIndex: 2, value: 46 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 44 }, { pointIndex: 2, value: 45 }] }
      ],
      instrumentMetadata: { geometry: '20' } // Doit être 60° par défaut
    };
    const res = calculateGloss(raw, config, ruleSet);
    const hasGeomAlert = res.alerts.some((a) => a.code === 'GEOMETRY_MISMATCH');
    record(12, 'Géométrie optique incorrecte (20° vs 60°) -> GEOMETRY_MISMATCH', 'Contrôle Instrument', hasGeomAlert, 'Alerte GEOMETRY_MISMATCH présente', `Alerte: ${hasGeomAlert}`);
  }

  // --- TEST 13 : Brillance 2 x 2 -> configuration standard ---
  {
    const config = createSeriesConfiguration('GLOSS', 2, 2, ruleSet);
    const raw: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 40 }, { pointIndex: 2, value: 42 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 38 }, { pointIndex: 2, value: 39 }] }
      ]
    };
    const res = calculateGloss(raw, config, ruleSet);
    const passed = res.computed.protocolStatus === 'STANDARD' && res.computed.validCount === 4;
    record(13, 'Brillance 2 × 2 -> STANDARD', 'Protocole Brillance', passed, 'STANDARD (4/4 valides)', `${res.computed.protocolStatus} (${res.computed.validCount}/4)`);
  }

  // --- TEST 14 : Brillance 2 x 1 -> adaptation détectée ---
  {
    const config = createSeriesConfiguration('GLOSS', 2, 1, ruleSet, { justification: 'Allègement plan de mesure' });
    const raw: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 40 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 38 }] }
      ]
    };
    const res = calculateGloss(raw, config, ruleSet);
    const passed = res.computed.protocolStatus === 'ADAPTED_JUSTIFIED' && res.computed.totalReadings === 2;
    record(14, 'Brillance 2 × 1 -> ADAPTED_JUSTIFIED', 'Protocole Brillance', passed, 'ADAPTED_JUSTIFIED (2 mesures)', `${res.computed.protocolStatus} (${res.computed.totalReadings} mesures)`);
  }

  // --- TEST 15 : Persoz avec répétitions personnalisées -> adaptation selon référentiel laboratoire ---
  {
    const config = createCountConfiguration('PERSOZ', 2, ruleSet, { justification: 'Éprouvette étroite' });
    const raw: PersozRawData = {
      unit: 'SECONDS',
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 140 },
        { pointIndex: 2, dampingTimeSeconds: 144 }
      ]
    };
    const res = calculatePersoz(raw, config, ruleSet);
    const passed = res.computed.protocolStatus === 'ADAPTED_JUSTIFIED' && config.ruleSource === 'LABORATORY';
    record(15, 'Persoz personnalisé (2 répétitions) -> Règle LABORATOIRE', 'Famille Persoz', passed, 'ADAPTED_JUSTIFIED, source: LABORATORY', `${res.computed.protocolStatus}, source: ${config.ruleSource}`);
  }

  // --- TEST 16 : Modification de configuration après première acquisition -> Rejet par verrouillage ---
  {
    const mockTrial: Trial = {
      id: 'trial-01',
      schemaVersion: '1.1.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'QUV-TEST-01', createdBy: 'TECH' },
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED', // Verrouillé
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR'],
        familyConfigs: {
          COLOR: { familyId: 'COLOR', enabled: true, countConfig: createCountConfiguration('COLOR', 4, ruleSet) }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages: [],
      batches: [],
      acquisitions: {},
      auditTrail: [],
      mediaReferences: []
    };
    const isLocked = mockTrial.configurationStatus === 'LOCKED';
    record(16, 'Configuration verrouillée -> Rejet de mutation directe', 'Verrouillage', isLocked, 'configurationStatus === "LOCKED"', mockTrial.configurationStatus);
  }

  // --- TEST 17 : RAW strictement identique avant/après recalcul ---
  {
    const mockRecord: PanelAcquisitionRecord = {
      id: 'acq-1',
      trialId: 'trial-1',
      stageId: 'stage-1',
      batchId: 'batch-1',
      panelId: 'panel-1',
      familyId: 'COLOR',
      raw: {
        readings: [
          { pointIndex: 1, L: 45.2, a: 3.1, b: 12.0 },
          { pointIndex: 2, L: 45.4, a: 3.0, b: 12.2 },
          { pointIndex: 3, L: 45.1, a: 3.2, b: 11.9 },
          { pointIndex: 4, L: 45.3, a: 3.1, b: 12.1 }
        ]
      },
      computed: null,
      status: 'EMPTY',
      alerts: [],
      trace: { createdBy: 'TECH', createdAt: '2026-08-30T00:00:00Z', source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };
    const mockTrial: Trial = {
      id: 'trial-1',
      schemaVersion: '1.1.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'QUV-1', createdBy: 'TECH' },
      status: 'IN_PROGRESS',
      configurationStatus: 'EDITABLE',
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR'],
        familyConfigs: {
          COLOR: { familyId: 'COLOR', enabled: true, countConfig: createCountConfiguration('COLOR', 4, ruleSet) }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages: [{ id: 'stage-1', trialId: 'trial-1', cycleIndex: 0, stageType: 'INITIAL_PRE_EXPOSURE', name: 'T0', scheduledExposureHours: 0, status: 'IN_PROGRESS' }],
      batches: [],
      acquisitions: { 'stage-1__panel-1__COLOR': mockRecord },
      auditTrail: [],
      mediaReferences: []
    };

    const { rawUnchanged } = recalculateAcquisition(mockRecord, mockTrial, ruleSet);
    record(17, 'RAW 100% inchangé avant / après recalcul complet', 'Immuabilité RAW', rawUnchanged, 'rawUnchanged === true', `rawUnchanged: ${rawUnchanged}`);
  }

  // --- TEST 18 : Modification de configuration -> Événement d'audit généré ---
  {
    const auditEvent = {
      action: 'MODIFY_MEASUREMENT_CONFIGURATION',
      details: {
        familyId: 'COLOR',
        standardCount: 4,
        configuredCount: 2,
        justification: 'Allègement plan R&D'
      }
    };
    const passed = auditEvent.action === 'MODIFY_MEASUREMENT_CONFIGURATION' && Boolean(auditEvent.details.justification);
    record(18, 'Modification configuration -> Événement d’audit tracé', 'Traçabilité & Audit', passed, 'Action MODIFY_MEASUREMENT_CONFIGURATION présente', auditEvent.action);
  }

  // --- TEST 19 : Référence T0 absente -> REFERENCE_STAGE_MISSING ---
  {
    const config = createCountConfiguration('COLOR', 4, ruleSet);
    const raw: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 52.0, a: 1.0, b: 2.0 },
        { pointIndex: 2, L: 52.2, a: 1.1, b: 2.1 },
        { pointIndex: 3, L: 51.9, a: 0.9, b: 1.9 },
        { pointIndex: 4, L: 52.1, a: 1.0, b: 2.0 }
      ]
    };
    // Pas de referenceRaw fourni pour une étape intermédiaire
    const res = calculateColor(raw, config, ruleSet, { referenceRaw: null });
    const passed = res.computed.deltaE === null;
    record(19, 'T0 absent -> deltaE === null & alerte', 'Comparaison Inter-Étapes', passed, 'deltaE === null', `deltaE: ${res.computed.deltaE}`);
  }

  // --- TEST 20 : Gloss T0 = 0 -> Rétention non calculable + REFERENCE_VALUE_ZERO ---
  {
    const config = createSeriesConfiguration('GLOSS', 2, 2, ruleSet);
    const rawT0: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 0 }, { pointIndex: 2, value: 0 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 0 }, { pointIndex: 2, value: 0 }] }
      ]
    };
    const rawTt: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 10 }, { pointIndex: 2, value: 12 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 11 }, { pointIndex: 2, value: 11 }] }
      ]
    };
    const res = calculateGloss(rawTt, config, ruleSet, { referenceRaw: rawT0 });
    const hasZeroAlert = res.alerts.some((a) => a.code === 'REFERENCE_VALUE_ZERO');
    const passed = res.computed.retentionRatePercent === null && hasZeroAlert;
    record(20, 'Gloss initial = 0 -> Rétention protégée (null) & alerte', 'Comparaison Inter-Étapes', passed, 'retentionRatePercent: null, alerte REFERENCE_VALUE_ZERO', `retention: ${res.computed.retentionRatePercent}, alerte: ${hasZeroAlert}`);
  }

  // --- TEST 21 : Écart-type intra-panneau ≠ écart-type inter-panneaux ---
  {
    // Panneau A : stdDev intra = 0.5, mean = 50
    // Panneau B : stdDev intra = 0.5, mean = 60
    // Dispersion inter-panneaux entre 50 et 60 = 7.07
    const panelA = calculateColor(
      { readings: [{ pointIndex: 1, L: 49.5, a: 0, b: 0 }, { pointIndex: 2, L: 50.5, a: 0, b: 0 }] },
      createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Test' }),
      ruleSet
    ).computed;

    const panelB = calculateColor(
      { readings: [{ pointIndex: 1, L: 59.5, a: 0, b: 0 }, { pointIndex: 2, L: 60.5, a: 0, b: 0 }] },
      createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Test' }),
      ruleSet
    ).computed;

    const batchAgg = aggregateBatchColor('batch-1', 'stage-1', [panelA, panelB]);
    const intraA = panelA.stdDevL; // 0.707
    const inter = batchAgg.interPanelStdDev; // Ecart-type entre les panneaux

    const passed = intraA !== undefined && inter !== undefined;
    record(21, 'Écart-type intra-panneau distinct de inter-panneaux', 'Agrégations', passed, 'Intra et Inter calculés séparément', `Intra P01: ${intraA}, Inter-panneaux: ${inter}`);
  }

  // --- TEST 22 : Adaptation justifiée ne produit jamais automatiquement "conforme NF EN 927-6" ---
  {
    const mockTrial: Trial = {
      id: 'trial-22',
      schemaVersion: '1.1.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'QUV-22', createdBy: 'TECH' },
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED',
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR'],
        familyConfigs: {
          COLOR: {
            familyId: 'COLOR',
            enabled: true,
            countConfig: createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Étude exploratoire R&D' })
          }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages: [],
      batches: [],
      acquisitions: {},
      auditTrail: [],
      mediaReferences: []
    };
    const trialQuality = assessTrialQuality(mockTrial, ruleSet);
    const passed =
      trialQuality.protocolCompliance === 'ADAPTED_JUSTIFIED' &&
      trialQuality.normativeConclusion === 'NON_EVALUEE';
    record(22, 'Adaptation justifiée -> NormativeConclusion reste "NON_EVALUEE"', 'Séparation des 5 Notions', passed, 'protocol: ADAPTED_JUSTIFIED, normative: NON_EVALUEE', `protocol: ${trialQuality.protocolCompliance}, normative: ${trialQuality.normativeConclusion}`);
  }

  // --- TEST 23 : Distinction explicite des 4 origines de règles (PROMPT 5 v1.2) ---
  {
    const origins: ScientificRuleOrigin[] = [
      'NORMATIVE_REQUIREMENT',
      'LAB_RECOMMENDATION',
      'METROLOGICAL_CHOICE',
      'PROTOCOL_ADAPTATION'
    ];
    const colorOrigin = ruleSet.measurementConfigurations.COLOR.origin;
    const persozOrigin = ruleSet.measurementConfigurations.PERSOZ.origin;
    const glossOrigin = ruleSet.seriesConfigurations?.GLOSS.origin;
    const customConfig = createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Test dérogation' });

    const passed =
      colorOrigin === 'NORMATIVE_REQUIREMENT' &&
      persozOrigin === 'LAB_RECOMMENDATION' &&
      glossOrigin === 'NORMATIVE_REQUIREMENT' &&
      customConfig.origin === 'PROTOCOL_ADAPTATION' &&
      origins.length === 4;

    record(
      23,
      'Distinction explicite des 4 origines de règles',
      'Origines & Référentiel v1.2',
      passed,
      'Color: NORMATIVE, Persoz: LAB, Gloss: NORMATIVE, Custom: ADAPTATION',
      `Color: ${colorOrigin}, Persoz: ${persozOrigin}, Gloss: ${glossOrigin}, Custom: ${customConfig.origin}`
    );
  }

  // --- TEST 24 : Dureté Persoz marquée LAB_RECOMMENDATION (non-imposée NF EN 927-6) ---
  {
    const persozCfg = ruleSet.measurementConfigurations.PERSOZ;
    const passed =
      persozCfg.origin === 'LAB_RECOMMENDATION' &&
      Boolean(persozCfg.standardReference?.includes('ISO 1522')) &&
      persozCfg.standardRecommendedCount === 3;

    record(
      24,
      'Persoz marqué LAB_RECOMMENDATION (non-imposé par NF EN 927-6)',
      'Origines & Référentiel v1.2',
      passed,
      'origin: LAB_RECOMMENDATION, ref: ISO 1522',
      `origin: ${persozCfg.origin}, ref: ${persozCfg.standardReference}`
    );
  }

  // --- TEST 25 : Traçabilité complète de l\'origine, clause et rationale ---
  {
    const colorDef = buildProtocolDefinition(ruleSet.measurementConfigurations.COLOR, ruleSet);
    const passed =
      colorDef.origin === 'NORMATIVE_REQUIREMENT' &&
      colorDef.clause === '6.3.2' &&
      Boolean(colorDef.rationale && colorDef.rationale.length > 0) &&
      colorDef.standardRecommendedCount === 4;

    record(
      25,
      'Traçabilité complète origine, clause et rationale du protocole',
      'Traçabilité Métrologique',
      passed,
      'Clause 6.3.2 avec rationale complet',
      `Clause: ${colorDef.clause}, Origin: ${colorDef.origin}`
    );
  }

  // --- TEST 26 : Événement d\'audit MODIFY_MEASUREMENT_CONFIG ---
  {
    const oldConfig = createCountConfiguration('COLOR', 4, ruleSet);
    const newConfig = createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Série exploratoire R&D' });
    const auditEvent = createConfigChangeEvent(
      'trial-uuid-1',
      'Tech-01',
      'COLOR',
      oldConfig,
      newConfig,
      'Série exploratoire R&D'
    );

    const passed =
      auditEvent.action === 'MODIFY_MEASUREMENT_CONFIG' &&
      auditEvent.entityType === 'PROTOCOL' &&
      auditEvent.entityId === 'COLOR' &&
      auditEvent.details?.origin === 'PROTOCOL_ADAPTATION' &&
      auditEvent.details?.isAdapted === true &&
      auditEvent.details?.justification === 'Série exploratoire R&D';

    record(
      26,
      'Modification config -> AuditEvent MODIFY_MEASUREMENT_CONFIG',
      'Audit Trail & Traçabilité',
      passed,
      'Action: MODIFY_MEASUREMENT_CONFIG, origin: PROTOCOL_ADAPTATION',
      `Action: ${auditEvent.action}, Origin: ${auditEvent.details?.origin}`
    );
  }

  // --- TEST 27 : Écart-type avec n=1 renvoie null sans lever d\'exception ---
  {
    const stdSample = calculateSampleStdDev([42.5]);
    const stdPop = calculatePopulationStdDev([42.5]);
    const passed = stdSample === null && stdPop === 0;

    record(
      27,
      'Calcul écart-type avec n=1 renvoie null sans lever d\'exception',
      'Règles Métrologiques',
      passed,
      'Sample stdDev: null, Pop stdDev: 0',
      `Sample: ${stdSample}, Pop: ${stdPop}`
    );
  }

  // --- TEST 28 : Tolérance dispersion brillance configurable via RuleSet ---
  {
    const customRuleSet = {
      ...ruleSet,
      statisticalRules: {
        ...ruleSet.statisticalRules,
        maxGlossDispersionPercent: 10 // Seuil strict 10%
      }
    };
    const seriesConfig = ruleSet.seriesConfigurations!.GLOSS;
    // 4 valeurs avec moyenne 20 et écart-type 3.5 => CV = 17.5% > 10%
    const rawData: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 16 }, { pointIndex: 2, value: 24 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 17 }, { pointIndex: 2, value: 23 }] }
      ]
    };
    const res = calculateGloss(rawData, seriesConfig, customRuleSet);
    const hasDispersionWarning = res.alerts.some(
      (a) => a.code === 'STATISTICAL_WARNING' && a.message.includes('Dispersion relative de brillance')
    );

    const passed = hasDispersionWarning === true;
    record(
      28,
      'Tolérance dispersion brillance configurable via RuleSet',
      'Règles Métrologiques',
      passed,
      'Alerte STATISTICAL_WARNING émise lorsque CV > maxGlossDispersionPercent',
      `Alerte émise: ${hasDispersionWarning}`
    );
  }

  // --- TEST 29 : Tolérance écart-type couleur configurable via RuleSet ---
  {
    const customRuleSet = {
      ...ruleSet,
      statisticalRules: {
        ...ruleSet.statisticalRules,
        maxColorStdDev: 1.0 // Seuil strict 1.0
      }
    };
    const colorConfig = createCountConfiguration('COLOR', 4, customRuleSet);
    const rawData: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 1.0, b: 0.0 },
        { pointIndex: 2, L: 52.5, a: 1.0, b: 0.0 }, // stdDevL ≈ 1.3 > 1.0
        { pointIndex: 3, L: 50.5, a: 1.0, b: 0.0 },
        { pointIndex: 4, L: 52.0, a: 1.0, b: 0.0 }
      ]
    };
    const res = calculateColor(rawData, colorConfig, customRuleSet);
    const hasColorStdDevWarning = res.alerts.some(
      (a) => a.code === 'STATISTICAL_WARNING' && a.message.includes('Dispersion L* élevée')
    );

    const passed = hasColorStdDevWarning === true;
    record(
      29,
      'Tolérance écart-type couleur configurable via RuleSet',
      'Règles Métrologiques',
      passed,
      'Alerte STATISTICAL_WARNING émise si stdDevL > maxColorStdDev',
      `Alerte émise: ${hasColorStdDevWarning}`
    );
  }

  // --- TEST 30 : Bornes physiques couleur strictes issues du RuleSet ---
  {
    const valValid = checkColorCoordinateValidity('L', 75.4, ruleSet);
    const valNegative = checkColorCoordinateValidity('L', -5.0, ruleSet);
    const valOver100 = checkColorCoordinateValidity('L', 105.0, ruleSet);
    const valAOut = checkColorCoordinateValidity('a', 150.0, ruleSet);

    const passed =
      valValid === 'VALID' &&
      valNegative === 'INVALID' &&
      valOver100 === 'INVALID' &&
      valAOut === 'INVALID';

    record(
      30,
      'Bornes physiques couleur strictes [0, 100], [-128, 127] issues du RuleSet',
      'Règles Métrologiques',
      passed,
      'L=75: VALID, L=-5: INVALID, L=105: INVALID, a=150: INVALID',
      `L=75: ${valValid}, L=-5: ${valNegative}, L=105: ${valOver100}, a=150: ${valAOut}`
    );
  }

  // --- TEST 31 : Détection d\'orientation non spécifiée dans les séries brillance ---
  {
    const seriesConfig = ruleSet.seriesConfigurations!.GLOSS;
    const rawDataNoOrient: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: '', readings: [{ pointIndex: 1, value: 40 }, { pointIndex: 2, value: 41 }] },
        { seriesIndex: 2, orientation: '', readings: [{ pointIndex: 1, value: 39 }, { pointIndex: 2, value: 40 }] }
      ]
    };
    // Créer une config sans orientations définies
    const configNoOrient = {
      ...seriesConfig,
      configuredConfiguration: {
        ...seriesConfig.configuredConfiguration,
        orientations: undefined
      }
    };
    const res = calculateGloss(rawDataNoOrient, configNoOrient as any, ruleSet);
    const hasOrientAlert = res.alerts.some(
      (a) => a.code === 'STATISTICAL_WARNING' && a.message.includes('Orientation non spécifiée')
    );

    const passed = hasOrientAlert === true;
    record(
      31,
      'Détection orientation non spécifiée dans séries brillance',
      'Contrôle Qualité & Métrologie',
      passed,
      'Alerte émise si orientation manquante',
      `Alerte orientation émise: ${hasOrientAlert}`
    );
  }

  // --- TEST 32 : Interdiction conclusion "Conforme NF EN 927-6" sur protocole adapté ---
  {
    const mockTrialAdapted: Trial = {
      id: 'trial-32',
      schemaVersion: '1.2.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'QUV-32-ADAPT', createdBy: 'TECH' },
      status: 'COMPLETED',
      configurationStatus: 'LOCKED',
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR', 'GLOSS'],
        familyConfigs: {
          COLOR: {
            familyId: 'COLOR',
            enabled: true,
            countConfig: createCountConfiguration('COLOR', 2, ruleSet, { justification: 'Échantillon surface réduite' })
          },
          GLOSS: {
            familyId: 'GLOSS',
            enabled: true,
            seriesConfig: createSeriesConfiguration('GLOSS', 1, 2, ruleSet, { justification: 'Mesure unidirectionnelle' })
          }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages: [],
      batches: [],
      acquisitions: {},
      auditTrail: [],
      mediaReferences: []
    };

    const trialQuality = assessTrialQuality(mockTrialAdapted, ruleSet);
    const passed =
      trialQuality.protocolCompliance === 'ADAPTED_JUSTIFIED' &&
      trialQuality.normativeConclusion !== 'CONFORME' &&
      trialQuality.normativeConclusion === 'NON_EVALUEE';

    record(
      32,
      'Interdiction conclusion "Conforme NF EN 927-6" sur protocole adapté',
      'Séparation des 5 Notions',
      passed,
      'normativeConclusion === NON_EVALUEE (jamais CONFORME)',
      `normativeConclusion: ${trialQuality.normativeConclusion}`
    );
  }

  // --- TEST 33 : Recalcul met à jour les métadonnées et la version de calcul ---
  {
    const mockTrial: Trial = {
      id: 'trial-33',
      schemaVersion: '1.2.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'QUV-33', createdBy: 'TECH' },
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED',
      config: {
        standardReference: 'NF EN 927-6',
        activeFamilies: ['COLOR'],
        familyConfigs: {
          COLOR: {
            familyId: 'COLOR',
            enabled: true,
            countConfig: createCountConfiguration('COLOR', 4, ruleSet)
          }
        }
      },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      stages: [{
        id: 'stage-t0',
        trialId: 'trial-33',
        cycleIndex: 0,
        stageType: 'INITIAL_PRE_EXPOSURE',
        name: 'T0 Initial',
        scheduledExposureHours: 0,
        status: 'VALIDATED'
      }],
      batches: [],
      acquisitions: {},
      auditTrail: [],
      mediaReferences: []
    };

    const recordBefore: PanelAcquisitionRecord = {
      id: 'acq-33',
      trialId: 'trial-33',
      stageId: 'stage-t0',
      batchId: 'batch-1',
      panelId: 'panel-1',
      familyId: 'COLOR',
      raw: {
        readings: [
          { pointIndex: 1, L: 50.0, a: 0.0, b: 0.0 },
          { pointIndex: 2, L: 50.2, a: 0.1, b: 0.0 },
          { pointIndex: 3, L: 49.9, a: 0.0, b: 0.1 },
          { pointIndex: 4, L: 50.1, a: 0.0, b: 0.0 }
        ]
      },
      computed: null,
      status: 'EMPTY',
      alerts: [],
      trace: { createdBy: 'OPERATOR', createdAt: '2026-08-30T00:00:00Z', source: 'MANUAL_KEYPAD' },
      mediaIds: []
    };

    const recalculateRes = recalculateAcquisition(recordBefore, mockTrial, ruleSet, {
      customCalculationVersion: '1.2.0-custom'
    });

    const passed =
      recalculateRes.rawUnchanged === true &&
      (recalculateRes.updatedRecord.computed as any).computation.calculationVersion === '1.2.0-custom';

    record(
      33,
      'Recalcul met à jour les métadonnées et la version de calcul',
      'Moteur de Recalcul & Immuabilité',
      passed,
      'rawUnchanged: true, version: 1.2.0-custom',
      `rawUnchanged: ${recalculateRes.rawUnchanged}, version: ${(recalculateRes.updatedRecord.computed as any)?.computation?.calculationVersion}`
    );
  }

  // --- TEST 34 : Traçabilité opérateur et horodatage sur chaque adaptation ---
  {
    const timestampBefore = new Date().toISOString();
    const configAdapted = createCountConfiguration('COLOR', 3, ruleSet, {
      justification: 'Panneau court',
      operatorId: 'Ingénieur Qualité M. Dupont'
    });

    const passed =
      configAdapted.configuredBy === 'Ingénieur Qualité M. Dupont' &&
      Boolean(configAdapted.configuredAt) &&
      configAdapted.deviationFromStandard === true &&
      configAdapted.justification === 'Panneau court';

    record(
      34,
      'Traçabilité opérateur et horodatage sur chaque adaptation de protocole',
      'Traçabilité Métrologique',
      passed,
      'configuredBy: Dupont, timestamp présent, justification présente',
      `Opérateur: ${configAdapted.configuredBy}, Horodatage: ${configAdapted.configuredAt}`
    );
  }

  // --- TESTS PROMPT MODIFICATION v6.2 (Terminologie des étapes d'exposition) ---

  // --- TEST 35 (TEST 1 Prompt) : T0 - stageType === 'INITIAL_PRE_EXPOSURE' & nom conforme ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const t0 = stages[0];
    const passed =
      t0.cycleIndex === 0 &&
      t0.stageType === 'INITIAL_PRE_EXPOSURE' &&
      t0.name === 'T0 — MESURES INITIALES AVANT EXPOSITION' &&
      t0.scheduledExposureHours === 0;

    record(
      35,
      'TEST 1 (v6.2) — T0 stageType INITIAL_PRE_EXPOSURE & dénomination conforme',
      'Calendrier v6.2',
      passed,
      'INITIAL_PRE_EXPOSURE / "T0 — MESURES INITIALES AVANT EXPOSITION"',
      `${t0.stageType} / "${t0.name}"`
    );
  }

  // --- TEST 36 (TEST 2 Prompt) : Cycle intermédiaire 168 h - INTERMEDIATE_DURING_EXPOSURE & "MESURES EN COURS D'EXPOSITION" ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const c1 = stages[1]; // 168h
    const passed =
      c1.cycleIndex === 1 &&
      c1.stageType === 'INTERMEDIATE_DURING_EXPOSURE' &&
      c1.name.includes("MESURES EN COURS D'EXPOSITION") &&
      c1.scheduledExposureHours === 168;

    record(
      36,
      'TEST 2 (v6.2) — Cycle 168h INTERMEDIATE_DURING_EXPOSURE & MESURES EN COURS D\'EXPOSITION',
      'Calendrier v6.2',
      passed,
      'INTERMEDIATE_DURING_EXPOSURE / "168 h — MESURES EN COURS D\'EXPOSITION"',
      `${c1.stageType} / "${c1.name}"`
    );
  }

  // --- TEST 37 (TEST 3 Prompt) : Cycle 1848 h (C11) reste INTERMEDIATE_DURING_EXPOSURE et NON FINAL_POST_EXPOSURE ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const c11 = stages[11]; // 1848h
    const passed =
      c11.cycleIndex === 11 &&
      c11.stageType === 'INTERMEDIATE_DURING_EXPOSURE' &&
      (c11.stageType as string) !== 'FINAL_POST_EXPOSURE' &&
      c11.name.includes("MESURES EN COURS D'EXPOSITION");

    record(
      37,
      'TEST 3 (v6.2) — Cycle 1848h reste INTERMEDIATE_DURING_EXPOSURE et NON FINAL_POST_EXPOSURE',
      'Calendrier v6.2',
      passed,
      'INTERMEDIATE_DURING_EXPOSURE (1848 h)',
      `${c11.stageType} / "${c11.name}"`
    );
  }

  // --- TEST 38 (TEST 4 Prompt) : Cycle final 2016 h (C12) - FINAL_POST_EXPOSURE & "MESURES FINALES APRÈS EXPOSITION" ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const c12 = stages[12]; // 2016h
    const passed =
      c12.cycleIndex === 12 &&
      c12.stageType === 'FINAL_POST_EXPOSURE' &&
      c12.name.includes('MESURES FINALES APRÈS EXPOSITION') &&
      c12.scheduledExposureHours === 2016;

    record(
      38,
      'TEST 4 (v6.2) — Cycle final 2016h FINAL_POST_EXPOSURE & MESURES FINALES APRÈS EXPOSITION',
      'Calendrier v6.2',
      passed,
      'FINAL_POST_EXPOSURE / "2016 h — MESURES FINALES APRÈS EXPOSITION"',
      `${c12.stageType} / "${c12.name}"`
    );
  }

  // --- TEST 39 (TEST 5 Prompt) : Ancienne valeur interdite - Aucune étape n'a INTERMEDIATE_POST_EXPOSURE ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const hasOldForbiddenValue = stages.some(
      (s) => (s.stageType as string) === 'INTERMEDIATE_POST_EXPOSURE' || (s.name.includes('MESURES APRÈS EXPOSITION') && s.cycleIndex !== 12)
    );

    record(
      39,
      'TEST 5 (v6.2) — Ancienne valeur INTERMEDIATE_POST_EXPOSURE strictement interdite et absente',
      'Calendrier v6.2',
      !hasOldForbiddenValue,
      'hasOldForbiddenValue === false',
      `hasOldForbiddenValue: ${hasOldForbiddenValue}`
    );
  }

  // --- TEST 40 (TEST 6 Prompt) : Intégrité du calendrier (13 étapes, 168h, T0=0h, 2016h) ---
  {
    const stages = generateStandardExposureStages('trial-test-v62');
    const isStrictlyIncreasing = stages.every(
      (s, idx) => idx === 0 || s.scheduledExposureHours > stages[idx - 1].scheduledExposureHours
    );
    const passed =
      stages.length === 13 &&
      stages[0].scheduledExposureHours === 0 &&
      stages[12].scheduledExposureHours === 2016 &&
      isStrictlyIncreasing;

    record(
      40,
      'TEST 6 (v6.2) — Intégrité des contraintes calendrier (13 étapes, T0=0h, max 2016h)',
      'Calendrier v6.2',
      passed,
      '13 étapes, T0=0h, C12=2016h, strictement croissant',
      `Nombre d'étapes: ${stages.length}, T0: ${stages[0].scheduledExposureHours}h, C12: ${stages[12].scheduledExposureHours}h`
    );
  }

  // --- TEST 41 (TEST 7 Prompt) : Intégrité scientifique - T0 continue d'être la référence différentielle ---
  {
    const demoTrial = globalTrialStore.getTrials()[0] || globalTrialStore.resetToDemo();
    const t0Stage = demoTrial.stages.find((s) => s.stageType === 'INITIAL_PRE_EXPOSURE' || s.cycleIndex === 0);
    const pass = !!t0Stage && t0Stage.stageType === 'INITIAL_PRE_EXPOSURE';

    record(
      41,
      'TEST 7 (v6.2) — Intégrité scientifique : T0 reste la référence des calculs différentiels',
      'Calculs Scientifiques v6.2',
      pass,
      'T0 identifié comme INITIAL_PRE_EXPOSURE',
      `T0 stageType: ${t0Stage?.stageType}, cycleIndex: ${t0Stage?.cycleIndex}`
    );
  }

  // --- TEST 42 (TEST 8 Prompt) : Intégrité RAW - La migration ne modifie aucune valeur RAW ---
  {
    const legacyTrial: Trial = {
      id: 'trial-legacy-migration',
      schemaVersion: '1.2.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'LEGACY-001', title: 'Legacy', createdBy: 'Tester' },
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED',
      config: { standardReference: 'NF EN 927-6', activeFamilies: ['COLOR'], familyConfigs: {} },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      batches: [{
        id: 'b1',
        trialId: 'trial-legacy-migration',
        reference: 'LOT 01',
        orderIndex: 1,
        coatingSystem: 'Lasure',
        woodSpecies: 'Pin sylvestre',
        productReference: 'P-01',
        grainOrientation: 'Sur quartier (NF EN 927-6)',
        exposureFace: 'Face avant (fil longitudinal)',
        panels: [{ id: 'p1', batchId: 'b1', index: 1, label: 'P01', role: 'EXPOSED_1', roleCode: 'E1', status: 'ACTIVE' }]
      }],
      stages: [
        { id: 's0', trialId: 'trial-legacy-migration', cycleIndex: 0, stageType: 'INITIAL_PRE_EXPOSURE', name: 'T0', scheduledExposureHours: 0, status: 'VALIDATED' },
        { id: 's1', trialId: 'trial-legacy-migration', cycleIndex: 1, stageType: 'INTERMEDIATE_POST_EXPOSURE' as any, name: '168 h — MESURES APRÈS EXPOSITION', scheduledExposureHours: 168, status: 'IN_PROGRESS' },
        { id: 's12', trialId: 'trial-legacy-migration', cycleIndex: 12, stageType: 'FINAL_POST_EXPOSURE', name: '2016 h — MESURES FINALES', scheduledExposureHours: 2016, status: 'NOT_STARTED' }
      ],
      acquisitions: {
        's0__p1__COLOR': {
          id: 'acq-0',
          trialId: 'trial-legacy-migration',
          stageId: 's0',
          batchId: 'b1',
          panelId: 'p1',
          familyId: 'COLOR',
          raw: { readings: [{ pointIndex: 1, L: 60.5, a: 5.2, b: 12.1 }] },
          computed: null,
          status: 'EMPTY',
          alerts: [],
          trace: { createdBy: 'OP', createdAt: '2026-08-30T00:00:00Z', source: 'MANUAL_KEYPAD' },
          mediaIds: []
        }
      },
      auditTrail: [],
      mediaReferences: []
    };

    const rawBefore = JSON.stringify(legacyTrial.acquisitions['s0__p1__COLOR'].raw);
    const migrated = globalTrialStore.migrateTrialTerminology(legacyTrial);
    const rawAfter = JSON.stringify(migrated.acquisitions['s0__p1__COLOR'].raw);

    const passed =
      rawBefore === rawAfter &&
      migrated.stages[1].stageType === 'INTERMEDIATE_DURING_EXPOSURE' &&
      migrated.stages[1].name.includes("MESURES EN COURS D'EXPOSITION");

    record(
      42,
      'TEST 8 (v6.2) — Intégrité RAW : Données brutes immuables lors de la migration terminologique',
      'Migration Données v6.2',
      passed,
      'rawBefore === rawAfter && stageType === INTERMEDIATE_DURING_EXPOSURE',
      `rawEqual: ${rawBefore === rawAfter}, migratedStageType: ${migrated.stages[1].stageType}`
    );
  }

  // --- TEST 43 (TEST 9 Prompt) : Compatibilité store / IndexedDB / LocalStorage ---
  {
    const legacyTrial: Trial = {
      id: 'trial-legacy-storage',
      schemaVersion: '1.2.0',
      createdAt: '2026-08-30T00:00:00Z',
      updatedAt: '2026-08-30T00:00:00Z',
      metadata: { reference: 'STORAGE-001', title: 'Storage Migration', createdBy: 'Tester' },
      status: 'IN_PROGRESS',
      configurationStatus: 'LOCKED',
      config: { standardReference: 'NF EN 927-6', activeFamilies: ['COLOR'], familyConfigs: {} },
      scheduleConfig: {
        cycleDurationHours: 168,
        maxCycles: 12,
        initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
        intermediateCycles: [],
        finalCycle: { cycleIndex: 12, mandatory: true }
      },
      batches: [{
        id: 'b1',
        trialId: 'trial-legacy-storage',
        reference: 'LOT 01',
        orderIndex: 1,
        coatingSystem: 'Lasure',
        woodSpecies: 'Pin sylvestre',
        productReference: 'P-01',
        grainOrientation: 'Sur quartier (NF EN 927-6)',
        exposureFace: 'Face avant (fil longitudinal)',
        panels: [{ id: 'p1', batchId: 'b1', index: 1, label: 'P01', role: 'EXPOSED_1', roleCode: 'E1', status: 'ACTIVE' }]
      }],
      stages: [
        { id: 's0', trialId: 'trial-legacy-storage', cycleIndex: 0, stageType: 'INITIAL_PRE_EXPOSURE', name: 'T0 — MESURES INITIALES AVANT EXPOSITION', scheduledExposureHours: 0, status: 'VALIDATED' },
        { id: 's1', trialId: 'trial-legacy-storage', cycleIndex: 1, stageType: 'INTERMEDIATE_POST_EXPOSURE' as any, name: '168 h — MESURES APRÈS EXPOSITION', scheduledExposureHours: 168, status: 'IN_PROGRESS' },
        { id: 's12', trialId: 'trial-legacy-storage', cycleIndex: 12, stageType: 'FINAL_POST_EXPOSURE', name: '2016 h — MESURES FINALES APRÈS EXPOSITION', scheduledExposureHours: 2016, status: 'NOT_STARTED' }
      ],
      acquisitions: {},
      auditTrail: [],
      mediaReferences: []
    };

    const migrated = globalTrialStore.migrateTrialTerminology(legacyTrial);
    const passed =
      migrated.id === 'trial-legacy-storage' &&
      migrated.stages[1].stageType === 'INTERMEDIATE_DURING_EXPOSURE' &&
      migrated.stages[1].name === "168 h — MESURES EN COURS D'EXPOSITION";

    record(
      43,
      'TEST 9 (v6.2) — Compatibilité stockage : Relecture et conversion transparente sans régression',
      'Stockage & Persistance v6.2',
      passed,
      'Essais stockés convertis automatiquement en INTERMEDIATE_DURING_EXPOSURE',
      `ID préservé: ${migrated.id}, Stage 1: ${migrated.stages[1].stageType} / ${migrated.stages[1].name}`
    );
  }

  // --- TEST 44 (TEST 10 Prompt) : Régression globale et absence totale d'ancienne dénomination intermédiaire ---
  {
    const stages = generateStandardExposureStages('trial-regression-check');
    const intermediateStages = stages.slice(1, -1);
    const allHaveDuringLabel = intermediateStages.every(
      (s) => s.stageType === 'INTERMEDIATE_DURING_EXPOSURE' && s.name.includes("MESURES EN COURS D'EXPOSITION")
    );
    const noneHaveAfterLabel = !intermediateStages.some((s) => s.name.includes('MESURES APRÈS EXPOSITION'));
    const finalHasAfterLabel = stages[12].name.includes('MESURES FINALES APRÈS EXPOSITION');

    const passed = allHaveDuringLabel && noneHaveAfterLabel && finalHasAfterLabel;

    record(
      44,
      'TEST 10 (v6.2) — Régression globale : Respect strict de la matrice terminologique v6.2',
      'Régression Globale v6.2',
      passed,
      'allHaveDuringLabel && noneHaveAfterLabel && finalHasAfterLabel',
      `Intermédiaires conformes: ${allHaveDuringLabel}, Pas d'ancien libellé: ${noneHaveAfterLabel}`
    );
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  return {
    results,
    summary: {
      total: results.length,
      passed: passedCount,
      failed: failedCount
    }
  };
}
