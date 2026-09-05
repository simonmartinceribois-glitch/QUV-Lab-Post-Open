/**
 * QUV-Lab — Identifiants uniques (UUID)
 * Issu du decoupage de trialStore.ts (refactor/split-trialstore). Code deplace a l'identique.
 */
import { UUID } from '../types/scientific';

/**
 * Générateur d'UUID simple
 */
export function generateUUID(): UUID {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
