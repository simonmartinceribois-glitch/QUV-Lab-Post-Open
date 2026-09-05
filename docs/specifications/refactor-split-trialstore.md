# SPEC — refactor/split-trialstore (MEDIUM+, base `develop`)

> Origine : audit C8 (god file ~2,4k lignes). Preuves Architect : 13 symboles, ~20 importeurs,
> 1 cycle existant `trialStore ↔ reportGenerator` (via `generateUUID`).

## 1. Cartographie actuelle (`services/trialStore.ts`, 2432 lignes)

| Lignes | Contenu | Importeurs externes |
|---|---|---|
| 50-56 | `generateUUID` | reportGenerator, Tab02, Tab06, tests (53/54) |
| 61-155 | `IntegrityViolationError`, `validateAcquisitionTarget`, `validatePhotoTarget` | tests (gate50, 31) |
| 163-215 | `generateStandardExposureStages` | tests (gate22, scientificEngine) |
| 220-782 | `createDemoTrial` + `seedDemoAcquisitions` (privées) | — (via `loadFromStorage`/`resetToDemo`) |
| 783-~1210 | `createValidationTrial` (exportée, usage interne seul) | — |
| 1213-1250 | `recordAcquisitionDirect` (privée, ~40 appels seed) | — |
| 1253-~2430 | `TrialStoreService` (25+ méthodes) | `UXTestsSuite` (classe), tous les onglets + tests (singleton) |
| 2432 | `globalTrialStore = new TrialStoreService()` | ~20 importeurs |

## 2. Découpage prescrit (façade, **0 importeur métier touché**)

```text
services/trialIds.ts        ← generateUUID (types seuls)
services/trialIntegrity.ts  ← IntegrityViolationError + 2 validate* (types seuls)
services/trialStages.ts     ← generateStandardExposureStages (types seuls)
services/trialSeed.ts       ← createDemoTrial + seedDemoAcquisitions + createValidationTrial
                              + recordAcquisitionDirect (imports: types, ruleSet, recalculator)
services/trialStoreService.ts ← TrialStoreService (imports: les 4 ci-dessus + reportGenerator,
                                auditEngine, panelUtils)
services/trialStore.ts      ← FAÇADE : ré-exporte tout + instancie globalTrialStore
```

- `trialStore.ts` final ≈ 30 lignes : `export *` ciblés (pas de `export *` aveugle : lister
  explicitement chaque symbole pour garder l'API exacte) + `globalTrialStore`.
- **1 seule exception importeur** : `reportGenerator.ts:15` `from './trialStore'` → `from './trialIds'`
  (casse le cycle existant ; appel différé identique, aucun comportement changé).
- Interdictions : aucune logique déplacée modifiée (copie à l'identique), aucun renommage public,
  aucun nouvel export public (sauf `recordAcquisitionDirect` si besoin interne — le garder privé au module seed),
  `STORAGE_KEY` inchangée (compatibilité `localStorage` existant), ordre d'évaluation préservé
  (singleton instancié dans la façade comme aujourd'hui).

## 3. Hors périmètre

Découpage des onglets god files, logique métier, seeds de démo (données inchangées), `strict` déjà vert.

## 4. Tests (Tester) — garde-fous comportementaux

`npm run typecheck` (0), `npm test` (**195/195**, les gates 31/32/50/54 exercent le store en profondeur :
guards, persistance, photos, jalons), `npm run build`. Vérifier en plus :
`git diff --stat` ne montre que `services/` (+ spec/audit), et `grep -r "from.*services/trialStore['\"]" src --include=*.tsx`
retourne exactement les mêmes importeurs qu'avant (sauf reportGenerator).
