# AUDIT — refactor/split-photographs (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/refactor-split-photographs.md` (règle JSX seul déplacé).
> Vérifié : `tsc --noEmit` (strict) 0 erreur après chacune des 7 extractions,
> `npm test` 195/195, `vite build` OK, `clean` OK.

## Diff

- `trial-tabs/TabPhotographs.tsx` 1599 → 431 l (état, memos, 7 handlers, composition).
- `phototheque/` : `photoTypes` (16), `PhotoModeSwitcher` (148), `PhotoTimelineView` (333),
  `PhotoCompareView` (284), `PhotoMatrixView` (114), `PhotoGalleryView` (217),
  `PhotoAddModal` (214), `PhotoLightbox` (116). Déplacements byte-exact (script) sauf
  renommages mécaniques `handle*/set*` → props `on*`/`onSet*` et setters passés directement.
- Chemin public inchangé (`TrialDetailView` → `./trial-tabs/TabPhotographs`).
- Seuls écarts volontaires vs verbatim : `compareCount`, `activeSpecimen`/`firstStageId`
  (données en props, logique du bouton Nouveau Cliché conservée), setters galerie/modal
  passés tels quels, `media` non-nul en lightbox (condition parente gardée).

## Contrôles

- [x] Aucun `useState`/`useMemo`/handler déplacé ou dupliqué ; aucune condition/tri/calcul modifié.
- [x] `tsc` strict : toute prop manquante aurait échoué (garde-fou principal pour ce ticket UI).
- [x] 195/195 (non régressif par construction ; les tests ne couvrent pas l'UI).
- [x] Imports lucide restants dans le parent (ex. inutilisés potentiels) : `tsc` vert
  (`noUnusedLocals` off) — micro-nettoyage optionnel ultérieur.
- [~] **Vérif visuelle obligatoire** côté humain (`npm run dev`/`preview`) : 4 modes + modal + lightbox.

## Verdict : conforme sous réserve de la vérif visuelle → branche `refactor/split-photographs`,
PR vers `develop`, merge après CI verte + check visuel humain.
