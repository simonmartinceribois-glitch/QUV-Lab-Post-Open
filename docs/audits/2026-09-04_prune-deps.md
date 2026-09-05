# AUDIT — refactor/prune-deps (2026-09-04, Auditor, READ ONLY)

> Spec : `docs/specifications/refactor-prune-deps.md`.
> Vérifié : `npm install` frais OK, `typecheck` 0 erreur, `npm test` 195/195,
> `vite build` OK, `npm run clean` Windows OK (`dist/` supprimé).

## Diff

- `package.json` : −4 dépendances (`express`, `dotenv`, `@google/genai`, `@types/express`),
  `clean` limité à `dist/`. **−121 paquets** transitifs.
- `package-lock.json` : recalculé.
- `README.md` : consigne `GEMINI_API_KEY` remplacée par note « 100 % local ».
- `metadata.json` : `majorCapabilities` vidé (aucun appel serveur réel).
- Preuves de 0 usage : pas de `server.js`, pas de `.env*`, aucun import statique/dynamique
  ni `/api/`/`process.env` dans `*.{ts,tsx,html,js}` (grep repo, 0 match hors docs/lock).

## Contrôles

- [x] Aucun `src/` touché (0 ligne métier). `recharts`/`motion` conservés (utilisés ou hors périmètre).
- [x] Comportement applicatif inchangé (paquets morts uniquement).

## Verdict : conforme → branche `refactor/prune-deps`, PR vers `develop`, merge après CI verte.
