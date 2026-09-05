/**
 * QUV-Lab — Paillasse : types partagés des sous-vues (refactor/split-bench).
 * Aucune logique : seuls types.
 */

import type { MeasurementFamilyId } from '../../types/scientific';
import type { BatchDefinition, ExposureStage, PanelAcquisitionRecord, PanelDefinition, Trial } from '../../types/trial';

export interface PanelListItem {
  batch: BatchDefinition;
  panel: PanelDefinition;
}

export interface BenchTopBarData {
  stageStepNumber: number;
  totalStagesCount: number;
  stageHoursDisplay: string;
  stageActionLabel: string;
  stageName: string;
}

export type { ExposureStage, PanelAcquisitionRecord, Trial };
