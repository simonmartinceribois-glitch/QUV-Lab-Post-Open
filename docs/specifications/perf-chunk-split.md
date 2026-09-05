# SPEC — perf/chunk-split (LOW, base `develop`)

> Origine : warning Vite (chunk 1 139 kB > 500 kB). Référence avant : `index-*.js` 1 139,69 kB (gzip 294 kB).
> Objectif : aucun chunk > 500 kB minifié, **0 changement de comportement** (pas de `lazy`/`Suspense`
> dans ce ticket — le découpage par routes viendra après, car il modifie les états de chargement).

## 1. Modification unique : `vite.config.ts`

Ajouter `build.rollupOptions.output.manualChunks` (forme fonction) :

- `react-vendor` : `react`, `react-dom`, `scheduler`
- `charts` : `recharts` (+ dépendances d3 qu'il tire)
- `motion` : `motion`
- `icons` : `lucide-react`
- défaut : code applicatif (`index`)

Ne pas toucher `chunkSizeWarningLimit` (le warning reste un signal), ne pas toucher `server`/`alias`.

## 2. Hors périmètre

Lazy-loading des onglets/sections, préchargement, PWA, analyse visuelle (`rollup-plugin-visualizer`).

## 3. Tests (Tester)

`npm run build` : relever tailles (avant/après), objectif 0 chunk > 500 kB ;
`npm run typecheck` (0) ; `npm test` (195/195) — le découpage ne doit rien changer aux tests.
Vérif humaine `npm run dev`/`preview` : navigation entre les 5 sections OK.
