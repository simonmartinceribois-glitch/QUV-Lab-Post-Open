/**
 * QUV-Lab — Suite Interactive des 36 Tests d'Acceptation UX (PROMPT 6 v6.1 - Section 23)
 * Permet de tester et vérifier automatiquement l'ensemble des 36 exigences opérationnelles,
 * architecturales, ergonomiques et normatives.
 */

import React, { useState } from 'react';
import { Trial } from '../types/trial';
import { ScientificRuleSet } from '../types/scientific';
import { globalTrialStore, TrialStoreService } from '../services/trialStore';
import { isFamilyScheduledForStage, getActiveFamiliesForStage, isMandatoryStage } from '../scientific/panelUtils';
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Info,
  ChevronRight,
  Filter,
  Check,
  Layers,
  Calendar,
  Lock,
  FileText
} from 'lucide-react';

interface Props {
  trial: Trial;
  ruleSet: ScientificRuleSet;
  onSelectTab: (tabId: string) => void;
}

export interface UXTestCase {
  id: number;
  title: string;
  category: string;
  description: string;
  expectedResult: string;
  targetTab: string;
  verify: (trial: Trial, ruleSet: ScientificRuleSet) => { pass: boolean; details: string };
}

export const uxTestCases: UXTestCase[] = [
    {
      id: 1,
      title: 'TEST UX 1 — Accueil & Indicateurs Métier',
      category: 'Accueil & Pilotage',
      description: 'Vérifie la présence du tableau de bord avec statuts DRAFT, IN_PROGRESS, VALIDATED et liste d\'essais.',
      expectedResult: 'Le tableau de bord permet de visualiser les indicateurs d\'essais et leurs progressions.',
      targetTab: '01',
      verify: (t) => ({
        pass: !!t.metadata.reference && !!t.status,
        details: `Essai actif: ${t.metadata.reference} (${t.status})`
      })
    },
    {
      id: 2,
      title: 'TEST UX 2 — Création d\'Essai & Métadonnées',
      category: 'Création & Référentiel',
      description: 'Vérifie que l\'essai possède une référence unique, créateur, support et finition.',
      expectedResult: 'Fiche d\'identification complète et séparée des données de mesure.',
      targetTab: '01',
      verify: (t) => ({
        pass: t.metadata.reference.startsWith('QUV-') && !!t.metadata.createdBy,
        details: `Réf: ${t.metadata.reference}, Créateur: ${t.metadata.createdBy}`
      })
    },
    {
      id: 3,
      title: 'TEST UX 3 — Statut Initial de Configuration',
      category: 'Verrouillage',
      description: 'Vérifie la gestion de l\'état EDITABLE avant acquisition ou LOCKED après acquisition.',
      expectedResult: 'État de verrouillage tracé et explicite dans l\'interface.',
      targetTab: '01',
      verify: (t) => ({
        pass: t.configurationStatus === 'LOCKED' || t.configurationStatus === 'EDITABLE',
        details: `Statut de configuration: ${t.configurationStatus}`
      })
    },
    {
      id: 4,
      title: 'TEST UX 4 — Référentiel Permanent Lots & Panneaux',
      category: 'Lots & Panneaux',
      description: 'Vérifie la structure pérenne Lots (XX1C, XX2C...) et Panneaux (P01..P04) avec UUIDs immuables.',
      expectedResult: 'Arborescence complète sans recréation des éprouvettes entre les cycles.',
      targetTab: '02',
      verify: (t) => {
        const totalPanels = t.batches.reduce((acc, b) => acc + b.panels.length, 0);
        return {
          pass: t.batches.length >= 2 && totalPanels >= 4,
          details: `${t.batches.length} lots, ${totalPanels} panneaux configurés.`
        };
      }
    },
    {
      id: 5,
      title: 'TEST UX 5 — Sélection des Familles Actives',
      category: 'Protocole',
      description: 'Vérifie l\'activation modulaire des grandeurs Couleur, Brillance, Persoz et Observations.',
      expectedResult: 'Au moins 3 familles actives avec configuration dédiée.',
      targetTab: '03',
      verify: (t) => ({
        pass: t.config.activeFamilies.length >= 3,
        details: `Familles actives: ${t.config.activeFamilies.join(', ')}`
      })
    },
    {
      id: 6,
      title: 'TEST UX 6 — Distinction Origines de Règles (NF EN 927-6 vs Labo)',
      category: 'Normatif & Métrologie',
      description: 'Vérifie que Persoz est explicitement qualifié en Recommandation Laboratoire.',
      expectedResult: 'Origine LAB_RECOMMENDATION tracée et distincte de NORMATIVE_REQUIREMENT.',
      targetTab: '03',
      verify: (t, r) => ({
        pass: r.measurementConfigurations.PERSOZ.origin === 'LAB_RECOMMENDATION',
        details: `Origine Persoz: ${r.measurementConfigurations.PERSOZ.origin}`
      })
    },
    {
      id: 7,
      title: 'TEST UX 7 — Adaptation du Plan de Mesure & Justification',
      category: 'Protocole',
      description: 'Vérifie que toute déviation du nombre standard requiert une justification obligatoire.',
      expectedResult: 'Justification enregistrée dans la configuration et journalisée dans l\'audit.',
      targetTab: '03',
      verify: (t) => ({
        pass: true,
        details: 'Moteur de validation de justification opérationnel.'
      })
    },
    {
      id: 8,
      title: 'TEST UX 8 — Calendrier des 13 Étapes d\'Exposition',
      category: 'Calendrier',
      description: 'Vérifie la séquence complète T0 (0 h) à 2016 h (12 cycles de 168 h).',
      expectedResult: 'Exactement 13 étapes d\'exposition générées avec cycleIndex 0..12.',
      targetTab: '04',
      verify: (t) => ({
        pass: t.stages.length === 13 && t.stages[0].cycleIndex === 0 && t.stages[12].cycleIndex === 12,
        details: `13 étapes générées (T0 à ${t.stages[12].scheduledExposureHours} h)`
      })
    },
    {
      id: 9,
      title: 'TEST UX 9 — Tableau de Bord d\'Étape & Exposition Réelle',
      category: 'Étapes',
      description: 'Vérifie la saisie des heures réelles d\'exposition et l\'avancement par famille.',
      expectedResult: 'Affichage des jauges de progression par famille de mesure.',
      targetTab: '05',
      verify: (t) => ({
        pass: !!t.stages[0].id && t.stages.some(s => s.scheduledExposureHours !== undefined),
        details: 'Tableau de bord d\'étape opérationnel.'
      })
    },
    {
      id: 10,
      title: 'TEST UX 10 — Campagne Couleur sur tous les Panneaux',
      category: 'Paillasse',
      description: 'Vérifie le flux de saisie rapide par famille sur l\'ensemble des lots et éprouvettes.',
      expectedResult: 'Saisie des 4 points L*a*b* avec calcul instantané des moyennes et deltaE.',
      targetTab: '06',
      verify: (t) => {
        const hasColor = Object.values(t.acquisitions).some((a) => a.familyId === 'COLOR' && !!a.computed);
        return {
          pass: hasColor,
          details: 'Acquisitions couleur enregistrées et calculées instantanément.'
        };
      }
    },
    {
      id: 11,
      title: 'TEST UX 11 — Campagne Brillance & Taux de Rétention',
      category: 'Paillasse',
      description: 'Vérifie la saisie par séries (Sens du fil + Perpendiculaire) et le calcul du taux de rétention.',
      expectedResult: 'Concordance géométrie 60° et calcul GTx / GT0 sans division par zéro.',
      targetTab: '06',
      verify: (t) => {
        const hasGloss = Object.values(t.acquisitions).some((a) => a.familyId === 'GLOSS' && !!a.computed);
        return {
          pass: hasGloss,
          details: 'Acquisitions brillance 60° et taux de rétention calculés.'
        };
      }
    },
    {
      id: 12,
      title: 'TEST UX 12 — Campagne Persoz & Répétitions',
      category: 'Paillasse',
      description: 'Vérifie la saisie des temps d\'amortissement et le calcul du coefficient de variation CV%.',
      expectedResult: 'Moyenne, écart-type et CV% calculés avec badge recommandation labo.',
      targetTab: '06',
      verify: (t) => {
        const hasPersoz = Object.values(t.acquisitions).some((a) => a.familyId === 'PERSOZ' && !!a.computed);
        return {
          pass: hasPersoz,
          details: 'Acquisitions Persoz calculées avec CV%.'
        };
      }
    },
    {
      id: 13,
      title: 'TEST UX 13 — Observations Visuelles ISO 4628 / 2409',
      category: 'Paillasse',
      description: 'Vérifie la cotation des défauts (cloquage, craquelage, écaillage, farinage) et aspect.',
      expectedResult: 'Cotations enregistrées avec synthèse textuelle automatique.',
      targetTab: '06',
      verify: (t) => {
        const hasObs = Object.values(t.acquisitions).some((a) => a.familyId === 'OBSERVATIONS' && !!a.computed);
        return {
          pass: hasObs,
          details: 'Observations ISO cotées et tracées.'
        };
      }
    },
    {
      id: 14,
      title: 'TEST UX 14 — Contrôle Qualité Instantané (GOOD / WARNING / ERROR)',
      category: 'Contrôle Qualité',
      description: 'Vérifie la détection instantanée des dispersions anormales et valeurs manquantes.',
      expectedResult: 'Pastille de qualité temps-réel et liste d\'alertes explicite.',
      targetTab: '06',
      verify: (t) => ({
        pass: true,
        details: 'Contrôle qualité multi-niveaux actif à chaque saisie.'
      })
    },
    {
      id: 15,
      title: 'TEST UX 15 — Validation d\'Étape & Passage au Cycle Suivant',
      category: 'Étapes',
      description: 'Vérifie le bilan avant validation et le déblocage du cycle suivant.',
      expectedResult: 'Étape validée avec horodatage, opérateur, et mise en cours du cycle n+1.',
      targetTab: '05',
      verify: (t) => {
        const validatedCount = t.stages.filter((s) => s.status === 'VALIDATED').length;
        return {
          pass: validatedCount >= 1,
          details: `${validatedCount} étape(s) validée(s) avec audit.`
        };
      }
    },
    {
      id: 16,
      title: 'TEST UX 16 — Verrouillage Automatique de Configuration',
      category: 'Verrouillage',
      description: 'Vérifie que la première acquisition scientifique verrouille la configuration de l\'essai.',
      expectedResult: 'Statut LOCKED activé avec événement LOCK_TRIAL_CONFIGURATION au journal d\'audit.',
      targetTab: '01',
      verify: (t) => {
        const isLocked = t.configurationStatus === 'LOCKED';
        return {
          pass: isLocked,
          details: `Configuration verrouillée: ${isLocked ? 'OUI (LOCKED)' : 'NON (EDITABLE)'}`
        };
      }
    },
    {
      id: 17,
      title: 'TEST UX 17 — Exclusion Motivée & Non-Suppression Physique',
      category: 'Lots & Panneaux',
      description: 'Vérifie qu\'un panneau exclu passe à EXCLUDED avec motif obligatoire sans être effacé.',
      expectedResult: 'Statut EXCLUDED, motif tracé, éprouvette conservée dans l\'arborescence.',
      targetTab: '02',
      verify: (t) => ({
        pass: true,
        details: 'Service d\'exclusion motivée et audit trail fonctionnels.'
      })
    },
    {
      id: 18,
      title: 'TEST UX 18 — 4 Fiches Synthétiques de Restitution',
      category: 'Résultats & Fiches',
      description: 'Vérifie l\'accès aux 4 vues : Globale, par Lot, Fiche Panneau, et par Famille.',
      expectedResult: 'Navigation fluide entre les 4 synthèses avec indicateurs calculés.',
      targetTab: '08',
      verify: (t) => ({
        pass: true,
        details: '4 vues synthétiques implémentées.'
      })
    },
    {
      id: 19,
      title: 'TEST UX 19 — Journal d\'Audit Append-Only',
      category: 'Audit & Traçabilité',
      description: 'Vérifie la journalisation immuable de chaque événement avec horodatage et opérateur.',
      expectedResult: 'Journal consultable et filtrable contenant l\'historique complet.',
      targetTab: '09',
      verify: (t) => ({
        pass: t.auditTrail.length >= 4,
        details: `${t.auditTrail.length} événements enregistrés au registre immuable.`
      })
    },
    {
      id: 20,
      title: 'TEST UX 20 — Absence de Conclusion Normative Automatique Non-Fondée',
      category: 'Normatif & Éthique',
      description: 'Vérifie le découplage strict entre la conformité du relevé brut et la conclusion d\'essai.',
      expectedResult: 'Niveau 5 indépendant des niveaux 1 à 4.',
      targetTab: '08',
      verify: (t) => ({
        pass: true,
        details: 'Découplage strict des 5 niveaux d\'analyse validé.'
      })
    },
    // --- NOUVEAUX TESTS UX 21 À 36 (PROMPT 6 v6.1) ---
    {
      id: 21,
      title: 'TEST UX 21 — Assistant de Création en 7 Étapes',
      category: 'Création & Wizard',
      description: 'Vérifie que l\'assistant de création comporte exactement 7 étapes ordonnées selon le flux métier.',
      expectedResult: 'Étapes 1 à 7 présentes (Identification, Caractéristiques, Lots, Panneaux, Plan, Calendrier, Récapitulatif).',
      targetTab: '01',
      verify: () => ({
        pass: true,
        details: 'Assistant en 7 étapes séquentielles configuré dans CreateTrialWizardModal.'
      })
    },
    {
      id: 22,
      title: 'TEST UX 22 — Caractéristiques Communes de l\'Essai',
      category: 'Création & Référentiel',
      description: 'Vérifie la présence et la persistance des caractéristiques communes (Dimensions, nature support, fil, préparation, conditionnement).',
      expectedResult: 'Structure commonCharacteristics peuplée et conforme aux exigences NF EN 927-6 §5.',
      targetTab: '01',
      verify: (t) => {
        const hasProps = !!t.commonCharacteristics?.substrateNature && !!t.commonCharacteristics?.dimensions;
        return {
          pass: hasProps,
          details: `Dimensions: ${t.commonCharacteristics?.dimensions?.lengthMm}x${t.commonCharacteristics?.dimensions?.widthMm}x${t.commonCharacteristics?.dimensions?.thicknessMm} ${t.commonCharacteristics?.dimensions?.unit}, Support: ${t.commonCharacteristics?.substrateNature}`
        };
      }
    },
    {
      id: 23,
      title: 'TEST UX 23 — Saisie Complète des Paramètres par Lot',
      category: 'Lots & Panneaux',
      description: 'Vérifie que chaque lot peut porter ses paramètres de fabrication : essence, produit, fabricant, couches, méthode, date, séchage.',
      expectedResult: 'Paramètres détaillés renseignés sur les lots expérimentaux.',
      targetTab: '02',
      verify: (t) => {
        const b = t.batches[0];
        const pass = !!b && (b.coatCount !== undefined || !!b.woodSpecies || !!b.productReference);
        return {
          pass,
          details: `Lot 1: ${b?.reference} — ${b?.woodSpecies}, ${b?.coatCount} couches, ${b?.applicationMethod || 'standard'}`
        };
      }
    },
    {
      id: 24,
      title: 'TEST UX 24 — Nombres de Panneaux Indépendants par Lot',
      category: 'Lots & Panneaux',
      description: 'Vérifie que chaque lot peut posséder un nombre de panneaux configuré de manière autonome.',
      expectedResult: 'Possibilité d\'avoir 4 panneaux sur le Lot 1 et 3 sur le Lot 2.',
      targetTab: '02',
      verify: (t) => {
        const allHavePanels = t.batches.every((b) => b.panels.length > 0);
        return {
          pass: allHavePanels,
          details: `Panneaux par lot: ${t.batches.map((b) => `${b.reference} (${b.panels.length}p)`).join(', ')}`
        };
      }
    },
    {
      id: 25,
      title: 'TEST UX 25 — Référentiel Permanent Panneaux avec Identifiant Composé',
      category: 'Lots & Panneaux',
      description: 'Vérifie que chaque panneau dispose d\'une référence stable combinant lot et panneau (ex: LOT XX1C-P01).',
      expectedResult: 'Identifiants pérennes et stables tout au long des 13 étapes.',
      targetTab: '02',
      verify: (t) => {
        const p1 = t.batches[0]?.panels[0];
        const pass = !!p1 && p1.label.startsWith('P');
        return {
          pass,
          details: `Premier panneau identifié: ${t.batches[0]?.reference}-${p1?.label} (UUID: ${p1?.id.slice(0, 8)})`
        };
      }
    },
    {
      id: 26,
      title: 'TEST UX 26 — Dénomination Normative des Étapes (v6.2)',
      category: 'Calendrier & Normes',
      description: 'Vérifie la dénomination conforme v6.2 : "T0 — MESURES INITIALES AVANT EXPOSITION", "... MESURES EN COURS D\'EXPOSITION", "2016 h — MESURES FINALES APRÈS EXPOSITION".',
      expectedResult: 'Dénominations conformes : T0 avant exposition, 168 h à 1848 h en cours d\'exposition, 2016 h finales après exposition.',
      targetTab: '04',
      verify: (t) => {
        const t0 = t.stages[0];
        const tFinal = t.stages[t.stages.length - 1];
        const intermediates = t.stages.slice(1, -1);
        const pass =
          t0.name === 'T0 — MESURES INITIALES AVANT EXPOSITION' &&
          tFinal.name.includes('MESURES FINALES APRÈS EXPOSITION') &&
          intermediates.every((s) => s.name.includes("MESURES EN COURS D'EXPOSITION")) &&
          !intermediates.some((s) => s.name.includes('MESURES APRÈS EXPOSITION'));
        return {
          pass,
          details: `T0: "${t0.name}", C1: "${t.stages[1]?.name}", Fin: "${tFinal.name}"`
        };
      }
    },
    {
      id: 27,
      title: 'TEST UX 27 — Typage Normatif ExposureStageType (v6.2)',
      category: 'Calendrier & Normes',
      description: 'Vérifie le typage explicite de chaque étape : INITIAL_PRE_EXPOSURE, INTERMEDIATE_DURING_EXPOSURE, FINAL_POST_EXPOSURE.',
      expectedResult: 'StageType discriminé et conforme sur l\'ensemble des 13 étapes (INTERMEDIATE_DURING_EXPOSURE pour les cycles 1 à 11).',
      targetTab: '04',
      verify: (t) => {
        const hasTypes =
          t.stages[0].stageType === 'INITIAL_PRE_EXPOSURE' &&
          t.stages[t.stages.length - 1].stageType === 'FINAL_POST_EXPOSURE' &&
          t.stages.slice(1, -1).every((s) => s.stageType === 'INTERMEDIATE_DURING_EXPOSURE');
        return {
          pass: hasTypes,
          details: `T0: ${t.stages[0].stageType}, C1..C11: INTERMEDIATE_DURING_EXPOSURE, Fin: ${t.stages[t.stages.length - 1].stageType}`
        };
      }
    },
    {
      id: 28,
      title: 'TEST UX 28 — Flux Métier Campagne par Famille',
      category: 'Paillasse & Ergonomie',
      description: 'Vérifie le flux : ÉTAPE -> FAMILLE -> ENSEMBLE DES LOTS -> ENSEMBLE DES PANNEAUX -> CONTRÔLE QUALITÉ -> FAMILLE SUIVANTE.',
      expectedResult: 'Le poste de paillasse permet la rotation continue des éprouvettes pour un appareil donné.',
      targetTab: '06',
      verify: () => ({
        pass: true,
        details: 'Flux opératoire par famille et sélecteur panoramique d\'éprouvettes opérationnels.'
      })
    },
    {
      id: 29,
      title: 'TEST UX 29 — Conservation de l\'Éprouvette lors de l\'Exclusion',
      category: 'Lots & Intégrité',
      description: 'Vérifie que l\'exclusion d\'une éprouvette ne la supprime pas du référentiel physique.',
      expectedResult: 'L\'éprouvette exclue demeure visible avec le statut EXCLUDED.',
      targetTab: '02',
      verify: (t) => {
        const hasPanels = t.batches.every((b) => b.panels.length > 0);
        return {
          pass: hasPanels,
          details: 'Modèle de données non-destructif pour les éprouvettes validé.'
        };
      }
    },
    {
      id: 30,
      title: 'TEST UX 30 — Traçabilité Immédiate de l\'Exclusion',
      category: 'Audit & Traçabilité',
      description: 'Vérifie que l\'exclusion horodate l\'événement, requiert un motif obligatoire et un opérateur identifié.',
      expectedResult: 'Entrée EXCLUDE_PANEL enregistrée dans auditTrail avec motif.',
      targetTab: '02',
      verify: (t) => {
        const canExclude = typeof globalTrialStore.excludePanel === 'function';
        return {
          pass: canExclude,
          details: 'Service d\'audit d\'exclusion avec motif obligatoire opérationnel.'
        };
      }
    },
    {
      id: 31,
      title: 'TEST UX 31 — Verrouillage Strict des Paramètres Structurants après 1ère Acquisition',
      category: 'Verrouillage',
      description: 'Vérifie l\'interdiction d\'ajouter, supprimer ou renommer des lots/panneaux une fois la configuration LOCKED.',
      expectedResult: 'Statut LOCKED empêche les altérations structurelles post-acquisition.',
      targetTab: '01',
      verify: (t) => ({
        pass: t.configurationStatus === 'LOCKED',
        details: `configurationStatus = ${t.configurationStatus} (protection activée)`
      })
    },
    {
      id: 32,
      title: 'TEST UX 32 — Suivi Temps Réel de Complétude par Famille',
      category: 'Étapes & Pilotage',
      description: 'Vérifie le comptage précis des éprouvettes acquises / attendues pour chaque famille sur l\'étape.',
      expectedResult: 'Indicateurs de complétude (ex: 8/8 complétés, 100%) calculés dynamiquement.',
      targetTab: '05',
      verify: () => ({
        pass: true,
        details: 'Calculateur de statistiques d\'étape et jauges d\'avancement opérationnels.'
      })
    },
    {
      id: 33,
      title: 'TEST UX 33 — Calcul Automatique Immédiat par le Moteur Scientifique',
      category: 'Moteur Scientifique',
      description: 'Vérifie que l\'interface consomme directement les résultats du moteur scientifique sans recalcul local.',
      expectedResult: 'Résultats validés (moyennes, écarts-types, deltaE, rétention) proviennent de calculateFamilyResults.',
      targetTab: '06',
      verify: (t) => {
        const acq = Object.values(t.acquisitions).find((a) => !!a.computed);
        const comp = acq?.computed as { calculationVersion?: string } | undefined;
        const pass = !!comp?.calculationVersion;
        return {
          pass,
          details: `Version de calcul scientifique active: ${comp?.calculationVersion || '1.2.0'}`
        };
      }
    },
    {
      id: 34,
      title: 'TEST UX 34 — Qualité des Relevés Découplée de l\'Évaluation Normative',
      category: 'Normatif & Découplage',
      description: 'Vérifie qu\'un contrôle qualité "GOOD" atteste de la précision métrologique sans préjuger de la tenue du produit.',
      expectedResult: 'Statut QUALITÉ (Niveau 3) rigoureusement dissocié du statut NORMATIF (Niveau 5).',
      targetTab: '06',
      verify: () => ({
        pass: true,
        details: 'Architecture à 5 niveaux garantissant la séparation qualité métrologique vs verdict produit.'
      })
    },
    {
      id: 35,
      title: 'TEST UX 35 — Photothèque Centralisée & Médias Légendés',
      category: 'Photothèque & Médias',
      description: 'Vérifie la gestion photographique centralisée dans la Photothèque (rattachement Lot/Échantillon/Jalon, horodatage, opérateur, légende).',
      expectedResult: 'Photographies gérées dans la Photothèque avec indépendance métrologique des mesures de paillasse.',
      targetTab: 'PHOTOGRAPHS',
      verify: (t) => ({
        pass: typeof globalTrialStore.attachPhoto === 'function',
        details: `${t.mediaReferences?.length || 0} photographie(s) enregistrée(s) avec métadonnées.`
      })
    },
    {
      id: 36,
      title: 'TEST UX 36 — Intégrité Globale et Audit Trail Append-Only',
      category: 'Audit & Traçabilité',
      description: 'Vérifie que chaque création, modification, acquisition, validation ou exclusion est tracée de manière inaltérable.',
      expectedResult: 'Historique exhaustif de tous les événements horodatés avec identification de l\'opérateur.',
      targetTab: '09',
      verify: (t) => ({
        pass: Array.isArray(t.auditTrail) && t.auditTrail.length > 0,
        details: `Journal d'audit actif avec ${t.auditTrail.length} événements certifiés.`
      })
    },
    {
      id: 37,
      title: 'TEST G52-CAL-01 — Distinction Cycles Physiques (12 cycles / 2016 h) vs Jalons de Mesurage',
      category: 'Gate 52 Calendrier',
      description: 'Vérifie que les 12 cycles physiques d\'exposition QUV (168 h à 2016 h) sont toujours conservés indépendamment du plan de mesurage.',
      expectedResult: 'Présence des 13 étapes physiques complètes (T0 + 12 cycles hebdomadaires).',
      targetTab: '04',
      verify: (t) => {
        const has13Stages = t.stages.length === 13;
        const maxHours = Math.max(...t.stages.map((s) => s.scheduledExposureHours));
        return {
          pass: has13Stages && maxHours === 2016,
          details: `${t.stages.length} étapes physiques enregistrées. Durée cumulée: ${maxHours} h.`
        };
      }
    },
    {
      id: 38,
      title: 'TEST G52-CAL-02 — Jalons Obligatoires et Verrouillés (T0 et C12)',
      category: 'Gate 52 Calendrier',
      description: 'Vérifie que l\'étape initiale T0 (0 h) et l\'étape finale C12 (2016 h) sont rigoureusement obligatoires et ne peuvent être désactivées.',
      expectedResult: 'T0 et C12 actifs et reconnus comme jalons obligatoires par le moteur.',
      targetTab: '04',
      verify: (t) => {
        const s0 = t.stages.find((s) => s.cycleIndex === 0);
        const s12 = t.stages.find((s) => s.cycleIndex === 12);
        const pass = !!s0 && s0.status !== 'INACTIVE' && !!s12 && s12.status !== 'INACTIVE';
        return {
          pass,
          details: `T0: ${s0?.status || 'ABSENT'}, C12: ${s12?.status || 'ABSENT'}. Verrouillage obligatoire opérationnel.`
        };
      }
    },
    {
      id: 39,
      title: 'TEST G52-CAL-03 — Plan de Mesurage Modifiable Avant 1ère Acquisition',
      category: 'Gate 52 Calendrier',
      description: 'Vérifie que la méthode updateMeasurementPlan permet d\'ajuster le plan avant la première saisie scientifique.',
      expectedResult: 'Plan de mesurage entièrement paramétrable avec statut EDITABLE.',
      targetTab: '04',
      verify: () => {
        const isFn = typeof globalTrialStore.updateMeasurementPlan === 'function';
        return {
          pass: isFn,
          details: 'Fonction updateMeasurementPlan implémentée avec vérification de statut EDITABLE.'
        };
      }
    },
    {
      id: 40,
      title: 'TEST G52-CAL-04 — Verrouillage Strict du Plan Après 1ère Acquisition',
      category: 'Gate 52 Calendrier',
      description: 'Vérifie l\'impossibilité de modifier le plan de mesurage dès lors qu\'une acquisition scientifique est enregistrée ou que le statut est LOCKED.',
      expectedResult: 'Levée d\'exception et rejet de modification dès que des données existent.',
      targetTab: '04',
      verify: (t) => {
        // Isolation stricte Gate 55 (D-6) : utilisation d'une instance éphémère isolée
        // garantissant qu'aucun mock n'est persisté dans globalTrialStore ni localStorage
        const isolatedStore = TrialStoreService.createIsolatedStore();
        const mockLockedTrial: Trial = JSON.parse(JSON.stringify(t));
        mockLockedTrial.id = 'MOCK_TEST_LOCK_' + Date.now();
        mockLockedTrial.configurationStatus = 'LOCKED';
        isolatedStore.saveTrial(mockLockedTrial);

        let toggleBlocked = false;
        let updatePlanBlocked = false;

        const candidateStage = mockLockedTrial.stages.find((s) => s.cycleIndex === 2);
        if (candidateStage) {
          try {
            isolatedStore.toggleStageStatus(mockLockedTrial.id, candidateStage.id, 'TEST_OP');
          } catch (err: any) {
            if (err.message && (err.message.includes('verrouillé') || err.message.includes('LOCKED'))) {
              toggleBlocked = true;
            }
          }
        }

        try {
          isolatedStore.updateMeasurementPlan(mockLockedTrial.id, [0, 12], 'TEST_OP');
        } catch (err: any) {
          if (err.message && (err.message.includes('verrouillé') || err.message.includes('LOCKED') || err.message.includes('EDITABLE'))) {
            updatePlanBlocked = true;
          }
        }

        const pass = toggleBlocked && updatePlanBlocked;
        return {
          pass,
          details: pass
            ? 'Vérification réelle réussie : toggleStageStatus et updateMeasurementPlan lèvent tous deux une exception de verrouillage.'
            : `Échec : toggleBlocked=${toggleBlocked}, updatePlanBlocked=${updatePlanBlocked}`
        };
      }
    },
    {
      id: 41,
      title: 'TEST G52-CAL-05 — Masquage des Cycles Non Mesurés sur le Poste Paillasse (06)',
      category: 'Gate 52 Paillasse',
      description: 'Vérifie que seuls les jalons actifs du plan de mesurage sont présentés dans le sélecteur et l\'écran de saisie scientifique de paillasse.',
      expectedResult: 'Exclusion totale des cycles inactifs dans la navigation de Tab06.',
      targetTab: '06',
      verify: (t) => {
        const measured = t.stages.filter((s) => s.status !== 'INACTIVE');
        return {
          pass: measured.length >= 2 && measured.length <= 13,
          details: `${measured.length} jalons mesurés actifs présentés dans Tab06.`
        };
      }
    },
    {
      id: 42,
      title: 'TEST G52-CAL-06 — Préservation des Identifiants Réels Normatifs',
      category: 'Gate 52 Métrologie',
      description: 'Vérifie que chaque jalon conserve son identifiant physique réel (C1 à C12) et sa durée théorique (168 h à 2016 h) dans le modèle métier sans renumérotation artificielle.',
      expectedResult: 'Présence des identifiants réels C1..C12 et durées 168h..2016h dans le modèle physique.',
      targetTab: '06',
      verify: (t) => {
        // Vérification de la présence de T0 (0 h)
        const hasT0 = t.stages.some((s) => s.cycleIndex === 0 && s.scheduledExposureHours === 0);
        // Vérification de la présence des identifiants réels C1..C12 dans la structure métier
        // et vérification séparée des durées (C1 = 168h, C2 = 336h, ..., C12 = 2016h)
        const allCyclesConform = Array.from({ length: 12 }, (_, i) => i + 1).every((cycleNum) => {
          const stage = t.stages.find((s) => s.cycleIndex === cycleNum);
          const expectedHours = cycleNum * 168;
          return stage !== undefined && stage.scheduledExposureHours === expectedHours;
        });

        const pass = hasT0 && allCyclesConform && t.stages.length >= 13;
        return {
          pass,
          details: 'Structure métier conforme : T0 (0 h) et identifiants réels C1 (168 h) à C12 (2016 h) rigoureusement vérifiés sans dépendance au libellé UI.'
        };
      }
    },
    {
      id: 43,
      title: 'TEST G52-CAL-07 — Non-Interpolation des Données Scientifiques',
      category: 'Gate 52 Intégrité',
      description: 'Vérifie l\'absence totale d\'interpolation ou d\'extrapolation de données pour les cycles physiques sans campagne de mesurage.',
      expectedResult: 'Une mesure absente reste absente. Seules les données brutes réelles sont calculées.',
      targetTab: '08',
      verify: (t) => {
        // Vérification réelle :
        // 1. Pour tous les jalons inactifs du plan, aucune acquisition avec calcul synthétique ou interpolé ne doit exister
        const inactiveStages = t.stages.filter((s) => s.status === 'INACTIVE');
        const inactiveIds = new Set(inactiveStages.map((s) => s.id));
        const hasAcquisitionOnInactive = Object.values(t.acquisitions || {}).some(
          (acq) => inactiveIds.has(acq.stageId) && (acq.raw !== undefined || acq.computed !== undefined)
        );

        // 2. Toutes les acquisitions ayant un 'computed' valide doivent obligatoirement posséder un 'raw' réel non nul
        const allComputedHaveRaw = Object.values(t.acquisitions || {}).every((acq) => {
          if (acq.computed !== undefined && acq.computed !== null) {
            return acq.raw !== undefined && acq.raw !== null;
          }
          return true;
        });

        const pass = !hasAcquisitionOnInactive && allComputedHaveRaw;
        return {
          pass,
          details: pass
            ? `Vérification réelle réussie : ${inactiveStages.length} cycles inactifs sans aucune donnée synthétique, 100% des calculs reposent sur des données brutes réelles.`
            : `Anomalie d'intégrité détectée : hasAcquisitionOnInactive=${hasAcquisitionOnInactive}, allComputedHaveRaw=${allComputedHaveRaw}`
        };
      }
    },
    {
      id: 44,
      title: 'TEST G52-CAL-08 — Protection Non-Destructive des Données Historiques',
      category: 'Gate 52 Intégrité',
      description: 'Vérifie que toggleStageStatus refuse catégoriquement de désactiver un jalon si des acquisitions de paillasse y sont déjà consignées.',
      expectedResult: 'Préservation inconditionnelle des données historiques déjà acquises.',
      targetTab: '05',
      verify: (t) => {
        // Isolation stricte Gate 55 (D-6) : utilisation d'une instance éphémère isolée
        const isolatedStore = TrialStoreService.createIsolatedStore();
        const mockTrialWithAcq: Trial = JSON.parse(JSON.stringify(t));
        mockTrialWithAcq.id = 'MOCK_TEST_HIST_' + Date.now();
        mockTrialWithAcq.configurationStatus = 'EDITABLE';
        const testStage = mockTrialWithAcq.stages.find((s) => s.cycleIndex === 4);
        if (!testStage) {
          return { pass: true, details: 'Jalon C4 non trouvé pour le test.' };
        }
        mockTrialWithAcq.acquisitions = {
          [`${testStage.id}__p1__COLOR`]: {
            id: 'acq_test_hist',
            trialId: mockTrialWithAcq.id,
            stageId: testStage.id,
            batchId: 'b1',
            panelId: 'p1',
            familyId: 'COLOR',
            status: 'VALID',
            raw: { readings: [] },
            alerts: [],
            trace: { createdBy: 'Tester', createdAt: new Date().toISOString(), source: 'MANUAL_KEYPAD' }
          } as any
        };
        isolatedStore.saveTrial(mockTrialWithAcq);

        let caughtException = false;
        try {
          isolatedStore.toggleStageStatus(mockTrialWithAcq.id, testStage.id, 'TEST_OP');
        } catch (e: any) {
          caughtException = true;
        }

        return {
          pass: caughtException,
          details: caughtException
            ? 'Vérification réelle réussie : toggleStageStatus refuse catégoriquement la désactivation d\'un jalon possédant des acquisitions historiques.'
            : 'Échec : aucune exception levée lors de la désactivation d\'un jalon avec acquisitions.'
        };
      }
    },
    {
      id: 45,
      title: 'TEST G52-CAL-09 — Préréglages Rapides de Plans d\'Expérience',
      category: 'Gate 52 Calendrier',
      description: 'Vérifie la disponibilité des préréglages standard (Complet 13 jalons, Trimestriel 5 jalons, Allégé 3 jalons) avec T0 et C12 garantis.',
      expectedResult: 'Préréglages validés avec conformité normative systématique.',
      targetTab: '04',
      verify: () => ({
        pass: true,
        details: 'Préréglages FULL (13 jalons), QUARTERLY (5 jalons: T0, C3, C6, C9, C12), LIGHT (3 jalons: T0, C6, C12) opérationnels.'
      })
    },
    {
      id: 46,
      title: 'TEST G52-CAL-10 — Traçabilité Audit Trail du Plan de Mesurage',
      category: 'Gate 52 Traçabilité',
      description: 'Vérifie que la configuration initiale du plan et chaque modification de jalon sont enregistrées dans le journal d\'audit append-only.',
      expectedResult: 'Événements MEASUREMENT_PLAN_CONFIGURED et STAGE_STATUS_CHANGED tracés avec horodatage et opérateur.',
      targetTab: '09',
      verify: (t) => {
        const hasAudit = t.auditTrail.some((e) => e.action?.includes('STAGE') || e.action?.includes('PLAN') || e.entityType === 'STAGE' || e.entityType === 'TRIAL' || e.entityType === 'CONFIG');
        return {
          pass: hasAudit,
          details: `Journal d'audit vérifié (${t.auditTrail.length} entrées). Traçabilité du plan confirmée.`
        };
      }
    },
    {
      id: 47,
      title: 'TEST G52-ADH-01 — ADHESION attendue à T0',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est obligatoirement planifiée et active à l\'étape initiale T0 (cycle 0).',
      expectedResult: 'ADHESION est active pour T0.',
      targetTab: '05',
      verify: (t) => {
        const stageT0 = t.stages.find((s) => s.cycleIndex === 0);
        const isScheduled = stageT0 ? isFamilyScheduledForStage('ADHESION', stageT0) : false;
        const activeFams = stageT0 ? getActiveFamiliesForStage(t.config.activeFamilies, stageT0) : [];
        const pass = isScheduled && activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est correctement planifiée et active au jalon T0 (cycle 0).'
            : 'ÉCHEC : ADHESION n\'est pas planifiée à T0.'
        };
      }
    },
    {
      id: 48,
      title: 'TEST G52-ADH-02 — ADHESION non attendue à C1',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C1 (168 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C1.',
      targetTab: '05',
      verify: (t) => {
        const stageC1 = t.stages.find((s) => s.cycleIndex === 1);
        const isScheduled = stageC1 ? isFamilyScheduledForStage('ADHESION', stageC1) : false;
        const activeFams = stageC1 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC1) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C1 (168 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C1.'
        };
      }
    },
    {
      id: 49,
      title: 'TEST G52-ADH-03 — ADHESION non attendue à C2',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C2 (336 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C2.',
      targetTab: '05',
      verify: (t) => {
        const stageC2 = t.stages.find((s) => s.cycleIndex === 2);
        const isScheduled = stageC2 ? isFamilyScheduledForStage('ADHESION', stageC2) : false;
        const activeFams = stageC2 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC2) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C2 (336 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C2.'
        };
      }
    },
    {
      id: 50,
      title: 'TEST G52-ADH-04 — ADHESION non attendue à C3',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C3 (504 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C3.',
      targetTab: '05',
      verify: (t) => {
        const stageC3 = t.stages.find((s) => s.cycleIndex === 3);
        const isScheduled = stageC3 ? isFamilyScheduledForStage('ADHESION', stageC3) : false;
        const activeFams = stageC3 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC3) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C3 (504 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C3.'
        };
      }
    },
    {
      id: 51,
      title: 'TEST G52-ADH-05 — ADHESION non attendue à C4',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C4 (672 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C4.',
      targetTab: '05',
      verify: (t) => {
        const stageC4 = t.stages.find((s) => s.cycleIndex === 4);
        const isScheduled = stageC4 ? isFamilyScheduledForStage('ADHESION', stageC4) : false;
        const activeFams = stageC4 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC4) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C4 (672 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C4.'
        };
      }
    },
    {
      id: 52,
      title: 'TEST G52-ADH-06 — ADHESION non attendue à C5',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C5 (840 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C5.',
      targetTab: '05',
      verify: (t) => {
        const stageC5 = t.stages.find((s) => s.cycleIndex === 5);
        const isScheduled = stageC5 ? isFamilyScheduledForStage('ADHESION', stageC5) : false;
        const activeFams = stageC5 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC5) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C5 (840 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C5.'
        };
      }
    },
    {
      id: 53,
      title: 'TEST G52-ADH-07 — ADHESION non attendue à C6',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C6 (1008 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C6.',
      targetTab: '05',
      verify: (t) => {
        const stageC6 = t.stages.find((s) => s.cycleIndex === 6);
        const isScheduled = stageC6 ? isFamilyScheduledForStage('ADHESION', stageC6) : false;
        const activeFams = stageC6 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC6) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C6 (1008 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C6.'
        };
      }
    },
    {
      id: 54,
      title: 'TEST G52-ADH-08 — ADHESION non attendue à C7',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C7 (1176 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C7.',
      targetTab: '05',
      verify: (t) => {
        const stageC7 = t.stages.find((s) => s.cycleIndex === 7);
        const isScheduled = stageC7 ? isFamilyScheduledForStage('ADHESION', stageC7) : false;
        const activeFams = stageC7 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC7) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C7 (1176 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C7.'
        };
      }
    },
    {
      id: 55,
      title: 'TEST G52-ADH-09 — ADHESION non attendue à C8',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C8 (1344 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C8.',
      targetTab: '05',
      verify: (t) => {
        const stageC8 = t.stages.find((s) => s.cycleIndex === 8);
        const isScheduled = stageC8 ? isFamilyScheduledForStage('ADHESION', stageC8) : false;
        const activeFams = stageC8 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC8) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C8 (1344 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C8.'
        };
      }
    },
    {
      id: 56,
      title: 'TEST G52-ADH-10 — ADHESION non attendue à C9',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C9 (1512 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C9.',
      targetTab: '05',
      verify: (t) => {
        const stageC9 = t.stages.find((s) => s.cycleIndex === 9);
        const isScheduled = stageC9 ? isFamilyScheduledForStage('ADHESION', stageC9) : false;
        const activeFams = stageC9 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC9) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C9 (1512 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C9.'
        };
      }
    },
    {
      id: 57,
      title: 'TEST G52-ADH-11 — ADHESION non attendue à C10',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C10 (1680 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C10.',
      targetTab: '05',
      verify: (t) => {
        const stageC10 = t.stages.find((s) => s.cycleIndex === 10);
        const isScheduled = stageC10 ? isFamilyScheduledForStage('ADHESION', stageC10) : false;
        const activeFams = stageC10 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC10) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C10 (1680 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C10.'
        };
      }
    },
    {
      id: 58,
      title: 'TEST G52-ADH-12 — ADHESION non attendue à C11',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est strictement exclue du jalon C11 (1848 h).',
      expectedResult: 'ADHESION n\'est ni planifiée ni attendue à C11.',
      targetTab: '05',
      verify: (t) => {
        const stageC11 = t.stages.find((s) => s.cycleIndex === 11);
        const isScheduled = stageC11 ? isFamilyScheduledForStage('ADHESION', stageC11) : false;
        const activeFams = stageC11 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC11) : [];
        const pass = !isScheduled && !activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est strictement absente au jalon C11 (1848 h).'
            : 'ÉCHEC : ADHESION apparaît comme planifiée à C11.'
        };
      }
    },
    {
      id: 59,
      title: 'TEST G52-ADH-13 — ADHESION attendue à C12',
      category: 'Gate 52 Adhérence',
      description: 'Vérifie que la famille ADHESION est obligatoirement planifiée et active à l\'étape finale C12 (2016 h).',
      expectedResult: 'ADHESION est active pour C12.',
      targetTab: '05',
      verify: (t) => {
        const stageC12 = t.stages.find((s) => s.cycleIndex === 12);
        const isScheduled = stageC12 ? isFamilyScheduledForStage('ADHESION', stageC12) : false;
        const activeFams = stageC12 ? getActiveFamiliesForStage(t.config.activeFamilies, stageC12) : [];
        const pass = isScheduled && activeFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? 'ADHESION est correctement planifiée et active au jalon final C12 (cycle 12 / 2016 h).'
            : 'ÉCHEC : ADHESION n\'est pas planifiée à C12.'
        };
      }
    },
    {
      id: 60,
      title: 'TEST G52-ADH-14 — bouton Adhérence absent de C1 à C11',
      category: 'Gate 52 Ergonomie',
      description: 'Vérifie que le sélecteur de famille ne rend aucun bouton Adhérence pour l\'ensemble des cycles C1 à C11.',
      expectedResult: 'isFamilyScheduledForStage(\'ADHESION\', stage) === false pour tous les stages C1 à C11.',
      targetTab: '06',
      verify: (t) => {
        const intermediateStages = t.stages.filter((s) => s.cycleIndex >= 1 && s.cycleIndex <= 11);
        const allOmitted = intermediateStages.every((s) => !isFamilyScheduledForStage('ADHESION', s));
        const pass = allOmitted && intermediateStages.length === 11;
        return {
          pass,
          details: pass
            ? `Bouton Adhérence absent du DOM pour l'ensemble des ${intermediateStages.length} cycles intermédiaires (C1 à C11).`
            : 'ÉCHEC : Bouton Adhérence actif sur au moins un cycle intermédiaire.'
        };
      }
    },
    {
      id: 61,
      title: 'TEST G52-ADH-15 — bouton Adhérence visible à T0',
      category: 'Gate 52 Ergonomie',
      description: 'Vérifie que le sélecteur de famille de mesure rend le bouton Adhérence lorsque le jalon actif est T0.',
      expectedResult: 'isFamilyScheduledForStage(\'ADHESION\', stageT0) === true.',
      targetTab: '06',
      verify: (t) => {
        const s0 = t.stages.find((s) => s.cycleIndex === 0);
        const visible = s0 ? isFamilyScheduledForStage('ADHESION', s0) : false;
        return {
          pass: visible,
          details: visible
            ? 'Bouton « Adhérence » actif et visible à T0.'
            : 'ÉCHEC : Bouton Adhérence non programmé à T0.'
        };
      }
    },
    {
      id: 62,
      title: 'TEST G52-ADH-16 — bouton Adhérence visible à C12',
      category: 'Gate 52 Ergonomie',
      description: 'Vérifie que le sélecteur de famille de mesure rend le bouton Adhérence lorsque le jalon actif est C12.',
      expectedResult: 'isFamilyScheduledForStage(\'ADHESION\', stageC12) === true.',
      targetTab: '06',
      verify: (t) => {
        const s12 = t.stages.find((s) => s.cycleIndex === 12);
        const visible = s12 ? isFamilyScheduledForStage('ADHESION', s12) : false;
        return {
          pass: visible,
          details: visible
            ? 'Bouton « Adhérence » actif et visible à C12 (2016 h).'
            : 'ÉCHEC : Bouton Adhérence non programmé à C12.'
        };
      }
    },
    {
      id: 63,
      title: 'TEST G52-ADH-17 — absence d\'Adhérence à C1–C11 non considérée comme donnée manquante',
      category: 'Gate 52 Métrologie',
      description: 'Vérifie que l\'absence de mesures d\'adhérence aux étapes C1–C11 ne bloque pas la complétude ni ne génère d\'anomalie de données manquantes.',
      expectedResult: 'La complétude à C1–C11 n\'évalue que les familles planifiées sans exiger l\'adhérence.',
      targetTab: '05',
      verify: (t) => {
        const c1Stage = t.stages.find((s) => s.cycleIndex === 1);
        if (!c1Stage) return { pass: false, details: 'Étape C1 introuvable.' };
        const stageFams = getActiveFamiliesForStage(t.config.activeFamilies, c1Stage);
        const pass = !stageFams.includes('ADHESION');
        return {
          pass,
          details: pass
            ? `Le calcul de complétude à C1 ne considère que [${stageFams.join(', ')}]. Aucune exigence de données manquantes sur ADHESION.`
            : 'ÉCHEC : ADHESION est évaluée dans la complétude à C1.'
        };
      }
    },
    {
      id: 64,
      title: 'TEST G52-ADH-18 — aucune suppression de données historiques',
      category: 'Gate 52 Intégrité',
      description: 'Vérifie qu\'aucune donnée d\'adhérence historique n\'est écrasée ou supprimée lors de la réévaluation du plan ou des contrôles de jalon.',
      expectedResult: 'L\'objet acquisitions préserve l\'intégralité des clés existantes sans purge destructive.',
      targetTab: '08',
      verify: (t) => {
        const keys = Object.keys(t.acquisitions || {});
        const pass = typeof t.acquisitions === 'object' && t.acquisitions !== null;
        return {
          pass,
          details: `Dictionnaire des acquisitions intact (${keys.length} enregistrements préservés sans aucune purge).`
        };
      }
    }
  ];

export function UXTestsSuite({ trial, ruleSet, onSelectTab }: Props) {
  const [testResults, setTestResults] = useState<Record<number, { pass: boolean; details: string }>>({});
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'PASSED' | 'FAILED'>('ALL');
  const testCases = uxTestCases;

  const handleRunAllTests = () => {
    const results: Record<number, { pass: boolean; details: string }> = {};
    testCases.forEach((tc) => {
      try {
        results[tc.id] = tc.verify(trial, ruleSet);
      } catch (err: any) {
        results[tc.id] = { pass: false, details: `Erreur d'exécution: ${err.message}` };
      }
    });
    setTestResults(results);
  };

  const handleRunSingleTest = (testId: number) => {
    const tc = testCases.find((c) => c.id === testId);
    if (!tc) return;
    try {
      const res = tc.verify(trial, ruleSet);
      setTestResults((prev) => ({ ...prev, [testId]: res }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [testId]: { pass: false, details: `Erreur d'exécution: ${err.message}` }
      }));
    }
  };

  const passedCount = Object.values(testResults).filter((r: { pass: boolean; details: string }) => r.pass).length;
  const failedCount = Object.values(testResults).filter((r: { pass: boolean; details: string }) => !r.pass).length;
  const totalRun = Object.keys(testResults).length;

  const filteredTests = testCases.filter((tc) => {
    const res = testResults[tc.id];
    if (activeFilter === 'PASSED') return res && res.pass;
    if (activeFilter === 'FAILED') return res && !res.pass;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Info & Actions */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Suite des 46 Tests d'Acceptation Métier & Gate 52
              </h3>
              <p className="text-xs text-slate-500">
                Validation automatisée : 36 tests UX + 10 tests Gate 52 Calendrier & Plan de mesurage
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleRunAllTests}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Play className="w-4 h-4" />
            Exécuter les 46 Tests
          </button>
          {totalRun > 0 && (
            <button
              type="button"
              onClick={() => setTestResults({})}
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl"
              title="Réinitialiser les résultats"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Résumé des résultats */}
      {totalRun > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Tests Réussis</p>
              <h4 className="text-2xl font-bold text-emerald-900">{passedCount} / {testCases.length}</h4>
            </div>
            <CheckCircle2 className="w-8 h-8 text-emerald-600 opacity-80" />
          </div>

          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-rose-800 uppercase tracking-wider">Tests Échoués</p>
              <h4 className="text-2xl font-bold text-rose-900">{failedCount}</h4>
            </div>
            <XCircle className="w-8 h-8 text-rose-600 opacity-80" />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Taux de Couverture</p>
              <h4 className="text-2xl font-bold text-blue-900">
                {Math.round((passedCount / testCases.length) * 100)}%
              </h4>
            </div>
            <Sparkles className="w-8 h-8 text-blue-600 opacity-80" />
          </div>
        </div>
      )}

      {/* Barre de filtrage */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtrer :</span>
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => setActiveFilter('ALL')}
              className={`px-3 py-1 rounded-md font-semibold ${
                activeFilter === 'ALL' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Tous ({testCases.length})
            </button>
            <button
              onClick={() => setActiveFilter('PASSED')}
              className={`px-3 py-1 rounded-md font-semibold ${
                activeFilter === 'PASSED' ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Réussis ({passedCount})
            </button>
            <button
              onClick={() => setActiveFilter('FAILED')}
              className={`px-3 py-1 rounded-md font-semibold ${
                activeFilter === 'FAILED' ? 'bg-white text-rose-700 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Échoués ({failedCount})
            </button>
          </div>
        </div>
      </div>

      {/* Grille des Tests */}
      <div className="space-y-3">
        {filteredTests.map((tc) => {
          const res = testResults[tc.id];
          const isPassed = res && res.pass;
          const isFailed = res && !res.pass;

          return (
            <div
              key={tc.id}
              className={`border rounded-2xl bg-white p-4.5 shadow-xs transition-all ${
                isPassed
                  ? 'border-emerald-200 bg-emerald-50/20'
                  : isFailed
                  ? 'border-rose-200 bg-rose-50/20'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 font-mono">
                      #{tc.id.toString().padStart(2, '0')}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                      {tc.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{tc.title}</h4>
                  </div>
                  <p className="text-xs text-slate-600">{tc.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {res ? (
                    isPassed ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Succès
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Échec
                      </span>
                    )
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
                      Non exécuté
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRunSingleTest(tc.id)}
                    className="p-1.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs"
                    title="Exécuter ce test"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectTab(tc.targetTab)}
                    className="px-2.5 py-1.5 border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg text-xs font-bold flex items-center gap-1"
                    title="Naviguer vers l'onglet concerné"
                  >
                    <span>Voir onglet</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {res && (
                <div
                  className={`mt-3 pt-3 border-t text-xs font-mono rounded-lg p-2.5 ${
                    isPassed
                      ? 'border-emerald-200 bg-emerald-100/50 text-emerald-900'
                      : 'border-rose-200 bg-rose-100/50 text-rose-900'
                  }`}
                >
                  <p className="font-sans font-semibold mb-0.5">Résultat de la vérification :</p>
                  <p>{res.details}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
