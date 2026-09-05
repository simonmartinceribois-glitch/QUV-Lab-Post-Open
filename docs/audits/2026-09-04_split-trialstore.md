# AUDIT — refactor/split-trialstore (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/refactor-split-trialstore.md`.
> Vérifié : `tsc --noEmit` (strict) 0 erreur du 1er coup, `npm test` 195/195,
> `vite build` OK, `npm run clean` OK.

## Diff

- `trialStore.ts` 2432 l → 6 modules : façade 12 l, `trialStoreService` 1106 l,
  `trialSeed` 1013 l, `trialIntegrity` 95 l, `trialStages` 60 l, `trialIds` 15 l.
- Split byte-exact par script (pas de transcription manuelle) ; seules différences
  volontaires : imports inter-modules, `createDemoTrial` rendue exportée (usage service,
  non ré-exportée par la façade → API publique inchangée à 8 symboles),
  `reportGenerator.ts:15` → `./trialIds` (casse le cycle préexistant).
- API publique vérifiée identique : generateUUID, IntegrityViolationError,
  validateAcquisitionTarget, validatePhotoTarget, generateStandardExposureStages,
  createValidationTrial, TrialStoreService, globalTrialStore.
- Importeurs : les ~20 imports `./trialStore` résolvent via la façade, inchangés.

## Contrôles

- [x] Aucune logique modifiée (déplacement seul) ; `STORAGE_KEY` et ordre d'évaluation préservés.
- [x] 195/195 : les gates 31/32/50/54 exercent le store (guards, persistance, photos, jalons).
- [x] Pas de secrets, pas de cycle nouveau.
- [~] Suivi : imports pleins recopiés dans seed/service (quelques inutilisés, `noUnusedLocals` off,
  `tsc` vert) → micro-nettoyage optionnel ultérieur, hors périmètre.

## Verdict : conforme → branche `refactor/split-trialstore`, PR vers `develop`, merge après CI verte.
