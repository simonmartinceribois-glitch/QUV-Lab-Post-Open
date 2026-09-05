# QUV-Lab — DÉCISIONS (journal, ordre antichronologique)

## 2026-09-04 — D-10 : étape 4 panneaux illustrative, création figée à 4 (statu quo)

- **Constat** : l'étape 4 prévisualise `panelCount` panneaux (libellés P01…) mais
  `TrialStoreService.createTrial` fige toujours 4 éprouvettes (T/1/2/3, Gate 2.1/2.2).
  L'input `panelCount` (1-24, étape 3) est sans effet sur le modèle créé.
- **Décidé** : ne rien changer (option écart documenté). Rendre N effectif casserait le
  modèle normatif (ségrégation témoin, cinétiques, tests) ; figer à 4 reste possible plus tard.

## 2026-09-04 — D-09 : release v1.5.0 (lazy, bench-forms, ci-comment, audit-sync)

- **Contenu** : lazy-loading 5 sections (entrée 7,8 kB), formulaires Tab06 en 5 éditeurs
  (HIGH, visuel validé), `npm ci`, audit externe N1-N4 traité (chunks sans cycle,
  ARCHITECTURE v2). Aucune logique métier modifiée.
- **Preuves** : CI verte sur chaque PR (#21-24), 195/195 constants, builds sans warning.

## 2026-09-04 — D-08 : audit post-v1.4.0 (N1-N4) et resync architecture

- **N1 (cycles de chunks)** : résolu — couches `quv-services`/`quv-science`/`quv-tests` dédiées ;
  cause racine : services absorbés dans `quv-tabs` + suites de tests important le store.
  Build : 0 warning circulaire, max 312 kB.
- **N2** : `ARCHITECTURE.md` régénéré en v2 (état `develop` réel).
- **N3** : classé sans suite — déjà traité par PR #21 (l'auditeur avait un état antérieur).
- **N4** : listes `WORKFLOW.md` §4 et décisions clôturées/marqué(e)s au lieu d'être réécrites.

## 2026-09-04 — D-07 : release v1.4.0 (splits UI + jalons photo)

- **Contenu** : split Tab06 (1332→921 l, bench/), split CreateTrialWizard (1558→557 l,
  wizard/ 7 steps), split TabPhotographs (PR antérieure), photothèque limitée aux jalons
  actifs, chunks < 500 kB. Aucune logique métier modifiée (déplacements + whitelist/gardes).
- **Preuves** : `tsc --strict` 0 après chaque extraction, 195/195 constants, builds OK (PR #14-18).
- **Version** : manifest `1.3.0` → `1.4.0` (refactors internes + 1 évolution d'affichage mineure :
  jalons photo ; minor, pas major).

## 2026-09-04 — D-06 : release v1.3.0 (split-trialstore)

- **Contenu** : découpage `trialStore.ts` 2432 l → 6 modules à façade, API 8 symboles inchangée,
  cycle `reportGenerator` cassé, + D-05. Aucune logique modifiée (split byte-exact).
- **Preuves** : `tsc --strict` 0 erreur du 1er coup, 195/195, build OK (PR #11, CI verte).
- **Version** : manifest `1.2.0` → `1.3.0` (refactor interne sans changement fonctionnel : minor, pas major).

## 2026-09-04 — D-05 : release v1.2.0 (PR #9 develop → main, tag v1.2.0)

- **Contenu** : strict:true + `@types/react{,-dom}`, listes contrôlées (whitelist wizard,
  filtre « Validé » → COMPLETED), scripts cross-platform + `typecheck`, −121 paquets serveur morts,
  lockfile versionné, manifest/synthèse/guide 195/195 GATE 5.4, C1 levé, C2 clos.
- **Preuves** : CI verte sur chaque PR (#2, #7, #8, #9) ; `tsc --strict` 0 erreur ;
  `npm test` 195/195 en local et CI ; `vite build` OK.
- **Incidents absorbés sans perte** : nettoyage avant merge (PR #2, reflog), PR basées sur `main`
  au lieu de `develop` (#3, #5 → syncs #4, #6), ticket scripts-typing mergé nulle part puis
  ressuscité par cherry-pick (`e691af3` → `bc6d74b`, PR #7). Règle : vérifier base + merge + arbre.
- **État** : `main` @ `6c3d486` taguée `v1.2.0` ; `develop` alignée ; branches éphémères supprimées.

## 2026-09-04 — D-04 : branche `develop`, lockfile versionné, `main` protégée

- **Décidé** : `develop` créée depuis `main` (merge #2) comme branche d'intégration ;
  `main` = releases uniquement. `package-lock.json` (généré par `npm install` local, 253 packages)
  est désormais **versionné** (reproductibilité CI/dev, lève le report de D-01).
  Exception au workflow : premier commit de `develop` direct (initialisation, pas de dev).
- **À activer côté humain** (Settings → Branches → Add branch protection rule, motif `main`) :
  `Require a pull request before merging`, `Require status checks to pass` (sélectionner `verify`),
  `Do not allow bypassing the above settings`.
- **Leçon incident PR #2** : merge GitHub **avant** tout nettoyage local ; règle ajoutée à `WORKFLOW.md` §1.

## 2026-09-04 — D-03 : CI verte 195/195, audit corrigé, ticket Gate 2.2 annulé

- **Fait** : CI sur `e44914c` = `tsc` OK + **195/195 tests OK** (Gate 2.2 = 7/7) + build.
  Détail : suites 44/7/30/12/6/**23**/9/12/**11**/18/8/15 (intitulés `run_tests.ts` "20" et "12" à corriger).
- **Correction d'audit** : les 3 échecs Gate 2.2 venaient du `test-results.txt` committé (état de code
  antérieur). Constats C1/C2 révisés en C1bis (artefact trompeur) + manifest 151 à régénérer.
  Fichiers MAJ : `ARCHITECTURE.md` §6, `INITIAL_AUDIT.md` §2/§4.
- **Décidé** : ticket HIGH `fix/gate22-temoin-jalons` **annulé** (plus d'objet). Prochain ticket :
  `fix/test-transparency` (LOW/MEDIUM) — labels UI `App.tsx:91-104`, intitulés `run_tests.ts`,
  sort du `test-results.txt` (régénérer ou git-ignorer, la CI fait foi).
- **Aussi** : `ci.yml` passé à `actions/checkout@v5` + `setup-node@v5` (`29edcda`, warning Node 20 clos),
  Node app conservé à 20 (environnement qualifié du manifest).

## 2026-09-04 — D-02 : repo GitHub créé et poussé

- Commits `e44914c` (audit + CI) puis `29edcda` (actions v5) sur `audit/initial`, `main` créée au même point,
  poussés vers `simonmartinceribois-glitch/QUV-lab-Open-code` (public). CI déclenchée automatiquement.

## 2026-09-04 — D-01 : CI minimale sans lockfile, Git à installer

- **Contexte** : copie `quv-lab-main/` sans `.git`, sans `node_modules`, sans lockfile ;
  `git` introuvable sur le poste (`C:\Program Files\Git\*`, GitHub Desktop : absents).
- **Décidé** : CI `.github/workflows/ci.yml` (ubuntu, Node 20) avec `npm install`
  (pas `npm ci`, aucun lockfile), puis `npm run lint` (= `tsc --noEmit`), `npm test`
  (= `tsx run_tests.ts`, 195 tests), `npm run build`.
- **Conséquence assumée** : CI **rouge** tant que Gate 2.2 A2/A3/B2 non corrigés
  (voir `docs/audits/INITIAL_AUDIT.md` C1). C'est le comportement voulu : pas de vert artificiel.
- **À faire côté humain** : installer Git, `git init` + commit + push (commandes transmises à l'utilisateur).
- **Non-décidé / reporté** : génération d'un lockfile (`npm install` local, à committer) ;
  élagage `express/dotenv/@google/genai` ; `strict:true` — tickets dédiés, validation requise.

## 2026-09-04 — D-00 : Audit initial sans modification du code

- Audit read-only de `src/` ; seuls des fichiers `docs/` (+ `.github/`) ont été ajoutés.
  Aucune refonte engagée. Réf : `docs/audits/INITIAL_AUDIT.md`.
