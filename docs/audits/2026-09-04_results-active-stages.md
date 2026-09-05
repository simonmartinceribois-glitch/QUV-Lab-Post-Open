# AUDIT — fix/results-active-stages (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/fix-results-active-stages.md` (demande utilisateur).
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK sans warning, `clean` OK.

## Diff (4 fichiers, affichage seul)

- `TrialDetailView.tsx:60` : label `06 Paillasse / Saisie` → `06 Mesures`.
- `ResultsGlobalView` : cartes + colonnes + `colSpan` sur `getActiveStages` ; titre dynamique
  (« Chronologie des N Étapes ») ; compteurs d'essai inchangés (stats factuelles).
- `ResultsTemporalComparisonView` : 2 selects sur jalons actifs + repli d'affichage si sélection
  hors plan (état non muté). Référence T0 (toujours active) préservée.
- `ResultsPanelAnalysisView` L244 : condition INACTIVE ajoutée au filtre existant.
  Bloc RAW L404 et `ResultsFamilyAnalysisView`/`Batch`/`Advanced` : inchangés (déjà conformes ou traçabilité).

## Contrôles

- [x] Aucun modèle/store/calcul/normatif touché. Source unique `getActiveStages` (même que Tab06).
- [x] 195/195 ; build sans warning.
- [~] Vérif visuelle humaine : plan restreint → chrono/tableau/comparateurs = actifs uniquement.

## Verdict : conforme → branche `fix/results-active-stages`, PR vers `develop`, merge après CI verte.
