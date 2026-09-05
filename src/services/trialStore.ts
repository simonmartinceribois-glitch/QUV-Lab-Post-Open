/**
 * QUV-Lab — Facade — point d'entree stable du magasin d'essais
 * Issu du decoupage de trialStore.ts (refactor/split-trialstore). Code deplace a l'identique.
 */
export { generateUUID } from './trialIds';
export { IntegrityViolationError, validateAcquisitionTarget, validatePhotoTarget } from './trialIntegrity';
export { generateStandardExposureStages } from './trialStages';
export { createValidationTrial } from './trialSeed';
export { TrialStoreService } from './trialStoreService';
import { TrialStoreService } from './trialStoreService';

export const globalTrialStore = new TrialStoreService();
