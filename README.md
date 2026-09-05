# QUV-Lab — Formulaire & Dossier Technique

Application de suivi métrologique, d'acquisition de données et d'édition de rapports d'essais de vieillissement artificiel accéléré (exposition alternée UV-A 340 nm / condensation d'eau selon la norme **NF EN 927-6** pour revêtements sur bois).

---

## Technologies Utilisées

- **Frontend & Rendu :** React 19 (`react`, `react-dom`)
- **Langage & Typage :** TypeScript 5.8
- **Bundler & Outillage :** Vite 6
- **Styles :** Tailwind CSS v4 (`@tailwindcss/vite`)
- **Composants & Icônes :** Lucide React, Motion, Recharts
- **Stockage :** Persistance locale (`localStorage` navigateur), 100 % autonome sans dépendance backend

---

## Installation

Prérequis : **Node.js** (version 20+ recommandée) et **npm**.

```bash
npm install
```

---

## Commandes Disponibles

### Développement local
Démarre le serveur de développement Vite sur le port 3000 :
```bash
npm run dev
```

### Vérification TypeScript
Valide l'intégrité du typage statique sans générer de fichiers :
```bash
npx tsc --noEmit
```

### Tests automatisés
Lance l'ensemble des 561 tests scientifiques, calculatoires et de fidélité documentaire :
```bash
npm test
```

### Build de production
Compile l'application optimisée pour la production dans le dossier `dist/` :
```bash
npm run build
```

### Nettoyage du build
Supprime le dossier `dist/` généré :
```bash
npm run clean
```

---

## Organisation du Projet

```text
├── .github/              # Workflows CI GitHub Actions
├── docs/                 # Documentation technique, guides de déploiement et audits
├── public/               # Ressources statiques
├── src/
│   ├── components/       # Interface utilisateur
│   │   ├── bench/        # Interface du banc d'essai et état machine
│   │   ├── phototheque/  # Gestion des photos et imagerie d'éprouvettes
│   │   ├── trial-tabs/   # Onglets d'essai (Lots, Éprouvettes, Échéances, Acquisitions)
│   │   ├── wizard/       # Assistant de création et de configuration d'essai
│   │   └── results-subviews/ # Visualisations analytiques et graphiques cinétiques
│   ├── scientific/       # Cœur algorithmique et métrologique
│   │   ├── analysis/     # Recalculs, cinétiques, agrégateurs de populations
│   │   └── tests/        # Suites de tests de validation scientifique
│   ├── services/         # Services applicatifs (générateur de rapport fidèle, export CSV)
│   └── types/            # Déclarations TypeScript (essais, protocoles, métrologie)
├── index.html            # Point d'entrée HTML
├── package.json          # Dépendances et scripts
├── run_tests.ts          # Lanceur de tests d'intégration et unitaires
├── tsconfig.json         # Configuration TypeScript
└── vite.config.ts        # Configuration du bundler Vite
```

