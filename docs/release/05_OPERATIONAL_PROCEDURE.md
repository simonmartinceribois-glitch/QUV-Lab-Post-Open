# QUV-LAB v1.2.0 — PROCÉDURES OPÉRATIONNELLES D'EXPLOITATION

## 1. Cycle de Vie d'un Essai en Laboratoire
```text
CRÉATION ESSAI ──► T0 PAILLASSE ──► VALIDATION T0 ──► CYCLES C1..C12 ──► CLÔTURE & RAPPORT
       │                 │                │                 │                   │
       ▼                 ▼                ▼                 ▼                   ▼
Configuration      Saisie 4 familles  Verrouillage      Acquisitions        Rapport 19 sections
NF EN 927-6        & Contrôle $T$     Export JSON       & Sauvegardes       + Archive JSON
```

## 2. Checklist Pré-Vol de Création d'Essai
- [ ] Référence unique de l'essai renseignée (ex: `QUV-2026-001`).
- [ ] Opérateur et client identifiés.
- [ ] Substrat, essence et dimensions ($150 \times 75 \times 15\text{ mm}$) vérifiés.
- [ ] Lots et finitions paramétrés avec 4 éprouvettes par lot ($1\text{ Témoin } T + 3\text{ Exposées}$).
- [ ] Familles scientifiques activées (Couleur, Brillance, Persoz, Observations).
- [ ] Jalons d'exposition initialisés jusqu'à 2016 h.

## 3. Procédure de Saisie et Contrôle Qualité
1. Sélectionner le jalon actif et l'éprouvette ciblée dans l'onglet **« 06. Mesures Paillasse »**.
2. Réaliser la saisie des points physiques (4 points $L^*a^*b^*$, 2 séries brillance 60°, 3 amortissements Persoz, cotations ISO).
3. Contrôler les alertes de dispersion et l'absence d'anomalies dans l'onglet **« 07. Contrôle Qualité »**.
4. Valider le jalon d'exposition.
5. **RÈGLE CRITIQUE :** Exporter immédiatement le fichier JSON de sauvegarde.
