# QUV-LAB v1.2.0 — RELEASE NOTES
**Date de Release :** 01 Septembre 2026  
**Référentiel Normatif :** NF EN 927-6:2018  
**Statut :** Version Qualifiée pour Mise en Production Contrôlée (RELEASE QUALIFIED)

---

## 1. Vue d'Ensemble
QUV-Lab v1.2.0 est la solution métier de référence dédiée à la conduite, à la saisie de paillasse, au calcul statistique déterministe, à l'analyse multi-lots et au reporting normatif des essais de vieillissement accéléré UV sur finitions pour bois extérieurs.

## 2. Fonctionnalités et Capacités Validées
- **Modèle de Données Multi-Lots & Multi-Systèmes :** Gestion étanche des lots ($n$ lots par essai), 4 éprouvettes par lot ($1\text{ Témoin } T + 3\text{ Exposées } 1, 2, 3$).
- **Ségrégation Métrologique du Témoin $T$ :** Conservation intégrale dans le fichier brut `RAW CSV` et le rapport, avec exclusion mathématique absolue des cinétiques d'exposition.
- **Calendrier Normatif NF EN 927-6 :** 13 jalons stricts ($T_0$ obligatoire + 12 cycles de 168 h, jalon final à 2016 h).
- **Moteur Scientifique Déterministe :**
  - Couleur CIE 1976 $\Delta E^*_{ab}$ (4 points de mesure avec contrôle de répétabilité).
  - Brillance 60° GU selon ISO 2813 (Séries S1 parallèle et S2 perpendiculaire, formule de rétention $R = (G_C / G_{T0}) \times 100$).
  - Dureté d'amortissement pendulaire Persoz selon ISO 1522 / procédure labo (3 répétitions, calcul $s$ et $CV\%$).
  - Observations visuelles ISO 4628 (cloquage, craquelage, écaillage, farinage).
- **Rapport Scientifique NF EN 927-6 :** 19 sections normatives exhaustives + 6 annexes techniques (A à F).
- **Double Exportation & Archivage :** Génération native des fichiers `RAW CSV`, `REPORT CSV` et `JSON` d'archive intégrale.
- **Journal d'Audit Immuable :** Traçabilité chronologique *append-only* avec horodatage ISO et identification des opérateurs.
