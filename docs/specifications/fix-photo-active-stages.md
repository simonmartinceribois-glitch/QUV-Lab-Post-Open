# SPEC — fix/photo-active-stages (MEDIUM, base `develop`)

> Demande utilisateur (2026-09-04) : matrice synoptique + chronologie limitées aux jalons
> du plan de mesurage (actifs), comme la paillasse Tab06 (G54-CAL-13). Extension cohérente :
> sélecteur de jalon du modal d'ajout (ne pas créer de photo sur un jalon INACTIVE).
> Filtre galerie : hors périmètre (simple filtre, pas de planification).

## 1. Modifications (Developer)

- `PhotoTimelineView` : `trial.stages.map` → jalons actifs (`getActiveStages`, `panelUtils`,
  déjà source de vérité : `status !== 'INACTIVE'`) ; compteur « sur N jalons » aligné.
- `PhotoMatrixView` : idem (2 occurrences : en-tête + colonnes).
- `PhotoAddModal` : options du select jalon → jalons actifs uniquement.
- `useMemo(() => getActiveStages(trial.stages), [trial.stages])` dans chaque vue.

## 2. Effets assumés

- Photos éventuellement existantes sur un jalon INACTIVE : masquées de chronologie/matrice
  (toujours visibles en galerie) ; pas de suppression de données.
- Plus de création de cliché vers un jalon INACTIVE depuis photothèque/modal.

## 3. Hors périmètre

Modèle, store, calculs, normatif, autres vues.

## 4. Tests

`typecheck` (0), `npm test` (195/195), `build` OK + vérif visuelle humaine (plan restreint
T0+C12 : matrice/chrono n'affichent que 2 colonnes/jalons).
