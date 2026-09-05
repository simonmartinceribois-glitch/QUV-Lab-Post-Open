# SPEC — refactor/split-bench-forms (HIGH, base `develop`, plan validé « go »)

> Origine : formulaires Tab06 restants (plan HIGH validé par l'utilisateur avant dev).
> Règle : JSX des 5 formulaires déplacé, **état + sync + save intacts au parent**
> (`handleSaveCurrentPanel`, auto-advance, modal, `handleFastPrefill`).

## 1. Découpage (`components/bench/`)

| Fichier | Contenu | Props |
|---|---|---|
| `BenchColorForm` | table L*a*b* | `colorCount`, `colorReadings` + setter |
| `BenchGlossForm` | séries GU | `glossSeriesData` + setter |
| `BenchPersozForm` | répétitions s | `persozValues` + setter |
| `BenchAdhesionForm` | cadre ISO 2409 + classes + observations | batch/panel/stage, `isInitialStage`, classe + setter, observation + setter ; dérivés thickness/spacing/délai recalculés sur place depuis les mêmes props + `adhesionEngine` |
| `BenchObservationsForm` | cotations ISO 4628 | `observations` + setter |

Setters passés directement (`Dispatch<SetStateAction>`) : corps des `onChange` verbatim.
Parent final ≈ 574 l (sélection, sync effects, save, actions, modal, computed via BenchComputedPanel).

## 2. Interdictions

Aucun format `raw` modifié, auto-advance intact, gardes INACTIVE intactes, `isFinalCreateAllowed`
hors sujet, aucune condition modifiée.

## 3. Tests

`typecheck` (0 — garde-fou : toute prop manquante échoue), `npm test` (195/195),
`build` OK + **vérif visuelle humaine obligatoire** : saisie + enregistrement réel par famille.
