# QUV-Lab — ARCHITECTURE (v2, état `develop` post-v1.4.0 — 2026-09-04)

> Régénéré le 2026-09-04 (audit N2) : remplace la v1 (audit initial, pré-tickets).
> Source de vérité : GitHub `simonmartinceribois-glitch/QUV-lab-Open-code` (`main` taguée `v1.4.0`).
> Preuves : `tsc --strict` 0 erreur, `npm test` 195/195, `vite build` OK (0 warning circulaire).

## 1. Vue d'ensemble

- **Stack** : React 19 + Vite 6 + TypeScript 5.8 (`strict:true`) + Tailwind 4.
- **Objet** : suivi d'essais de vieillissement accéléré UV selon NF EN 927-6 (Cycle A : T0 + 12 × 168 h = 2016 h).
- **Scripts** (`package.json`) : `dev` (port 3000), `build` (`tsc --noEmit && vite build`),
  `test` (`tsx run_tests.ts`, 195 tests), `typecheck`/`lint` (`tsc --noEmit`), `clean` (cross-platform, `dist/` seul), `preview`.
- **Dépendances** : react, vite, tailwind, recharts, motion, lucide (+ `@types/*`).
  `express`/`dotenv`/`@google/genai` purgés (PR #8). 100 % local, sans backend ni clé API.
- Plus gros fichiers restants : `UXTestsSuite.tsx` (1346 l, tests UI),
  `trialStoreService.ts` (1106 l), `trialSeed.ts` (1013 l), `Tab06MeasurementsBench.tsx` (574 l),
  `CreateTrialWizardModal.tsx` (557 l). God files C8 tous découpés.

## 2. Architecture React (lazy par section depuis perf/lazy-sections)

```text
src/main.tsx → src/App.tsx — TRIALS eager, 4 sections + wizard en React.lazy (entrée 7,8 kB)
  TRIALS → TrialDashboard → TrialDetailView (9 onglets, 07 supprimé : PR #28)
    01 Identification / 02 Lots & Échantillons / 03 Protocole / 04 Calendrier /
    05 Étapes / 06 Mesures (bench/ : topbar, grille, calculs, 5 formulaires) /
    PHOTO Photothèque (phototheque/ : 7 vues, jalons actifs uniquement) /
    08 Résultats (7 sous-vues) / 09 Journal d'audit
  UX_TESTS → UXTestsSuite.tsx (64 tests, dynamique)
  SCIENTIFIC_TESTS → ScientificTestsViewer.tsx (44 tests, dynamique)
  SANDBOX → ScientificCalculatorSandbox.tsx
  RULESET → ScientificRuleSetView.tsx
  Wizard → CreateTrialWizardModal.tsx + wizard/ (7 fichiers d'étape, 04 masquée : flux 01-02-03-05-06-07)
```

- État : `useState` local + singleton `globalTrialStore` (façade `services/trialStore.ts`).
- Pas de routeur, pas de librairie d'état externe, pas de backend.

## 3. Services (façade, depuis refactor/split-trialstore)

```text
services/trialStore.ts (façade, 12 l — API stable à 8 symboles, point d'import unique)
  ├── trialIds.ts — generateUUID
  ├── trialIntegrity.ts — IntegrityViolationError + gardes Gate 3.1
  ├── trialStages.ts — generateStandardExposureStages (T0 + 12×168 h)
  ├── trialSeed.ts — createDemoTrial + createValidationTrial + seed
  └── trialStoreService.ts — TrialStoreService (persistance localStorage, CRUD, photos, rapports)
services/reportGenerator.ts + exportService.ts (inchangés)
```

Cycle historique `reportGenerator ↔ trialStore` cassé (`reportGenerator` → `trialIds`).

## 4. Modèle de données

- `src/types/trial.ts` : `Trial { metadata, commonCharacteristics, status, configurationStatus,
  config, scheduleConfig, stages[], batches[], acquisitions{}, auditTrail[], mediaReferences[], reports? }`.
- Lots → 4 `PanelDefinition` (T + E1/E2/E3). `INACTIVE` = cycle conservé, exclu du plan.
- `WoodGrainOrientation` / `ExposureFace` : listes contrôlées strictes (plus de `| string`) ;
  wizard : whitelist à la frontière (`CreateTrialWizardModal`, fix/scripts-typing).
- `src/types/scientific.ts` (5 niveaux), `src/types/analysis.ts` (6 niveaux, `NON_EVALUEE` par défaut).

## 5. Moteurs scientifiques (purs, versionnés 1.2.0 — inchangés par les refactors)

Couleur CIE 1976 (6.3.2), Brillance 2×2 60° + rétention (6.3.3/ISO 2813), Persoz (ISO 1522),
Adhérence 0-5 + délai 168 h (ISO 2409:2020), Observations (ISO 4628) ; socle `statistics.ts`
(n-1 par défaut), `validity.ts` (SUSPECT conservé), `recalculator.ts` (RAW→COMPUTED, réf T0),
`ruleSet.ts` (origines NORMATIVE/LAB/METRO/ADAPTATION). Règles : ADHESION T0+C12,
`getActiveStages` (INACTIVE exclu, aussi appliqué à photothèque/chronologie/matrice/modal),
T exclu des moyennes.

## 6. Persistance, exports

- `localStorage` clé `quv_lab_trials_v2_2` (choix assumé, `07_KNOWN_LIMITATIONS.md`) ;
  seed démo + validation ; photos démo SVG vs consigne prod serveur.
- Exports : Blob texte/JSON + `window.print()` (pas de CSV/XLSX/PDF réel).

## 7. Tests & CI

- `run_tests.ts` : 12 suites, **195 tests** (44+7+30+12+6+23+9+12+11+18+8+15), intitulés corrigés.
- CI (`.github/workflows/ci.yml`) : `npm ci` + `tsc` + `npm test` + `vite build`, branches
  `main/develop/*`, protections PR + checks sur `main` et `develop`.
- Labels UI dynamiques (64/44). `test-results.txt` sorti du versionnement (la CI fait foi).

## 8. Build (chunks, sans cycle depuis fix N1)

Entrée 8 kB ; vendors (`react-vendor` 194, `charts` 312, `vendor`, `icons`) ;
applicatif (`quv-tabs` 106, `quv-shell` 110, `quv-results` 92, `quv-services` 72,
`quv-science` 36, `quv-photo` 42, `quv-wizard` 37, `quv-bench` 27, `quv-tests` 24) ;
lazy par section. Max 312 kB, 0 warning circulaire (règle : couches basses services/science
dédiées, suites de tests isolées — voir audit N1).

## 9. Cible atteinte (mise à jour)

GitHub source de vérité + `main` (releases taguées) / `develop` (intégration) + CI stricte +
`docs/` versionnées + workflow multi-agents (`docs/agents/`) : **en place et éprouvé (PR #2→#23)**.
Restes connus : formulaires Tab06 extraits (save au parent — retypage `computed as any` ouvert),
lazy d'onglets, vérifs visuelles humaines par ticket UI.
