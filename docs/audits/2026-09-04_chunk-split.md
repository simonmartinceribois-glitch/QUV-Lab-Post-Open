# AUDIT — perf/chunk-split (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/perf-chunk-split.md`.
> Vérifié : `vite build` OK, `typecheck` 0 erreur, `npm test` 195/195, `clean` OK.

## Diff (1 fichier : `vite.config.ts`)

`build.rollupOptions.output.manualChunks` : vendors (`react-vendor`, `charts`, `motion`,
`icons`, `vendor`) + applicatif (`quv-tabs`, `quv-results`, `quv-components`, `quv-analysis`).
Imports synchrones conservés : aucun `lazy`/`Suspense`, 0 changement de comportement.

## Avant / après (JS minifié)

- Avant : `index` 1 139,69 kB (warning > 500 kB).
- Après : `index` 5,25 kB, `charts` 312,56, `quv-tabs` 275,83, `react-vendor` 194,25,
  `quv-components` 168,55, `quv-results` 93,75, `vendor` 63,84, `icons` 25,26 kB.
- **0 chunk > 500 kB, warning disparu.** Total ≈ 1 139 kB (redistribution, pas de réduction) ;
  le gain réel (lazy par section) reste un ticket ultérieur.

## Contrôles

- [x] `server`/`alias` intacts. Aucun `src/` touché.
- [~] Vérif humaine `preview` : navigation 5 sections (non bloquant).

## Verdict : conforme → branche `perf/chunk-split`, PR vers `develop`, merge après CI verte.
