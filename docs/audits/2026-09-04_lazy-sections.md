# AUDIT — perf/lazy-sections (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/perf-lazy-sections.md`.
> Vérifié : `typecheck` 0 erreur, `npm test` 195/195, `build` OK, `clean` OK.

## Diff (`src/App.tsx` seul)

- 5 sections secondaires + wizard en `React.lazy` (adaptateur `default`, exports nommés) ;
  `TRIALS` eager ; 1 fallback `SectionFallback` partagé sous 5 `<Suspense>`.
- Aucune logique touchée ; changement assumé : bref fallback à la 1re navigation.

## Avant / après (build)

- Avant : entrée `index` 542 kB (après chunk-split) / 1 139 kB (origine).
- Après : entrée `index` **7,81 kB** (+ `react-vendor` 194, `vendor` 64, `icons` 25 partagés) ;
  sections en chunks à la demande (max 312 kB `charts`). 0 warning.

## Contrôles

- [x] Pas de lazy d'onglets, pas de preload, `server`/`alias` intacts.
- [~] Vérif visuelle humaine : les 5 sections + wizard (fallback bref OK, 0 écran blanc).

## Verdict : conforme → branche `perf/lazy-sections`, PR vers `develop`, merge après CI verte.
