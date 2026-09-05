/**
 * QUV-Lab — Photothèque : types partagés des vues (refactor/split-photographs).
 * Aucune logique : seuls types déplacés depuis TabPhotographs.tsx.
 */

import type { BatchDefinition, ExposureStage, PanelDefinition } from '../../types/trial';

export type PhotothequeViewMode = 'SPECIMEN_TIMELINE' | 'TEMPORAL_COMPARE' | 'MATRIX' | 'GALLERY';

export interface PanelEntry {
  panel: PanelDefinition;
  batch: BatchDefinition;
}

export type PanelMap = Map<string, PanelEntry>;

export type StageMap = Map<string, ExposureStage>;

export interface ActiveSpecimen {
  batchId: string;
  panelId: string;
}
