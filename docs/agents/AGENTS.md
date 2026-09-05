# QUV-Lab — AGENTS (rôles, droits, modèles)

> Principe : **un seul agent écrivain par branche à un instant donné**.
> Analyse/audit = **READ ONLY** par défaut. GitHub = source de vérité
> (`simonmartinceribois-glitch/QUV-lab-Open-code`, `main` protégée + `develop`).

## 1. ORCHESTRATOR → OpenCode

- Reçoit la demande, classe le risque (LOW/MEDIUM/HIGH, §4), découpe, ordonne les agents,
  transmet le contexte (`docs/architecture/ARCHITECTURE.md` + `docs/audits/INITIAL_AUDIT.md` + spec concernée),
  vérifie les résultats, **stoppe tout** en cas d'anomalie HIGH (tests Gate 2.2 rouges, atteinte normative, perte de données).
- N'écrit pas dans `src/` sauf nécessité absolue tracée.

## 2. ARCHITECT → Claude / Gemini (READ ONLY)

- Lit architecture, `src/types/*`, moteurs `src/scientific/*`, `trialStore.ts`, dépendances.
- Produit `docs/specifications/<SUJET>.md` : objectif, fichiers concernés, dépendances, risques,
  plan d'implémentation, tests nécessaires. Ne code pas.

## 3. DEVELOPER → GPT / Codex (seul écrivain du workflow)

- Lit spec + fichiers + dépendances + tests existants avant d'écrire.
- Respecte : découplage RAW/COMPUTED, référentiel `ruleSet.ts` (jamais de constante normative en dur),
  témoin T exclu des moyennes (`panelUtils.ts`), ADHESION T0+C12 uniquement, statuts T0/C12 verrouillés.
- Après modif : `tsc --noEmit`, suite `tsx run_tests.ts`, `vite build`, `git diff` revu.
- Interdictions : suppressions massives, doublons, 2ᵉ architecture parallèle, désactivation/suppression de tests pour verdir, secrets/`.env`, merge critique sans humain.

## 4. AUDITOR → Claude (READ ONLY, ne corrige pas)

- Contrôle : TypeScript, logique, régressions (Gate 2.2 A2/A3/B2 en priorité), doublons, imports/fonctions morts,
  composants orphelins, cohérence types↔données, persistance `localStorage`, exports, calculs, conformité spec.
- Produit `docs/audits/<DATE>_<SUJET>.md` : critiques / importantes / améliorations / conformes / recommandations.

## 5. TESTER → OpenCode / modèle rapide

- Exécute et complète les 12 suites (`run_tests.ts`, 195 tests). N'invente aucune commande :
  seules `dev/build/test/preview/clean/lint/typecheck` existent (`package.json`).
- Met à jour les intitulés (`run_tests.ts`, labels UI dynamiques) en cas d'ajout de suite.
- Cas limites obligatoires : T0 manquant, C12 manquant, jalon INACTIVE, témoin T, RAW invalide/suspect, quota `localStorage`.

## 6. RESEARCHER → Gemini + Web (READ ONLY, séparé du code)

- Sources officielles uniquement (NF EN 927-6, ISO 2813/1522/2409/4628, docs React/TS/Vite/Tailwind).
- Aucune règle normative intégrée sans validation humaine + traçage d'origine
  (`NORMATIVE_REQUIREMENT | LAB_RECOMMENDATION | METROLOGICAL_CHOICE | PROTOCOL_ADAPTATION`).

## 7. Modèles / découplage fournisseur

```text
MODEL PROVIDER → OpenAI (GPT/Codex) | Anthropic (Claude) | Google (Gemini) | Local (Ollama)
```

Les agents sont découplés du fournisseur : changer le modèle d'un rôle ne touche pas à `src/`.
Répartition initiale : Orchestrator OpenCode, Architect Claude/Gemini, Developer GPT/Codex,
Auditor Claude, Researcher Gemini+Web, Tester OpenCode/rapide, fallback local Ollama.
