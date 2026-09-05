# AUDIT — fix/photo-active-stages (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/fix-photo-active-stages.md` (demande utilisateur).
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK, `clean` OK.

## Diff (3 vues phototheque, même pattern)

- `PhotoTimelineView` : boucle + compteur sur `getActiveStages(trial.stages)` (useMemo).
- `PhotoMatrixView` : en-tête + colonnes sur jalons actifs.
- `PhotoAddModal` : select jalon sur jalons actifs (plus de création vers INACTIVE).
- Source de vérité unique : `panelUtils.getActiveStages` (`status !== 'INACTIVE'`), identique à Tab06.

## Contrôles

- [x] Aucun modèle/store/calcul/normatif touché. Galerie (filtre) et comparateur inchangés (hors périmètre).
- [x] Photos préexistantes sur jalon INACTIVE : masquées chrono/matrice, visibles galerie, 0 suppression.
- [~] Vérif visuelle humaine requise : avec plan restreint (ex. T0+C12), chrono/matrice = 2 jalons.

## Verdict : conforme → branche `fix/photo-active-stages`, PR vers `develop`, merge après CI verte.
