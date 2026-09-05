# SPEC — fix/scripts-typing (MEDIUM, base `develop`)

> Origine : audit C5/C6 + WORKFLOW §4 ticket n°2. CI de référence : 195/195.
> Évaluation Architect : `tsc --strict` sans `@types/react` = 5427 lignes de bruit ;
> avec `@types/react` + `@types/react-dom` = **~29 erreurs réelles**, toutes locales.

## 1. Dépendances (déjà installé en local, à committer)

- `npm install --save-dev @types/react @types/react-dom` (faits : +3 packages).
  Sans eux, `strict` est inexploitable (TS7016/TS7026 sur tout le JSX).

## 2. Scripts `package.json` (Developer)

- `clean` : `rm -rf` → commande cross-platform sans dépendance :
  `node -e "const fs=require('fs');for(const p of ['dist','server.js']){fs.rmSync(p,{recursive:true,force:true})}"`.
- Nouveau `typecheck` : `tsc --noEmit`. `lint` inchangé (alias historique).
- `build` : `tsc --noEmit && vite build` (plus de dérive typage/build).

## 3. `tsconfig.json` : ajouter `"strict": true`

## 4. Corrections typage (~29 erreurs + retombées `| string`)

| Fichier | Erreur | Correctif prescrit |
|---|---|---|
| `Tab01Identification.tsx:51` | `title` possibly undefined | garde `?? ''` / optional chaining à l'affichage |
| `Tab06MeasurementsBench.tsx` (5×) | `thickness` possibly null | gardes explicites avant usage |
| `TrialDashboard.tsx:116-119` | filtre `"VALIDATED"` hors `TrialStatus` (bouton cassé : aucun essai ne matche, liste toujours vide) | AMENDEMENT Architect : conserver le bouton, mapper `VALIDATED` → `COMPLETED` dans le filtre (sens « campagnes validées/terminées »), typer l'état `'ALL' \| TrialStatus \| 'VALIDATED'` |
| `AnalysisEngine.ts` (4×), `TechnicalSynthesisGenerator.ts` (3×) | `targetStage` possibly undefined | garde précoce `if (!targetStage) …` (jamais `!` aveugle) |
| `color/gloss/persozEngine` | `string[]` vs `ReadingValidity[]` (`const validityStatuses = []`) | typer `ReadingValidity[]` explicitement |
| `recalculator.ts` (4×) | `alerts` implicit `any[]` | typer `MeasurementAlert[]` (import déjà partiel à compléter) |
| tests gate33/gate34/scientificEngine | `seriesConfigurations?` undefined, `boolean \| undefined` | gardes / `??` dans les tests uniquement |
| `types/trial.ts:43-70` | `WoodGrainOrientation`, `ExposureFace` terminés par `\| string` | retirer `\| string` ; si `tsc` révèle des assignations libres dans les formulaires, valider/caster à la frontière input (liste blanche), ne jamais ré-élargir le type |

Règles : pas de `any` ajouté, pas de `!` non justifié sur données métier, pas de changement
de comportement (gardes = mêmes valeurs affichées qu'avant, `??` avec fallback identique au rendu actuel).

## 5. Hors périmètre

Moteurs de calcul (formules), `trialStore`, exports, manifest, découpage god files, ESLint/Prettier.

## 6. Tests (Tester)

`npm run typecheck` (0 erreur), `npm test` (195/195), `npm run build` (OK).
Vérifier `npm run clean` sous Windows (supprime `dist/`, exit 0).
