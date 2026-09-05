# QUV-LAB v1.2.0 — GUIDE DE DÉPLOIEMENT & EXÉCUTION

## 1. Prérequis Système
- **Node.js :** Version 18.x ou 20.x LTS
- **Gestionnaire de paquets :** npm (version 9+)
- **Navigateurs supportés :** Google Chrome (v110+), Mozilla Firefox (v110+), Microsoft Edge (v110+)

## 2. Commandes Opérationnelles Standard

### Installation des dépendances
```bash
npm install
```

### Validation des types et linting
```bash
npm run lint
```

### Exécution de la suite complète de tests de qualification (195 tests)
```bash
npx tsx run_tests.ts
```

### Construction de l'artefact de production
```bash
npm run build
```

### Prévisualisation locale de l'artefact de production
```bash
npm run preview
```

### Démarrage en mode développement local (Port 3000)
```bash
npm run dev
```
