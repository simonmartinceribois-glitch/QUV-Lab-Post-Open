# AUDIT — fix/batch-thickness (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/fix-batch-thickness.md` (bug remonté utilisateur).
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK, `clean` OK.

## Diff (`Tab02LotsPanels.tsx` seul)

- Cause : verrou binaire (`isLocked`) figeant l'input même si épaisseur manquante → impasse.
- Correctif : saisie autorisée si verrouillé MAIS sans adhérence mesurée pour le lot
  (l'épaisseur ne sert qu'au quadrillage) + badge « Saisie tardive » ;
  sinon lecture seule + message « Verrouillée — adhérence déjà mesurée ».
- Traçabilité : événement `UPDATE_BATCH_THICKNESS` (`BATCH`, avant/après, opérateur) avant `saveTrial`.

## Contrôles

- [x] Aucun modèle/store/calcul touché. Garde normative préservée (adhérence mesurée = figé).
- [x] 195/195 ; build sans warning.
- [~] Vérif visuelle : lot verrouillé sans adhérence → input + badge ; avec adhérence → 🔒.

## Verdict : conforme → branche `fix/batch-thickness`, PR vers `develop`, merge après CI verte.
