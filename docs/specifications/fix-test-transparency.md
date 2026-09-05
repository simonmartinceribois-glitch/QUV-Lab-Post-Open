# SPEC — fix/test-transparency (LOW/MEDIUM, aucun normatif)

> Origine : audit C1bis/C4 + D-03. CI de référence : 195/195 sur `e44914c`.
> Objectif : les nombres affichés = les nombres réels. Aucune logique métier touchée.

## 1. Comptes vérifiés (sources)

| Suite / affichage | Annoncé | Réel vérifié | Preuve |
|---|---|---|---|
| Nav `App.tsx` "Tests UX (20)" | 20 | **64** | `UXTestsSuite.tsx` : `uxTestCases` ids 1–64 uniques |
| Nav `App.tsx` "Tests Calculs (22)" | 22 | **44** | `scientificEngine.test.ts` + CI 44/44 |
| `ScientificTestsViewer` titre "22 Tests" | 22 | **44** | idem (résumé déjà dynamique `summary.passed/total`) |
| `ScientificTestsViewer` filtre "Tous les tests (22)" | 22 | **44** | `testOutput.results.length` |
| `run_tests.ts` suite 6 Gate 3.3 "(20 TESTS)" | 20 | **23** | 23 `record(` + CI 23/23 |
| `run_tests.ts` suite 9 Gate 5.0 "(12 TESTS)" | 12 | **11** | 11 appels (ligne 46 = définition `function record(`) + CI 11/11 |
| Autres suites (44/7/30/12/6/9/12/18/8/15) | OK | OK | conformes CI, total **195** |

## 2. Modifications (Developer, périmètre strict)

1. `src/App.tsx:91-104` : `Tests UX (20)` → `Tests UX (64)`, `Tests Calculs (22)` → `Tests Calculs (44)`.
2. `src/components/ScientificTestsViewer.tsx:38` : titre → total dynamique
   (`{testOutput.summary.total}`) au lieu de "22" en dur.
3. `ScientificTestsViewer.tsx:76` : filtre → `` `Tous les tests (${testOutput.results.length})` ``.
4. `run_tests.ts` : suite 6 "(20 TESTS)" → "(23 TESTS)", suite 9 "(12 TESTS)" → "(11 TESTS)".
5. `test-results.txt` : **supprimer du versionnement + ajouter à `.gitignore`**
   (artefact généré obsolète, C1bis ; la CI fait foi). Fichier local régénérable via `npm test`.

## 3. Hors périmètre (interdit sur ce ticket)

Moteurs `scientific/*`, `types/*`, `trialStore.ts`, manifest release, exports CSV,
dépendances, `strict:true`. Tout écart trouvé → nouveau ticket.

## 4. Tests nécessaires (Tester)

`npm run lint` (tsc), `npm test` (195/195 attendu, total auto-calculé ligne 180-192),
`npm run build`. Vérifier visuellement : nav affiche 64/44, viewer affiche 44/44 dynamiques.
