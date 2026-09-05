# SPEC — refactor/prune-deps (MEDIUM, base `develop`)

> Origine : audit C7. Preuves Architect (2026-09-04) : pas de `server.js`, pas de `.env*`,
> aucun `import`/`require`/`import()` de ces paquets dans `*.{ts,tsx,html,js}`, aucun appel `/api/`,
> aucune lecture `process.env`/`API_KEY` dans `src/`. Résidus AI Studio d'un serveur jamais porté.

## 1. Suppressions (Developer)

```bash
npm uninstall express dotenv @google/genai @types/express
```

Effet : `package.json` (4 lignes) + `package-lock.json` recalculé. Gain attendu : ~120+ paquets
transitifs (chaîne express/genai) + suppression de surface d'attaque serveur.

## 2. Cohérence (même ticket, docs/config seules)

- `README.md:18` : consigne `GEMINI_API_KEY` / `.env.local` → remplacer par une note
  « QUV-Lab est 100 % local (localStorage), sans backend ni clé API ».
- `metadata.json:5` : `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` → tableau vide `[]`
  (aucun appel serveur n'existe).
- `package.json` `clean` : retirer `server.js` inexistant → ne nettoie que `dist/`.

## 3. Hors périmètre

Tailwind/vite/react/recharts/motion/lucide (utilisés), `strict`, manifest, découpages.

## 4. Tests (Tester)

`npm install` frais (lockfile), `npm run typecheck` (0), `npm test` (195/195),
`npm run build` (OK), `npm run clean` (OK). Vérifier `git status` : seuls
`package.json`, `package-lock.json`, `README.md`, `metadata.json` + spec/audit.
