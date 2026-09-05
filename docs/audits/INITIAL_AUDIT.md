# QUV-Lab — AUDIT INITIAL (2026-09-04, READ ONLY sur `src/`)

## 1. Périmètre

Copie `quv-lab-main/` (ZIP, sans `.git`). 15 points couverts : structure, React, types, état,
persistance, calculs, normatif, exports, tests, scripts, Git, parallèles/orphelins, dépendances,
régressions, intégration OpenCode. Détail architecture : voir `docs/architecture/ARCHITECTURE.md`.

## 2. Constats majeurs

| # | Constat | Preuve | Risque |
|---|---|---|---|
| C1 | ~~Gate 2.2 : 3 échecs~~ **RÉVISÉ le 2026-09-04** : la CI GitHub sur `e44914c` donne Gate 2.2 = 7/7 et **195/195 au vert**. Les 3 échecs venaient d'un `test-results.txt` obsolète (état de code antérieur). Cœur métier T/jalons **conforme dans le code actuel**. | `test-results.txt` vs log CI | — levé, voir C1bis |
| C1bis (nouveau) | `test-results.txt` committé = artefact obsolète et trompeur (4/7 vs 195/195 CI). Risque de décision sur de fausses données. Recommandation : régénérer via `npm test` local ou sortir du versionnement (la CI fait foi). | `test-results.txt` | MED — confusion |
| C2 | ~~Manifest 151/151 obsolète~~ **RÉSOLU le 2026-09-04** : manifest régénéré (195/195, GATE 5.4, `strict:true`) + synthèse 02 (lignes 52/53/54) + guide 04 (195 tests). | `docs/release/08_RELEASE_MANIFEST.json`, `02_QUALIFICATION_SUMMARY.md`, `04_DEPLOYMENT_GUIDE.md` | — clos |
| C3 | Pas de Git/CI, pas de source de vérité | `Test-Path .git` = False | HIGH — bloque multi-agents |
| C4 | Labels UI "20/22" faux vs 193 tests réels ; viewer UI = 1/12 suites | `App.tsx:91-104`, `ScientificTestsViewer.tsx:2` | MED — confiance |
| C5 | Typage permissif (`| string`, pas de `strict`) | `trial.ts:43-70`, `tsconfig.json` | MED — données |
| C6 | Scripts : `lint`=tsc, `build` sans tsc, `clean` non-Windows | `package.json:6-13` | MED — dérive silencieuse |
| C7 | Dépendances mortes `express/dotenv/@google/genai` (0 usage `src/`) | grep `src/` | MED — attaque/poids |
| C8 | God files (trialStore 2226 l, TabPhotographs 1488 l, Wizard 1464 l, Tab06 1246 l) | mesures `src/` | MED — régression |
| C9 | Persistance `localStorage` fragile + seed démo en prod | `trialStore.ts:1352-1382`, `07_KNOWN_LIMITATIONS.md` | HIGH — perte/confusion |
| C10 | Photos démo SVG vs consigne serveur labo | `trialStore.ts:704-705` | LOW — écart démo/prod |

## 3. Points conformes

Moteurs purs/déterministes versionnés 1.2.0, RAW immuable (SUSPECT conservé), référentiel découplé
avec origines de règles, pipeline T0, 5 niveaux + 6 niveaux d'analyse, conclusion `NON_EVALUEE` par défaut,
ADHESION T0+C12, T0/C12 verrouillés, INACTIVE exclu des actifs, 12 suites de tests lançables via `tsx`,
store éphémère isolé, `docs/release/` (procédures, limitations assumées).

## 4. Architecture cible / écarts / plan

Cible : repo GitHub + CI (tsc + 195 tests + build) + docs versionnées + workflow
`docs/agents/WORKFLOW.md`. Écarts : §2 C1bis-C9. Plan révisé : (1) ~~corriger Gate 2.2~~ **annulé**
(vert en CI) → remplacer par : traiter l'artefact `test-results.txt` + régénérer le manifest
(LOW/MEDIUM) ; (2) repo + CI ✔ fait (`e44914c`, `29edcda`) ; (3) durcir scripts/typage ;
(4) transparence tests UI ; (5) élaguer dépendances ; (6) découper god files.
Prochain ticket conseillé : `fix/test-transparency` (labels UI + intitulés `run_tests.ts` + sort du `test-results.txt`).
Aucune refonte engagée — cet audit + `docs/` sont l'étape 1.
