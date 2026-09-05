/**
 * QUV-Lab — Utilitaires de Filtrage et Ségrégation Éprouvettes & Jalons (GATE 2.2)
 *
 * Règles absolues :
 * 1. Témoin T (conservé à l'obscurité) NE DOIT JAMAIS entrer dans les calculs de moyennes
 *    et dispersions des exposés E1, E2, E3.
 * 2. Les étapes inactives (désactivées par l'opérateur) sont exclues des calculs actifs.
 */

import { PanelDefinition, ExposureStage } from '../types/trial';
import { MeasurementFamilyId } from '../types/scientific';

/**
 * Détermine si une éprouvette est le Témoin non exposé (T)
 */
export function isWitnessPanel(panel: {
  label?: string;
  roleCode?: string;
  role?: string;
}): boolean {
  if (!panel) return false;
  return (
    panel.label === 'T' ||
    panel.roleCode === 'T' ||
    panel.role === 'WITNESS' ||
    panel.label === 'P01' && (panel.role === 'WITNESS' || panel.roleCode === 'T')
  );
}

/**
 * Détermine si une éprouvette est une éprouvette exposée valide (E1, E2, E3, etc.)
 */
export function isExposedPanel(panel: {
  label?: string;
  roleCode?: string;
  role?: string;
  status?: string;
}): boolean {
  if (!panel) return false;
  if (panel.status && panel.status !== 'ACTIVE') return false;
  return !isWitnessPanel(panel);
}

/**
 * Filtre les éprouvettes actives et EXPOSÉES d'une liste (exclut T et les exclus)
 */
export function getActiveExposedPanels<T extends { label?: string; roleCode?: string; role?: string; status?: string }>(
  panels: T[]
): T[] {
  return panels.filter((p) => isExposedPanel(p));
}

/**
 * Récupère l'éprouvette Témoin T d'un lot
 */
export function getWitnessPanel<T extends { label?: string; roleCode?: string; role?: string }>(
  panels: T[]
): T | undefined {
  return panels.find((p) => isWitnessPanel(p));
}

/**
 * Filtre les étapes actives de l'essai (exclut les étapes désactivées / INACTIVE)
 */
export function getActiveStages<T extends { status: string }>(stages: T[]): T[] {
  return stages.filter((s) => s.status !== 'INACTIVE');
}

/**
 * Détermine si une étape est obligatoire et non désactivable
 */
export function isMandatoryStage(stage: { cycleIndex: number; stageType?: string }): boolean {
  return (
    stage.cycleIndex === 0 ||
    stage.cycleIndex === 12 ||
    stage.stageType === 'INITIAL_PRE_EXPOSURE' ||
    stage.stageType === 'FINAL_POST_EXPOSURE'
  );
}

/**
 * RÈGLE MÉTIER CANONIQUE QUV-Lab — Famille ADHESION (NF EN ISO 2409:2020) :
 * ADHESION = T0 + C12 UNIQUEMENT.
 *
 * L'adhérence au quadrillage est un essai mécanique destructif. Elle est obligatoire et attendue
 * exclusivement à l'état initial (T0 / 0 h) et à l'état final (C12 / 2016 h).
 * Elle est strictement INTERDITE et NON MESURÉE aux jalons intermédiaires C1 à C11.
 *
 * Cette fonction est la SOURCE DE VÉRITÉ UNIQUE régissant :
 * - Le modèle métier
 * - Le plan de mesurage
 * - La complétude et la progression
 * - L'interface utilisateur (affichage des sélecteurs et boutons de saisie)
 */
export function isFamilyScheduledForStage(
  familyId: MeasurementFamilyId | string,
  stage: { cycleIndex: number; stageType?: string; scheduledExposureHours?: number } | undefined | null
): boolean {
  if (!stage) return false;
  if (familyId === 'ADHESION') {
    // T0 (0 h) ou C12 (2016 h) uniquement
    return (
      stage.cycleIndex === 0 ||
      stage.cycleIndex === 12 ||
      stage.stageType === 'INITIAL_PRE_EXPOSURE' ||
      stage.stageType === 'FINAL_POST_EXPOSURE'
    );
  }
  // Pour toutes les autres familles (COLOR, GLOSS, PERSOZ, OBSERVATIONS, etc.),
  // elles sont applicables à tous les jalons de l'échéancier.
  return true;
}

/**
 * Retourne la liste des familles actives applicables à un jalon d'exposition donné.
 * Filtre les familles actives de l'essai selon leur éligibilité pour ce jalon.
 */
export function getActiveFamiliesForStage(
  activeFamilies: (MeasurementFamilyId | string)[],
  stage: { cycleIndex: number; stageType?: string; scheduledExposureHours?: number } | undefined | null
): MeasurementFamilyId[] {
  if (!activeFamilies || !stage) return [];
  return (activeFamilies as MeasurementFamilyId[]).filter((fam) => isFamilyScheduledForStage(fam, stage));
}

