# SPEC — refactor/split-bench (MEDIUM, base `develop`)

> Origine : audit C8 (Tab06MeasurementsBench 1332 l, stateful).
> Règle adaptée : formulaires + état + save **restent au parent** (entremêlés par famille) ;
> seuls les blocs d'affichage pur sont extraits : topbar + bandeau jalons + alerte (374-475),
> grille éprouvettes (~477-551), colonne calculs (~1038-1245). Modal de validation : reste
> (câblée aux handlers). Formulaires par famille (585-995) : ticket ultérieur dédié (HIGH).

## 1. Découpage (`components/bench/`)

| Fichier | Contenu | Props |
|---|---|---|
| `benchTypes.ts` | `PanelListItem`, `BenchTopBarData`, ré-exports de types | — |
| `BenchTopBar.tsx` | topbar famille + bandeau jalons + alerte INACTIVE | données calculées (step, labels), `trial`, `selectedFamilyId`, `currentStage`, `measuredStages`, `activePanelsList`, `onFamilyChange`, `onStageChange?`, `isStageInactive` |
| `BenchPanelGrid.tsx` | grille + compteurs | `trial`, `activePanelsList`, `selectedPanelId`, compteurs, `onSelectPanel` |
| `BenchComputedPanel.tsx` | qualité + grandeurs dérivées par famille | `computed: any` (tel quel, pas de retypage ici), `currentRecord`, `selectedFamilyId`, `isInitialStage` |

Parent : état, sync effects, save, formulaires, actions, modal. Import public inchangé
(`TrialDetailView` → `./trial-tabs/Tab06MeasurementsBench`).

## 2. Interdictions

Aucune logique de save/sync déplacée, aucun `useState`/`useEffect` déplacé, aucun retypage
du `computed as any` (ticket dédié), aucune condition modifiée.

## 3. Tests

`typecheck` (0), `npm test` (195/195), `build` OK + vérif visuelle humaine (paillasse :
sélecteurs, grille, cartes calculées).
