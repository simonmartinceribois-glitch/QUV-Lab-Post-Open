/**
 * QUV-Lab — Assistant de création : types partagés des étapes (refactor/split-wizard).
 * Aucune logique : seuls types. Les setters sont typés Dispatch pour un déplacement verbatim.
 */

import type { Dispatch, SetStateAction } from 'react';
import type { MeasurementFamilyId } from '../../types/scientific';
import type { LotFormItem } from '../CreateTrialWizardModal';

export type TextSetter = Dispatch<SetStateAction<string>>;
export type NumberSetter = Dispatch<SetStateAction<number>>;
export type DimUnit = 'mm' | 'cm';
export type DimUnitSetter = Dispatch<SetStateAction<DimUnit>>;

export interface StepNavigation {
  step: number;
  onStepChange: (step: 1 | 2 | 3 | 4 | 5 | 6 | 7) => void;
}

export type { LotFormItem, MeasurementFamilyId };
