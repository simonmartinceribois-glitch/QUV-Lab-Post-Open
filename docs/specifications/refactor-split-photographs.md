# SPEC — refactor/split-photographs (MEDIUM, base `develop`)

> Origine : audit C8 (TabPhotographs 1599 l). Sections relevées : bannière+switcher 349-477,
> timeline 478-776, comparateur 777-1035, matrice 1036-1132, galerie 1133-1316,
> modal ajout/remplacement 1317-1489, lightbox 1490-1599. Logique (état/memos/handlers) : 70-348.

## 1. Règle d'or : JSX seul déplacé, logique immobile

Tout `useState`/`useMemo`/handler (`handleSelectSpecimen`, `handleFileSelected`,
`handleOpenAddModalForStage`, `handleSavePhoto`, `handleDeletePhoto`, `toggleComparePhoto`,
`handleLaunchCompareForSpecimen`) **reste dans `TabPhotographs.tsx`**.
Les nouveaux fichiers ne reçoivent que du JSX + interfaces de props. Aucune condition,
aucun tri, aucun calcul déplacé (même à l'identique) — si un `useMemo` sert une seule vue,
il reste au parent et son résultat passe en props.

## 2. Découpage prescrit (`components/phototheque/`)

| Fichier | Contenu (lignes source) | Props (état + handlers du parent) |
|---|---|---|
| `photoTypes.ts` | `PhotothequeViewMode` + types partagés (`PanelEntry`, sélections) | — |
| `PhotoModeSwitcher.tsx` | 349-477 (bannière, switcher, règles) | `viewMode`, `onSelectMode` |
| `PhotoTimelineView.tsx` | 478-776 | trial, maps, `activeBatchId/PanelId`, sélections, handlers nav/compare/add |
| `PhotoCompareView.tsx` | 777-1035 | `comparedPhotos`, `compareIntegrityCheck`, sélecteurs, handlers |
| `PhotoMatrixView.tsx` | 1036-1132 | trial, maps, navigation |
| `PhotoGalleryView.tsx` | 1133-1316 | `filteredGalleryPhotos`, maps, handlers |
| `PhotoAddModal.tsx` | 1317-1489 | état modal + `handleSavePhoto`, fermeture |
| `PhotoLightbox.tsx` | 1490-1599 | photo courante, historique, fermeture |

`TabPhotographs.tsx` final ≈ 400 l (imports, types, état, memos, handlers, composition).
Chemin d'import public inchangé : `TrialDetailView` importe toujours `./trial-tabs/TabPhotographs`.

## 3. Interdictions

Aucun renommage de handler/état, aucun `useMemo` déplacé, aucune extraction de sous-logique,
aucune modification visuelle/conditionnelle. Le diff JSX doit être un déplacement pur
(vérifiable par relecture : mêmes blocs, mêmes props effectives).

## 4. Tests (Tester)

`typecheck` (0 — garde-fou principal : toute prop manquante échoue ici),
`npm test` (195/195, non régressif par construction), `build` OK.
**Vérif visuelle obligatoire** côté humain (`npm run dev` ou `preview`) : les 4 modes +
modal + lightbox, car les 195 tests ne couvrent pas l'UI. Auditor : revue bloc à bloc du diff.
