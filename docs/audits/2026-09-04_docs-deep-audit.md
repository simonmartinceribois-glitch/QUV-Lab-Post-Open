# AUDIT — docs deep audit (2026-09-04, Auditor, READ ONLY sur `src/`)

> Demande : audit en profondeur des fichiers `docs/` (88 fichiers). Méthode : inventaire
> complet, recherche de références périmées (comptes, lignes, fichiers supprimés),
> vérification des tailles et du manifest contre le réel.

## Constats corrigés

| # | Fichier | Stale trouvé | Correction |
|---|---|---|---|
| D1 | `agents/AGENTS.md:35,37` | « 193 tests », consigne `test-results.txt`, labels « 20/22 » | 195, intitulés dynamiques |
| D2 | `agents/AGENTS.md:4` | « à initialiser : aucun `.git` » | repo + protections réels |
| D3 | `agents/WORKFLOW.md:22,34` | « 193 tests », consigne `test-results.txt`, exemple 20/22 | 195, CI fait foi, exemple neutre |
| D4 | `decisions/DECISIONS.md:90` | « 193 tests » | 195 |
| D5 | `architecture/ARCHITECTURE.md:23,25-27,32` | « 10 onglets » + 07 listé, « 06 Paillasse », wizard « 7 steps » | 9 onglets, 06 Mesures, 04 masquée |
| D6 | tailles annoncées | — | vérifiées conformes (UXTests 1346, service 1106, seed 1013, Tab06 574, wizard parent 557) |
| D7 | manifest | — | conforme (1.5.0, 195, buildDate) |

## Volontairement intacts

- `INITIAL_AUDIT.md` et specs/audits par ticket : archives horodatées (ne pas réécrire l'historique),
  y compris leurs nombres d'origine et la spec `split-wizard` (7 fichiers d'étape — le flux,
  lui, est documenté en ARCHITECTURE v2).
- Références `Tab07QualityControl` restantes : uniquement dans les docs du ticket de suppression.

## Verdict : conforme → branche `docs/deep-audit`, PR vers `develop`, merge après CI verte.
