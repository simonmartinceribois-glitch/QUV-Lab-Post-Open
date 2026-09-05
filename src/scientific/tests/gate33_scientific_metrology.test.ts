/**
 * QUV-Lab — Suite de Tests Scientifiques & Métrologiques GATE 3.3
 *
 * Validation de la justesse scientifique, métrologique, des calculs et de l'intégrité expérimentale :
 * 1. Moteur Couleur : ΔE*ab (Cas A à E avec références indépendantes pures, Chroma, Teinte, bornes physiques).
 * 2. Moteur Brillance : Calculs de moyennes, multi-séries 2x2, géométrie 60°, deltaGloss, rétention %, cas T0=0 GU.
 * 3. Moteur Persoz : Dureté pendulaire, moyennes, écarts-types (Sample vs Population), CV %, variation relative %.
 * 4. Moteur Observations : Évaluation des défauts ISO 4628, cotations qualitatives 0..5, statuts et alertes.
 * 5. Fonctions Statistiques & Arrondis : Calculs pleine précision, non-altération précoce, protection NaN/div 0.
 * 6. Référence T0 & Échantillons : Rattachement strict au T0 du même échantillon et même lot, rejet de croisement.
 * 7. Ségrégation & Métrologie Témoin T : Exclusion absolue des moyennes de performance, cinétiques et comparateurs.
 * 8. Agrégations & Écart-Type Inter-Panneaux : Validation du calcul s_inter (toujours échantillon n-1).
 * 9. Cinétiques Temporelles & Jalons : Respect des durées réelles (168h, 336h... 2016h), conservation lors de désactivation.
 * 10. Gestion des Valeurs Manquantes & Aberrantes : Aucune invention de zéro ni de moyenne, alertes explicites.
 * 11. Comparateur Multi-Systèmes : Discrimination indépendante des lots, sans contamination croisée.
 * 12. Règles Normatives & Unités : Respect NF EN 927-6:2018 (2016h, 4 pts couleur, 2x2 brillance).
 */

import { calculateColor } from '../colorEngine';
import { calculateGloss } from '../glossEngine';
import { calculatePersoz } from '../persozEngine';
import { calculateObservations } from '../observationsEngine';
import { calculateAdhesion, getApplicableGridSpacing, calculateDelayCompliance, ISO2409_CLASSES } from '../adhesionEngine';
import {
  calculateMean,
  calculateSampleStdDev,
  calculatePopulationStdDev,
  calculateStdDevByMethod,
  calculateCoefficientOfVariation,
  roundMetric
} from '../statistics';
import {
  checkScalarValidity,
  checkColorCoordinateValidity,
  checkGlossValidity,
  checkPersozValidity,
  buildQualityAssessment
} from '../validity';
import { aggregateBatchColor, aggregateBatchGloss } from '../aggregations';
import { extractTemporalKinetics } from '../analysis/TrendAnalyzer';
import { compareSystemsAtStage } from '../analysis/MultiSystemComparator';
import { runQUVAnalysis } from '../analysis/AnalysisEngine';
import { getDefaultScientificRuleSet, createCountConfiguration } from '../ruleSet';
import {
  globalTrialStore,
  generateStandardExposureStages,
  generateUUID
} from '../../services/trialStore';
import {
  Trial,
  BatchDefinition,
  PanelDefinition,
  ExposureStage
} from '../../types/trial';
import {
  ColorRawData,
  GlossRawData,
  PersozRawData,
  AdhesionRawData,
  VisualObservationsRawData,
  ScientificRuleSet
} from '../../types/scientific';

export interface Gate33TestResult {
  id: string;
  name: string;
  category:
    | 'COLOR_DELTA_E'
    | 'GLOSS_METROLOGY'
    | 'PERSOZ_HARDNESS'
    | 'VISUAL_OBSERVATIONS'
    | 'STATISTICAL_RIGOR'
    | 'T0_REFERENCE_INTEGRITY'
    | 'WITNESS_SEGREGATION'
    | 'BATCH_AGGREGATIONS'
    | 'TEMPORAL_KINETICS'
    | 'MISSING_AND_OUTLIERS'
    | 'MULTI_SYSTEM_COMPARISON'
    | 'NORMATIVE_AND_UNITS';
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function runGate33ScientificMetrologyTests(): {
  results: Gate33TestResult[];
  summary: { total: number; passed: number; failed: number };
} {
  const results: Gate33TestResult[] = [];
  const ruleSet: ScientificRuleSet = getDefaultScientificRuleSet();

  const record = (
    id: string,
    name: string,
    category: Gate33TestResult['category'],
    passed: boolean,
    expected: string,
    actual: string,
    details?: string
  ) => {
    results.push({ id, name, category, passed, expected, actual, details });
  };

  // ==========================================================================
  // 1. COULEUR & ΔE*ab (CAS A, B, C, D, E & CHROMA / TEINTE)
  // ==========================================================================

  const colorConfig = ruleSet.measurementConfigurations.COLOR;

  // CAS A : Aucune évolution (ΔL=0, Δa=0, Δb=0 => ΔE*=0.000)
  {
    const rawT0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 2, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 3, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 4, L: 50.0, a: 10.0, b: 20.0 }
      ]
    };
    const rawC1: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 2, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 3, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 4, L: 50.0, a: 10.0, b: 20.0 }
      ]
    };
    const res = calculateColor(rawC1, colorConfig, ruleSet, { referenceRaw: rawT0 });
    const passed =
      res.computed.deltaL === 0 &&
      res.computed.deltaA === 0 &&
      res.computed.deltaB === 0 &&
      res.computed.deltaE === 0;

    record(
      'G33-COL-01',
      'Couleur Cas A : Aucune évolution (ΔL*=0, Δa*=0, Δb*=0 => ΔE*ab=0.000)',
      'COLOR_DELTA_E',
      passed,
      'ΔE*=0.000, ΔL*=0.000, Δa*=0.000, Δb*=0.000',
      `ΔE*=${res.computed.deltaE}, ΔL*=${res.computed.deltaL}, Δa*=${res.computed.deltaA}, Δb*=${res.computed.deltaB}`
    );
  }

  // CAS B : Variation sur une seule composante (ΔL*=3.0 => ΔE*ab=3.000)
  {
    const rawT0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 2, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 3, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 4, L: 50.0, a: 0.0, b: 0.0 }
      ]
    };
    const rawC1: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 53.0, a: 0.0, b: 0.0 },
        { pointIndex: 2, L: 53.0, a: 0.0, b: 0.0 },
        { pointIndex: 3, L: 53.0, a: 0.0, b: 0.0 },
        { pointIndex: 4, L: 53.0, a: 0.0, b: 0.0 }
      ]
    };
    const res = calculateColor(rawC1, colorConfig, ruleSet, { referenceRaw: rawT0 });
    const passed = res.computed.deltaL === 3.0 && res.computed.deltaE === 3.0;

    record(
      'G33-COL-02',
      'Couleur Cas B : Variation mono-axe exacte (ΔL*=3.000 => ΔE*ab=3.000)',
      'COLOR_DELTA_E',
      passed,
      'ΔL*=3.000, ΔE*=3.000',
      `ΔL*=${res.computed.deltaL}, ΔE*=${res.computed.deltaE}`
    );
  }

  // CAS C : Triplet pythagoricien (ΔL=3, Δa=4, Δb=12 => √(9+16+144)=√169=13.000)
  {
    const rawT0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 2, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 3, L: 50.0, a: 0.0, b: 0.0 },
        { pointIndex: 4, L: 50.0, a: 0.0, b: 0.0 }
      ]
    };
    const rawC1: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 53.0, a: 4.0, b: 12.0 },
        { pointIndex: 2, L: 53.0, a: 4.0, b: 12.0 },
        { pointIndex: 3, L: 53.0, a: 4.0, b: 12.0 },
        { pointIndex: 4, L: 53.0, a: 4.0, b: 12.0 }
      ]
    };
    const res = calculateColor(rawC1, colorConfig, ruleSet, { referenceRaw: rawT0 });
    const passed =
      res.computed.deltaL === 3.0 &&
      res.computed.deltaA === 4.0 &&
      res.computed.deltaB === 12.0 &&
      res.computed.deltaE === 13.0;

    record(
      'G33-COL-03',
      'Couleur Cas C : Triplet géométrique 3D indépendant (ΔL=3, Δa=4, Δb=12 => ΔE*=13.000)',
      'COLOR_DELTA_E',
      passed,
      'ΔE*=13.000',
      `ΔE*=${res.computed.deltaE}`
    );
  }

  // CAS D : Valeurs négatives et racine non entière (ΔL=-5, Δa=-4, Δb=-3 => √50 ≈ 7.071)
  {
    const rawT0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 60.0, a: -10.0, b: -15.0 },
        { pointIndex: 2, L: 60.0, a: -10.0, b: -15.0 },
        { pointIndex: 3, L: 60.0, a: -10.0, b: -15.0 },
        { pointIndex: 4, L: 60.0, a: -10.0, b: -15.0 }
      ]
    };
    const rawC1: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 55.0, a: -14.0, b: -18.0 },
        { pointIndex: 2, L: 55.0, a: -14.0, b: -18.0 },
        { pointIndex: 3, L: 55.0, a: -14.0, b: -18.0 },
        { pointIndex: 4, L: 55.0, a: -14.0, b: -18.0 }
      ]
    };
    const res = calculateColor(rawC1, colorConfig, ruleSet, { referenceRaw: rawT0 });
    const passed =
      res.computed.deltaL === -5.0 &&
      res.computed.deltaA === -4.0 &&
      res.computed.deltaB === -3.0 &&
      res.computed.deltaE === 7.071;

    record(
      'G33-COL-04',
      'Couleur Cas D : Coordonnées négatives (ΔL=-5, Δa=-4, Δb=-3 => ΔE*=7.071)',
      'COLOR_DELTA_E',
      passed,
      'ΔE*=7.071',
      `ΔE*=${res.computed.deltaE}`
    );
  }

  // CAS E : Données décimales réelles avec dispersion intra-panneau
  // T0 : L=[62.34, 62.50, 62.16, 62.60] (mean=62.40), a=[1.45, 1.55, 1.40, 1.60] (mean=1.50), b=[12.20, 12.40, 12.30, 12.30] (mean=12.30)
  // C1 : L=[58.40, 58.60, 58.30, 58.30] (mean=58.40), a=[3.50, 3.50, 3.60, 3.40] (mean=3.50), b=[16.30, 16.30, 16.20, 16.40] (mean=16.30)
  // ΔL = -4.00, Δa = 2.00, Δb = 4.00 => ΔE* = √(16 + 4 + 16) = √36 = 6.000
  {
    const rawT0: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 62.34, a: 1.45, b: 12.20 },
        { pointIndex: 2, L: 62.50, a: 1.55, b: 12.40 },
        { pointIndex: 3, L: 62.16, a: 1.40, b: 12.30 },
        { pointIndex: 4, L: 62.60, a: 1.60, b: 12.30 }
      ]
    };
    const rawC1: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 58.40, a: 3.50, b: 16.30 },
        { pointIndex: 2, L: 58.60, a: 3.50, b: 16.30 },
        { pointIndex: 3, L: 58.30, a: 3.60, b: 16.20 },
        { pointIndex: 4, L: 58.30, a: 3.40, b: 16.40 }
      ]
    };
    const res = calculateColor(rawC1, colorConfig, ruleSet, { referenceRaw: rawT0 });
    const passed =
      res.computed.meanL === 58.4 &&
      res.computed.meanA === 3.5 &&
      res.computed.meanB === 16.3 &&
      res.computed.deltaL === -4.0 &&
      res.computed.deltaA === 2.0 &&
      res.computed.deltaB === 4.0 &&
      res.computed.deltaE === 6.0;

    record(
      'G33-COL-05',
      'Couleur Cas E : Relevé 4 points avec moyennes réelles (ΔL=-4.000, Δa=2.000, Δb=4.000 => ΔE*=6.000)',
      'COLOR_DELTA_E',
      passed,
      'meanL=58.400, meanA=3.500, meanB=16.300, ΔE*=6.000',
      `meanL=${res.computed.meanL}, meanA=${res.computed.meanA}, meanB=${res.computed.meanB}, ΔE*=${res.computed.deltaE}`
    );
  }

  // Contrôle des bornes physiques CIE L*a*b* (L > 100 ou < 0 rejeté)
  {
    const rawInvalid: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 105.0, a: 10.0, b: 20.0 }, // L > 100 => INVALID
        { pointIndex: 2, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 3, L: 50.0, a: 10.0, b: 20.0 },
        { pointIndex: 4, L: 50.0, a: 10.0, b: 20.0 }
      ]
    };
    const res = calculateColor(rawInvalid, colorConfig, ruleSet);
    const passed =
      res.computed.validCount === 3 &&
      res.computed.qualityAssessment.status === 'INVALID' &&
      res.alerts.some((a) => a.code === 'MEASUREMENT_INVALID');

    record(
      'G33-COL-06',
      'Couleur : Détection stricte et exclusion des coordonnées hors domaine physique (L*=105)',
      'COLOR_DELTA_E',
      passed,
      'validCount=3, qualityStatus=INVALID, alerte BLOCKING',
      `validCount=${res.computed.validCount}, qualityStatus=${res.computed.qualityAssessment.status}`
    );
  }

  // ==========================================================================
  // 2. BRILLANCE & RÉTENTION (CAS NOMINAUX, SÉRIES 2x2, T0=0 GU)
  // ==========================================================================

  const glossSeriesConfig = ruleSet.seriesConfigurations?.GLOSS;
  if (!glossSeriesConfig) {
    throw new Error('Référentiel de brillance (GLOSS) manquant — suite G33 impossible.');
  }

  // Cas 1 : 100 -> 100 = 100%
  // Cas 2 : 100 -> 50 = 50%
  // Cas 3 : 80 -> 40 = 50%
  // Cas 4 : 60 -> 45 = 75%
  {
    const testCases = [
      { t0: 100, c1: 100, expDelta: 0.0, expRet: 100.0 },
      { t0: 100, c1: 50, expDelta: -50.0, expRet: 50.0 },
      { t0: 80, c1: 40, expDelta: -40.0, expRet: 50.0 },
      { t0: 60, c1: 45, expDelta: -15.0, expRet: 75.0 }
    ];

    let allPassed = true;
    for (const tc of testCases) {
      const rawT0: GlossRawData = {
        series: [
          { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: tc.t0 }, { pointIndex: 2, value: tc.t0 }] },
          { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: tc.t0 }, { pointIndex: 2, value: tc.t0 }] }
        ]
      };
      const rawC1: GlossRawData = {
        series: [
          { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: tc.c1 }, { pointIndex: 2, value: tc.c1 }] },
          { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: tc.c1 }, { pointIndex: 2, value: tc.c1 }] }
        ]
      };

      const res = calculateGloss(rawC1, glossSeriesConfig, ruleSet, { referenceRaw: rawT0 });
      if (res.computed.deltaGloss !== tc.expDelta || res.computed.retentionRatePercent !== tc.expRet) {
        allPassed = false;
      }
    }

    record(
      'G33-GLO-01',
      'Brillance : Formule de rétention R = (G_C / G_T0) * 100 testée sur 4 cas de référence (100->100, 100->50, 80->40, 60->45)',
      'GLOSS_METROLOGY',
      allPassed,
      'Rétentions exactes : 100%, 50%, 50%, 75%',
      allPassed ? 'Toutes les rétentions correspondent exactement' : 'Écart détecté dans une rétention'
    );
  }

  // Cas Spécifique T0 = 0 GU (Division par zéro protégée)
  {
    const rawT0Zero: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 0.0 }, { pointIndex: 2, value: 0.0 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 0.0 }, { pointIndex: 2, value: 0.0 }] }
      ]
    };
    const rawC1: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 10.0 }, { pointIndex: 2, value: 10.0 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 10.0 }, { pointIndex: 2, value: 10.0 }] }
      ]
    };

    const res = calculateGloss(rawC1, glossSeriesConfig, ruleSet, { referenceRaw: rawT0Zero });
    const passed =
      res.computed.retentionRatePercent === null &&
      res.computed.deltaGloss === 10.0 &&
      res.alerts.some((a) => a.code === 'REFERENCE_VALUE_ZERO');

    record(
      'G33-GLO-02',
      'Brillance Cas T0=0 GU : Protection division par zéro (retentionRatePercent=null, alerte REFERENCE_VALUE_ZERO)',
      'GLOSS_METROLOGY',
      passed,
      'retentionRatePercent=null, deltaGloss=+10.0, alerte REFERENCE_VALUE_ZERO émise',
      `retention=${res.computed.retentionRatePercent}, deltaGloss=${res.computed.deltaGloss}, alertes=${res.alerts.length}`
    );
  }

  // Multi-séries 2x2 avec calcul indépendant des écarts-types de série
  // S1 (Sens fil) : [62.0, 64.0] -> mean=63.0, stdDev=1.41
  // S2 (Perpendiculaire) : [58.0, 60.0] -> mean=59.0, stdDev=1.41
  // Global (4 pts) : [62, 64, 58, 60] -> mean=61.0, stdDev=2.58
  {
    const raw2x2: GlossRawData = {
      series: [
        { seriesIndex: 1, orientation: 'Sens du fil', readings: [{ pointIndex: 1, value: 62.0 }, { pointIndex: 2, value: 64.0 }] },
        { seriesIndex: 2, orientation: 'Perpendiculaire', readings: [{ pointIndex: 1, value: 58.0 }, { pointIndex: 2, value: 60.0 }] }
      ]
    };
    const res = calculateGloss(raw2x2, glossSeriesConfig, ruleSet);
    const passed =
      res.computed.meanGloss === 61.0 &&
      res.computed.stdDevGloss === 2.58 &&
      res.computed.seriesStats[0].mean === 63.0 &&
      res.computed.seriesStats[1].mean === 59.0;

    record(
      'G33-GLO-03',
      'Brillance : Décomposition multi-séries 2x2 (Moyenne globale 61.0 GU, S1=63.0 GU, S2=59.0 GU, s=2.58 GU)',
      'GLOSS_METROLOGY',
      passed,
      'meanGloss=61.00, stdDev=2.58, S1_mean=63.00, S2_mean=59.00',
      `meanGloss=${res.computed.meanGloss}, stdDev=${res.computed.stdDevGloss}, S1=${res.computed.seriesStats[0].mean}, S2=${res.computed.seriesStats[1].mean}`
    );
  }

  // ==========================================================================
  // 3. PERSOZ & DURETÉ (MOYENNE, ÉCART-TYPE, CV, VARIATION RELATIVE)
  // ==========================================================================

  const persozConfig = ruleSet.measurementConfigurations.PERSOZ;

  // Jeu nominal : [100, 110, 120] -> mean=110.0, sample stdDev=10.00, CV=9.1%
  {
    const rawPersoz: PersozRawData = {
      unit: 'SECONDS',
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 100.0 },
        { pointIndex: 2, dampingTimeSeconds: 110.0 },
        { pointIndex: 3, dampingTimeSeconds: 120.0 }
      ]
    };
    const res = calculatePersoz(rawPersoz, persozConfig, ruleSet);
    const passed =
      res.computed.meanDampingTime === 110.0 &&
      res.computed.stdDevDampingTime === 10.0 &&
      res.computed.coefficientOfVariationPercent === 9.1;

    record(
      'G33-PER-01',
      'Persoz : Répétabilité en 3 points [100, 110, 120] (Moyenne=110.0 s, s=10.00 s, CV=9.1 %)',
      'PERSOZ_HARDNESS',
      passed,
      'mean=110.0, stdDev=10.00, CV=9.1%',
      `mean=${res.computed.meanDampingTime}, stdDev=${res.computed.stdDevDampingTime}, CV=${res.computed.coefficientOfVariationPercent}%`
    );
  }

  // Comparaison différentielle T0 vs C1 : T0=110s, C1=88s => ΔPersoz = -22.0s, Variation relative = -20.0%
  {
    const rawT0: PersozRawData = {
      unit: 'SECONDS',
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 100.0 },
        { pointIndex: 2, dampingTimeSeconds: 110.0 },
        { pointIndex: 3, dampingTimeSeconds: 120.0 }
      ]
    };
    const rawC1: PersozRawData = {
      unit: 'SECONDS',
      readings: [
        { pointIndex: 1, dampingTimeSeconds: 80.0 },
        { pointIndex: 2, dampingTimeSeconds: 88.0 },
        { pointIndex: 3, dampingTimeSeconds: 96.0 }
      ]
    };
    const res = calculatePersoz(rawC1, persozConfig, ruleSet, { referenceRaw: rawT0 });
    const passed =
      res.computed.deltaDampingTime === -22.0 &&
      res.computed.relativeHardnessVariationPercent === -20.0;

    record(
      'G33-PER-02',
      'Persoz : Évolution relative de dureté T0(110s) -> C1(88s) (Δ=-22.0 s, Variation=-20.0 %)',
      'PERSOZ_HARDNESS',
      passed,
      'deltaDampingTime=-22.0, relativeHardnessVariationPercent=-20.0%',
      `delta=${res.computed.deltaDampingTime}, variation=${res.computed.relativeHardnessVariationPercent}%`
    );
  }

  // ==========================================================================
  // 4. OBSERVATIONS VISUELLES (ISO 4628 COTATIONS QUALITATIVES)
  // ==========================================================================

  {
    const rawObs: VisualObservationsRawData = {
      observations: [
        { category: 'BLISTERING', categoryLabel: 'Cloquage', rating: 0, status: 'CONFORME' },
        { category: 'FLAKING', categoryLabel: 'Écaillage', rating: 0, status: 'CONFORME' },
        { category: 'CRACKING', categoryLabel: 'Craquelage', rating: 1, status: 'OBSERVE', comment: 'Micro-fissures isolées' },
        { category: 'CHALKING', categoryLabel: 'Farinage', rating: 3, status: 'NON_CONFORME', comment: 'Farinage modéré' }
      ]
    };
    const res = calculateObservations(rawObs, ruleSet);
    const passed =
      res.computed.totalEvaluated === 4 &&
      res.computed.defectsCount === 2 &&
      res.computed.maxRating === 3 &&
      res.computed.qualityAssessment.status === 'WARNING' &&
      res.alerts.some((a) => a.code === 'STATISTICAL_WARNING' && a.message.includes('Farinage'));

    record(
      'G33-OBS-01',
      'Observations : Évaluation des cotations qualitatives ISO 4628 (2 défauts, maxRating=3, alerte farinage émise)',
      'VISUAL_OBSERVATIONS',
      passed,
      'totalEvaluated=4, defectsCount=2, maxRating=3, qualityStatus=WARNING',
      `totalEvaluated=${res.computed.totalEvaluated}, defectsCount=${res.computed.defectsCount}, maxRating=${res.computed.maxRating}`
    );
  }

  // ==========================================================================
  // 5. RIGUEUR STATISTIQUE & ARRONDIS NON-ALTÉRANTS
  // ==========================================================================

  // Vérification de la distinction formelle Sample (n-1) vs Population (n)
  {
    const sampleValues = [10.0, 20.0, 30.0];
    const sSample = calculateSampleStdDev(sampleValues); // √(200/2) = 10.00
    const sPop = calculatePopulationStdDev(sampleValues); // √(200/3) = 8.1649658...

    const passed =
      Math.abs((sSample ?? 0) - 10.0) < 1e-6 &&
      Math.abs((sPop ?? 0) - 8.164965809) < 1e-5;

    record(
      'G33-STA-01',
      'Statistiques : Exactitude des formules Sample (n-1 = 10.00) vs Population (n = 8.165)',
      'STATISTICAL_RIGOR',
      passed,
      'Sample=10.000, Population=8.165',
      `Sample=${sSample?.toFixed(3)}, Population=${sPop?.toFixed(3)}`
    );
  }

  // Protection contre NaN, Infinity et arrays vides
  {
    const meanEmpty = calculateMean([]);
    const stdEmpty = calculateSampleStdDev([]);
    const cvZeroMean = calculateCoefficientOfVariation([0, 0, 0]);
    const roundNull = roundMetric(null);

    const passed =
      meanEmpty === null &&
      stdEmpty === null &&
      cvZeroMean === null &&
      roundNull === null;

    record(
      'G33-STA-02',
      'Statistiques : Protection absolue contre NaN, division par zéro et tableaux vides (retours null stricts)',
      'STATISTICAL_RIGOR',
      passed,
      'Toutes les opérations retournent null sans exception ni NaN',
      `meanEmpty=${meanEmpty}, stdEmpty=${stdEmpty}, cvZeroMean=${cvZeroMean}, roundNull=${roundNull}`
    );
  }

  // ==========================================================================
  // 6. INTÉGRITÉ DE LA RÉFÉRENCE T0 & CROISEMENTS STRICTEMENT INTERDITS
  // ==========================================================================

  const trialId = `trial-g33-metrology-${Date.now()}`;
  const stages = generateStandardExposureStages(trialId);
  const stageT0 = stages[0];
  const stageC1 = stages[1];

  const b1Id = `${trialId}-b1`;
  const b2Id = `${trialId}-b2`;

  const panelsB1: PanelDefinition[] = [
    { id: `${b1Id}-p1`, label: '1', roleCode: 'E1', role: 'EXPOSED_1', batchId: b1Id, status: 'ACTIVE', index: 1 },
    { id: `${b1Id}-p2`, label: '2', roleCode: 'E2', role: 'EXPOSED_2', batchId: b1Id, status: 'ACTIVE', index: 2 },
    { id: `${b1Id}-p3`, label: '3', roleCode: 'E3', role: 'EXPOSED_3', batchId: b1Id, status: 'ACTIVE', index: 3 },
    { id: `${b1Id}-pT`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: b1Id, status: 'ACTIVE', index: 4 }
  ];

  const panelsB2: PanelDefinition[] = [
    { id: `${b2Id}-p1`, label: '1', roleCode: 'E1', role: 'EXPOSED_1', batchId: b2Id, status: 'ACTIVE', index: 1 },
    { id: `${b2Id}-p2`, label: '2', roleCode: 'E2', role: 'EXPOSED_2', batchId: b2Id, status: 'ACTIVE', index: 2 },
    { id: `${b2Id}-p3`, label: '3', roleCode: 'E3', role: 'EXPOSED_3', batchId: b2Id, status: 'ACTIVE', index: 3 },
    { id: `${b2Id}-pT`, label: 'T', roleCode: 'T', role: 'WITNESS', batchId: b2Id, status: 'ACTIVE', index: 4 }
  ];

  const batches: BatchDefinition[] = [
    { id: b1Id, trialId, orderIndex: 0, reference: 'LOT-A-SYST1', productReference: 'Système A', woodSpecies: 'Pin', panels: panelsB1 },
    { id: b2Id, trialId, orderIndex: 1, reference: 'LOT-B-SYST2', productReference: 'Système B', woodSpecies: 'Pin', panels: panelsB2 }
  ];

  const trial: Trial = {
    id: trialId,
    schemaVersion: '1.2.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: 'IN_PROGRESS',
    configurationStatus: 'EDITABLE',
    metadata: { reference: 'TEST-G33-SCIENTIFIC', title: 'Essai Métrologique Gate 3.3', createdBy: 'Tech R&D' },
    config: {
      standardReference: 'NF EN 927-6',
      activeFamilies: ['COLOR', 'GLOSS', 'PERSOZ', 'OBSERVATIONS'],
      familyConfigs: {
        COLOR: { familyId: 'COLOR', enabled: true },
        GLOSS: { familyId: 'GLOSS', enabled: true },
        PERSOZ: { familyId: 'PERSOZ', enabled: true },
        OBSERVATIONS: { familyId: 'OBSERVATIONS', enabled: true }
      }
    },
    scheduleConfig: {
      cycleDurationHours: 168,
      maxCycles: 12,
      initialStage: { exposureHours: 0, mandatory: true, label: 'T0' },
      intermediateCycles: Array.from({ length: 11 }, (_, i) => ({ cycleIndex: i + 1, mandatory: true })),
      finalCycle: { cycleIndex: 12, mandatory: true }
    },
    stages,
    batches,
    acquisitions: {},
    mediaReferences: [],
    auditTrail: []
  };

  globalTrialStore.saveTrial(trial);

  // Étape T0 :
  // Lot 1 : E1=50.0, E2=60.0, E3=70.0, T=80.0 (Couleur L)
  // Lot 2 : E1=10.0, E2=20.0, E3=30.0, T=40.0 (Couleur L)
  panelsB1.forEach((p, idx) => {
    const lVal = 50.0 + idx * 10.0;
    globalTrialStore.recordAcquisition({
      trialId,
      stageId: stageT0.id,
      batchId: b1Id,
      panelId: p.id,
      familyId: 'COLOR',
      raw: { readings: [{ pointIndex: 1, L: lVal, a: 0, b: 0 }] } as ColorRawData,
      operatorId: 'Tech R&D'
    });
  });

  panelsB2.forEach((p, idx) => {
    const lVal = 10.0 + idx * 10.0;
    globalTrialStore.recordAcquisition({
      trialId,
      stageId: stageT0.id,
      batchId: b2Id,
      panelId: p.id,
      familyId: 'COLOR',
      raw: { readings: [{ pointIndex: 1, L: lVal, a: 0, b: 0 }] } as ColorRawData,
      operatorId: 'Tech R&D'
    });
  });

  // Étape C1 : Saisie de nouvelles valeurs
  // Lot 1 E1 : L = 55.0 (ΔL attendu = 55.0 - 50.0 = +5.00) -> si comparé à E2(60) donnerait -5.0, si comparé à Lot 2 donnerait +45.0
  // Lot 2 E1 : L = 14.0 (ΔL attendu = 14.0 - 10.0 = +4.00) -> si comparé à Lot 1 donnerait -36.0
  globalTrialStore.recordAcquisition({
    trialId,
    stageId: stageC1.id,
    batchId: b1Id,
    panelId: panelsB1[0].id,
    familyId: 'COLOR',
    raw: { readings: [{ pointIndex: 1, L: 55.0, a: 0, b: 0 }] } as ColorRawData,
    operatorId: 'Tech R&D'
  });

  globalTrialStore.recordAcquisition({
    trialId,
    stageId: stageC1.id,
    batchId: b2Id,
    panelId: panelsB2[0].id,
    familyId: 'COLOR',
    raw: { readings: [{ pointIndex: 1, L: 14.0, a: 0, b: 0 }] } as ColorRawData,
    operatorId: 'Tech R&D'
  });

  {
    const updated = globalTrialStore.getTrial(trialId)!;
    const acqB1_E1 = updated.acquisitions[`${stageC1.id}__${panelsB1[0].id}__COLOR`];
    const acqB2_E1 = updated.acquisitions[`${stageC1.id}__${panelsB2[0].id}__COLOR`];

    const compB1 = acqB1_E1.computed as { deltaL: number; initialMeanL: number };
    const compB2 = acqB2_E1.computed as { deltaL: number; initialMeanL: number };

    const b1Matches = compB1.initialMeanL === 50.0 && compB1.deltaL === 5.0;
    const b2Matches = compB2.initialMeanL === 10.0 && compB2.deltaL === 4.0;

    record(
      'G33-T0-01',
      'Référence T0 : Comparaison stricte au T0 du même échantillon et du même lot (E1-Lot1 réf=50.0 => ΔL=+5.00 ; E1-Lot2 réf=10.0 => ΔL=+4.00)',
      'T0_REFERENCE_INTEGRITY',
      Boolean(b1Matches && b2Matches),
      'Lot1-E1 initial=50.0/ΔL=+5.00 | Lot2-E1 initial=10.0/ΔL=+4.00',
      `Lot1-E1 initial=${compB1.initialMeanL}/ΔL=${compB1.deltaL} | Lot2-E1 initial=${compB2.initialMeanL}/ΔL=${compB2.deltaL}`
    );
  }

  // ==========================================================================
  // 7. SÉGRÉGATION MÉTROLOGIQUE STRICTE DU TÉMOIN T
  // ==========================================================================

  // Ajout de mesures C1 pour E2, E3 et T sur le Lot 1
  // E1: L=55 (ΔE=5), E2: L=65 (ΔE=5), E3: L=75 (ΔE=5) -> Moyenne exposés = 5.00
  // Témoin T: L=100 (ΔE=20) -> Si inclus dans la moyenne exposés, donnerait (5+5+5+20)/4 = 8.75 !
  globalTrialStore.recordAcquisition({
    trialId,
    stageId: stageC1.id,
    batchId: b1Id,
    panelId: panelsB1[1].id,
    familyId: 'COLOR',
    raw: { readings: [{ pointIndex: 1, L: 65.0, a: 0, b: 0 }] } as ColorRawData,
    operatorId: 'Tech R&D'
  });
  globalTrialStore.recordAcquisition({
    trialId,
    stageId: stageC1.id,
    batchId: b1Id,
    panelId: panelsB1[2].id,
    familyId: 'COLOR',
    raw: { readings: [{ pointIndex: 1, L: 75.0, a: 0, b: 0 }] } as ColorRawData,
    operatorId: 'Tech R&D'
  });
  globalTrialStore.recordAcquisition({
    trialId,
    stageId: stageC1.id,
    batchId: b1Id,
    panelId: panelsB1[3].id, // Témoin T
    familyId: 'COLOR',
    raw: { readings: [{ pointIndex: 1, L: 100.0, a: 0, b: 0 }] } as ColorRawData,
    operatorId: 'Tech R&D'
  });

  {
    const updated = globalTrialStore.getTrial(trialId)!;
    const kinetics = extractTemporalKinetics(updated, b1Id);
    const kC1 = kinetics.find((k) => k.exposureHours === 168);
    const comparison = compareSystemsAtStage(updated, stageC1.id, ruleSet, [b1Id]);
    const compItem = comparison.items[0];

    const kineticsExcludesWitness = kC1?.meanDeltaE === 5.0;
    const compExcludesWitness = compItem.color?.meanDeltaE === 5.0;

    record(
      'G33-WIT-01',
      'Témoin T : Exclusion métrologique absolue des cinétiques temporelles et du comparateur (Moyenne exposés = 5.00, témoin T = 20.0 exclu)',
      'WITNESS_SEGREGATION',
      Boolean(kineticsExcludesWitness && compExcludesWitness),
      'meanDeltaE = 5.00 (et non 8.75)',
      `Kinetics meanDeltaE=${kC1?.meanDeltaE}, Comparator meanDeltaE=${compItem.color?.meanDeltaE}`
    );
  }

  // ==========================================================================
  // 8. AGRÉGATIONS & ÉCART-TYPE INTER-PANNEAUX (s_inter = Sample n-1)
  // ==========================================================================

  // 3 éprouvettes exposées avec ΔE* = [4.0, 5.0, 6.0]
  // Moyenne = 5.00
  // s_inter (sample n-1) = √((1 + 0 + 1) / 2) = √1 = 1.000
  {
    const panelComputedList = [
      { validCount: 4, deltaE: 4.0 } as any,
      { validCount: 4, deltaE: 5.0 } as any,
      { validCount: 4, deltaE: 6.0 } as any
    ];
    const agg = aggregateBatchColor(b1Id, stageC1.id, panelComputedList);

    const passed =
      agg.interPanelMean === 5.0 &&
      agg.interPanelStdDev === 1.0 &&
      agg.meanDeltaE === 5.0;

    record(
      'G33-AGG-01',
      'Agrégations : Calcul exact de la moyenne et de la dispersion inter-panneaux s_inter [4.0, 5.0, 6.0] (Moyenne=5.00, s_inter=1.000)',
      'BATCH_AGGREGATIONS',
      passed,
      'interPanelMean=5.000, interPanelStdDev=1.000',
      `mean=${agg.interPanelMean}, s_inter=${agg.interPanelStdDev}`
    );
  }

  // ==========================================================================
  // 9. VALEURS MANQUANTES ET REJETS D'ANOMALIES
  // ==========================================================================

  // Mesure partielle : 2 points sur 4 fournis. Les 2 manquants ne doivent PAS devenir des zéros.
  {
    const rawPartial: ColorRawData = {
      readings: [
        { pointIndex: 1, L: 60.0, a: 2.0, b: 15.0 },
        { pointIndex: 2, L: 60.0, a: 2.0, b: 15.0 }
        // points 3 et 4 manquants
      ]
    };
    const res = calculateColor(rawPartial, colorConfig, ruleSet);
    const passed =
      res.computed.validCount === 2 &&
      res.computed.meanL === 60.0 &&
      res.computed.qualityAssessment.missingCount === 2 &&
      res.computed.qualityAssessment.status === 'WARNING';

    record(
      'G33-MIS-01',
      'Valeurs Manquantes : Données partielles (2 pts sur 4) n\'injectent aucun zéro fantôme (meanL=60.000, missingCount=2)',
      'MISSING_AND_OUTLIERS',
      passed,
      'validCount=2, meanL=60.000, missingCount=2',
      `validCount=${res.computed.validCount}, meanL=${res.computed.meanL}, missingCount=${res.computed.qualityAssessment.missingCount}`
    );
  }

  // ==========================================================================
  // 10. GESTION DES JALONS DÉSACTIVÉS ET INTÉGRITÉ TEMPORELLE
  // ==========================================================================

  {
    const stagesAll = generateStandardExposureStages(trialId);
    const c1Stage = stagesAll[1]; // 168h
    const c2Stage = stagesAll[2]; // 336h
    const c12Stage = stagesAll[12]; // 2016h

    // Vérification des durées exactes (168h par cycle, 2016h final selon NF EN 927-6)
    const hoursMatch =
      c1Stage.scheduledExposureHours === 168 &&
      c2Stage.scheduledExposureHours === 336 &&
      c12Stage.scheduledExposureHours === 2016;

    record(
      'G33-NOR-01',
      'Unités et Durées Normatives : Respect strict du calendrier NF EN 927-6 (C1=168 h, C2=336 h, C12=2016 h)',
      'NORMATIVE_AND_UNITS',
      hoursMatch,
      'C1=168h, C2=336h, C12=2016h',
      `C1=${c1Stage.scheduledExposureHours}h, C2=${c2Stage.scheduledExposureHours}h, C12=${c12Stage.scheduledExposureHours}h`
    );
  }

  // ==========================================================================
  // 11. TRAÇABILITÉ DES VERSIONS DE CALCUL & COMPUTATION METADATA
  // ==========================================================================

  {
    const rawCol: ColorRawData = {
      readings: [{ pointIndex: 1, L: 50, a: 0, b: 0 }]
    };
    const resCol = calculateColor(rawCol, colorConfig, ruleSet);
    const rawGlo: GlossRawData = {
      series: [{ seriesIndex: 1, orientation: 'GRAIN_DIRECTION', readings: [{ pointIndex: 1, value: 50 }] }]
    };
    const resGlo = calculateGloss(rawGlo, glossSeriesConfig, ruleSet);

    const passed =
      Boolean(resCol.computed.computation?.calculationVersion) &&
      Boolean(resCol.computed.computation?.calculatedAt) &&
      Boolean(resGlo.computed.computation?.calculationVersion) &&
      Boolean(resGlo.computed.computation?.calculatedAt);

    record(
      'G33-TRA-01',
      'Traçabilité Métrologique : Présence systématique des métadonnées de calcul (version et timestamp ISO) dans COMPUTED',
      'STATISTICAL_RIGOR',
      passed,
      'computation.calculationVersion et computation.calculatedAt définis sur tous les moteurs',
      `ColorVersion=${resCol.computed.computation?.calculationVersion}, GlossVersion=${resGlo.computed.computation?.calculationVersion}`
    );
  }

  // ==========================================================================
  // 12. VALIDATION DU MODULE ADHÉRENCE — ESSAI AU QUADRILLAGE (NF EN ISO 2409:2020)
  // ==========================================================================

  {
    // A. Détermination normative de l'espacement du peigne selon l'épaisseur sèche
    const sp45Wood = getApplicableGridSpacing(45, true);
    const sp45Rigid = getApplicableGridSpacing(45, false);
    const sp90 = getApplicableGridSpacing(90);
    const sp180 = getApplicableGridSpacing(180);
    const sp300 = getApplicableGridSpacing(300);

    const spacingPassed =
      sp45Wood.gridSpacingMm === 2 &&
      sp45Rigid.gridSpacingMm === 1 &&
      sp90.gridSpacingMm === 2 &&
      sp180.gridSpacingMm === 3 &&
      sp300.gridSpacingMm === 3 &&
      sp300.thicknessCategory.includes('> 250 µm');

    record(
      'G33-ADH-01',
      'Adhérence ISO 2409 : Détermination de l\'espacement du peigne (2mm pour bois ≤60µm, 2mm pour 61-120µm, 3mm pour 121-250µm, ≥3mm pour >250µm)',
      'NORMATIVE_AND_UNITS',
      spacingPassed,
      '2mm bois ≤60µm, 1mm rigide ≤60µm, 2mm 61-120µm, 3mm 121-250µm',
      `45µmBois=${sp45Wood.gridSpacingMm}mm, 45µmRigide=${sp45Rigid.gridSpacingMm}mm, 90µm=${sp90.gridSpacingMm}mm, 180µm=${sp180.gridSpacingMm}mm, 300µm=${sp300.gridSpacingMm}mm`
    );

    // B. Contrôle du délai de séchage / conditionnement
    const delayConform = calculateDelayCompliance('2026-08-01T00:00:00Z', '2026-08-10T00:00:00Z', 168);
    const delayNonConform = calculateDelayCompliance('2026-08-01T00:00:00Z', '2026-08-03T00:00:00Z', 168);

    const delayPassed =
      delayConform.status === 'CONFORME' &&
      delayConform.elapsedTimeHours === 216 &&
      delayNonConform.status === 'INSUFFICIENT_DELAY' &&
      delayNonConform.elapsedTimeHours === 48;

    record(
      'G33-ADH-02',
      'Adhérence ISO 2409 : Contrôle et traçabilité du délai de conditionnement avant essai (seuil ≥ 168 h)',
      'STATISTICAL_RIGOR',
      delayPassed,
      'CONFORME à 216h, INSUFFICIENT_DELAY à 48h (< 168h)',
      `Conform=${delayConform.status} (${delayConform.elapsedTimeHours}h), NonConform=${delayNonConform.status} (${delayNonConform.elapsedTimeHours}h)`
    );

    // C. Calcul du résultat d'adhérence, cotation qualitative et delta vs témoin T0 sans conversion MPa
    const rawT0: AdhesionRawData = {
      adhesionClass: 0,
      gridSpacingMm: 2,
      coatingThicknessMicrons: 65,
      measurementDateTime: '2026-08-01T00:00:00Z',
      requiredMinimumDelayHours: 168,
      normReference: 'NF EN ISO 2409:2020',
      observation: 'Incisions nettes, 0% décollement'
    };

    const rawC12: AdhesionRawData = {
      adhesionClass: 1,
      gridSpacingMm: 2,
      coatingThicknessMicrons: 65,
      measurementDateTime: '2026-10-24T00:00:00Z',
      applicationDateTime: '2026-08-01T00:00:00Z',
      requiredMinimumDelayHours: 168,
      normReference: 'NF EN ISO 2409:2020',
      observation: 'Léger détachement aux intersections'
    };

    const adhCountConfig = ruleSet.measurementConfigurations['ADHESION'];
    const adhResult = calculateAdhesion(rawC12, adhCountConfig, ruleSet, {
      referenceRaw: rawT0
    });

    const adhPassed =
      adhResult.computed.adhesionClass === 1 &&
      adhResult.computed.initialAdhesionClass === 0 &&
      adhResult.computed.deltaAdhesionClass === 1 &&
      adhResult.computed.gridSpacingUsedMm === 2 &&
      typeof (adhResult.computed as any).adhesionForceMpa === 'undefined' &&
      adhResult.computed.qualityAssessment.status === 'GOOD';

    record(
      'G33-ADH-03',
      'Adhérence ISO 2409 : Préservation stricte de l\'échelle qualitative (Classe 0 à 5), non-conversion en MPa et calcul du delta vs T0',
      'STATISTICAL_RIGOR',
      adhPassed,
      'Classe 1, delta vs T0 = +1, aucune unité MPa, statut GOOD',
      `Classe=${adhResult.computed.adhesionClass}, Delta=${adhResult.computed.deltaAdhesionClass}, Spacing=${adhResult.computed.gridSpacingUsedMm}mm, ForceMpa=${(adhResult.computed as any).adhesionForceMpa}`
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    results,
    summary: {
      total: results.length,
      passed,
      failed
    }
  };
}
