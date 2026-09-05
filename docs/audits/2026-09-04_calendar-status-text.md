# AUDIT — fix/calendar-status-text (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/fix-calendar-status-text.md` (bug remonté : contradiction validée/terminées).
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK.

## Diff (`Tab04Calendar.tsx` seul, affichage)

- `planStatusText` : active → nom (inchangé) ; tout le plan validé → « Toutes étapes terminées » ;
  sinon → « Prochaine étape : X » (1er jalon mesuré non validé). Fini le faux « terminées ».

## Contrôles

- [x] Aucune logique métier/store touchée.
- [~] Vérif visuelle : cas T0-seul-validé et tout-validé.

## Verdict : conforme → branche `fix/calendar-status-text`, PR vers `develop`, merge après CI verte.
