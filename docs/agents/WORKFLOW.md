# QUV-Lab — WORKFLOW (PLANIFIER → MERGER)

## 1. Chaîne canonique

```text
ANALYSE → PLAN → VALIDATION PLAN (si MEDIUM/HIGH) → BRANCHE → DÉVELOPPEMENT →
TEST → AUDIT → CORRECTION → SECOND TEST → PULL REQUEST → VALIDATION HUMAINE → MERGE
```

Jamais de dev direct sur `main`. Branches : `main / develop / feature/* / fix/* / refactor/* / audit/*`.

## 2. Étapes (QUV-Lab)

1. **ANALYSE (READ ONLY)** : lire `docs/architecture/ARCHITECTURE.md`, `docs/audits/INITIAL_AUDIT.md`,
   `src/types/*`, moteurs et onglets concernés, état Git. Ne rien modifier.
2. **PLAN** : objectif, fichiers concernés, dépendances, risques, plan d'implémentation, tests nécessaires
   → `docs/specifications/<SUJET>.md`.
3. **VALIDATION PLAN** : obligatoire si HIGH (données, calculs, persistance, exports, normatif).
4. **BRANCHE** : `fix/gate22-temoin-jalons`, `fix/scripts-windows`, `refactor/trialstore-split`, etc.
5. **DÉVELOPPEMENT** : Developer seul écrivain, périmètre strict de la spec.
6. **TEST** : commandes réelles uniquement — `npm run lint` (= `tsc --noEmit`), `npm test` (= `tsx run_tests.ts`),
   `npm run build`. Référence : 195 tests / 12 suites (la CI fait foi, pas de fichier de résultats committé).
7. **AUDIT** : Auditor produit `docs/audits/<DATE>_<SUJET>.md`.
8. **CORRECTION** : Developer corrige ; jamais de test supprimé/désactivé pour verdir.
9. **SECOND TEST** : rejouer l'intégralité + build.
10. **PR** : objectif, modifications, fichiers principaux, résultats tests, limites éventuelles.
11. **VALIDATION HUMAINE + MERGE** : obligatoire pour tout HIGH.
12. **NETTOYAGE (après merge effectif uniquement)** : ne jamais supprimer une branche
    (locale ou distante) avant que le merge soit visible sur GitHub (incident PR #2, 2026-09-04 :
    branche supprimée avant merge → restaurée via reflog, aucune perte).

## 3. Niveaux de risque

- **LOW** (typo, label UI, ex. renommer un libellé d'onglet dans `TrialDetailView.tsx`) :
  `Developer → tests → PR`.
- **MEDIUM** (nouveau composant/fonction, logique existante, ex. split `TabPhotographs.tsx`, exports CSV) :
  `Architect → Developer → Tester → Auditor → PR`.
- **HIGH** (modèle de données, calcul scientifique, persistance, exports normatifs, migration, Gate 2.2 A2/A3/B2) :
  `Architect → validation humaine → Developer → Tester → Auditor → 2ᵉ audit si besoin → PR → validation humaine → merge`.

## 4. Tickets issus de l'audit — état (N4, clos le 2026-09-04)

1. ~~`fix/gate22-temoin-jalons`~~ — **annulé** : 7/7 verts en CI (artefact obsolète, C1bis).
2. ~~`fix/scripts-typing`~~ — **mergé** (PR #7) : `strict:true`, listes contrôlées, scripts cross-platform.
3. ~~`fix/test-transparency`~~ — **mergé** (PR #2) : labels 64/44 dynamiques, intitulés 23/11.
4. ~~`refactor/prune-deps`~~ — **mergé** (PR #8) : −121 paquets.
5. ~~`refactor/trialstore-split`~~ — **mergé** (PR #11) : 6 modules à façade.
6. ~~Splits UI~~ — **mergés** (PR #15 photothèque, #17 bench, #18 wizard) ; formulaires bench (#23).
7. ~~Perf~~ — chunks < 500 kB (#14), lazy sections entrée 7,8 kB (#22), cycles build résolus (N1).
8. ~~Release docs~~ — manifest 195/195 (#5), D-00→D-07, releases v1.2.0/v1.3.0/v1.4.0 taguées.

Nouveaux tickets : ouvrir une section §5 ci-dessous (ne pas réécrire l'historique ci-dessus).
