# SPEC — refactor/split-wizard (MEDIUM, base `develop`)

> Origine : audit C8 (CreateTrialWizardModal 1558 l). 7 steps (lignes ~418/513/662/842/897/1122/1353)
> + stepper + nav + `handleFinalCreate`. API publique : `CreateTrialWizardModal` (App) +
> `isFinalCreateAllowed` (test gate53) — les deux restent exportées depuis le module d'origine.

## 1. Règle : état au parent, JSX des steps déplacé

Tous les `useState`, dérivés (`isStep1Valid`…), `handleFinalCreate`, nav restent dans
`CreateTrialWizardModal.tsx`. Chaque step reçoit valeurs + setters (`Dispatch<SetStateAction>`)
+ données dérivées nécessaires. `isFinalCreateAllowed` reste définie/exportée dans le module
d'origine (logique pure partagée avec les tests — ne pas déplacer).

## 2. Découpage (`components/wizard/`)

| Fichier | Contenu |
|---|---|
| `wizardTypes.ts` | types partagés des props (champs par étape) |
| `WizardStep1Identification.tsx` … `WizardStep7Review.tsx` | JSX de chaque step |
| `WizardStepper.tsx` | stepper + header (optionnel si simple : garder au parent si < 40 l) |

Parent final ≈ 500 l (état, validation, création, nav, modal). Import public inchangé
(`App.tsx` → `./components/CreateTrialWizardModal`).

## 3. Interdictions

Aucune logique de validation/création déplacée, aucune condition modifiée,
`isFinalCreateAllowed` intacte (tests gate53 en dépendent).

## 4. Tests

`typecheck` (0), `npm test` (195/195, dont gate53 créateur), `build` OK + vérif visuelle
humaine (parcours 7 étapes + création).
