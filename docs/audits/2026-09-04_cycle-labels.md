# AUDIT — fix/cycle-labels (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/fix-cycle-labels.md` (demande utilisateur).
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK sans warning.

## Diff (affichage seul, 13 fichiers)

- `panelUtils.ts` : helpers `cycleTag()` / `formatStageShort()` (tolérants `null`).
- Appliqués aux ~27 sites : photothèque (6), résultats (6 vues), paillasse (inchangée, déjà taguée),
  Tab05 (bouton + confirmation), Tab04 (inchangé, déjà tagué).
- Règle : heures nues → `C3 (504 h)` ; nom + heures → tag préfixé sans doublon ;
  exclus : formule `N × 168 h`, logs de tests.

## Contrôles

- [x] Aucune logique/store/calcul touchée. Valeurs `cycleIndex`/`scheduledExposureHours` intactes.
- [~] Vérif visuelle : repère C présent partout (jalons, selects, badges, lightbox, tableaux, graphes).

## Verdict : conforme → branche `fix/cycle-labels`, PR vers `develop`, merge après CI verte.
