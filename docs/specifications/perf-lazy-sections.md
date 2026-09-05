# SPEC — perf/lazy-sections (LOW/MEDIUM, base `develop`)

> Objectif : vrai gain au chargement initial (le chunk-split ne faisait que redistribuer).
> Changement assumé : bref fallback de chargement à la 1re navigation (Suspense).

## 1. Modifications (`src/App.tsx` seul)

- `React.lazy` (+ adaptateur `{ default: m.X }`, exports nommés) pour :
  `UXTestsSuite`, `ScientificTestsViewer`, `ScientificCalculatorSandbox`,
  `ScientificRuleSetView`, `CreateTrialWizardModal`.
- `TRIALS` (Dashboard + TrialDetailView) reste eager (section par défaut).
- Un `<Suspense fallback={…}>` par point d'usage (sections + modal), fallback léger
  (« Chargement… », mêmes classes, aucun spinner exotique).

## 2. Interdictions

Aucune logique touchée, aucun onglet paresseux (sections seules), aucun préchargement
anticipé (`preload` = ticket ultérieur si besoin).

## 3. Tests

`typecheck` (0), `npm test` (195/195), `build` : relever poids du chunk initial
(attendu : index ≈ 5 kB + vendors partagés, sections en chunks séparés) ;
vérif visuelle humaine : naviguer les 5 sections + ouvrir le wizard (fallback bref OK).
