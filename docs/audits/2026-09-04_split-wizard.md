# AUDIT — refactor/split-wizard (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/refactor-split-wizard.md` (état au parent, JSX déplacé).
> Vérifié : `tsc --noEmit` (strict) 0 erreur après chaque extraction (1-2, 3-4, 5-7),
> `npm test` 195/195 (dont gate53 `isFinalCreateAllowed`), `build` OK, `clean` OK.

## Diff

- `CreateTrialWizardModal.tsx` 1558 → 557 l (état, validation, `handleFinalCreate`, nav, stepper,
  `isFinalCreateAllowed` conservés et exportés depuis le module d'origine).
- `wizard/` : types (16), step1 (118), step2 (190), step3 (185), step4 (62), step5 (267),
  step6 (239), step7 (178). Déplacements byte-exact (script) sauf renommages mécaniques
  `set*` → props `on*` (setters passés directement) ; `as any` du select dimUnit conservé verbatim.
- Import public inchangé (`App.tsx`) ; `isFinalCreateAllowed` intacte (tests gate53 verts).

## Contrôles

- [x] Aucune logique de validation/création déplacée ; aucune condition modifiée.
- [x] 195/195 ; chemins d'import stables.
- [~] Vérif visuelle humaine : parcours complet 7 étapes + création d'un essai de test.

## Verdict : conforme → branche `refactor/split-wizard`, PR vers `develop`, merge après CI verte.
